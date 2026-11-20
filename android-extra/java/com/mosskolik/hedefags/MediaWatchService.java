package com.mosskolik.hedefags;

import android.content.ComponentName;
import android.content.Context;
import android.media.MediaMetadata;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import android.service.notification.NotificationListenerService;

import androidx.core.app.NotificationManagerCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Bildirim erişimi verildiğinde Android, çalan medyanın başlığını ve kanal adını
 * okumamıza izin verir. Bu servis yalnızca bu izni almak için vardır; bildirimleri okumaz,
 * hiçbir veri cihaz dışına gönderilmez.
 */
public class MediaWatchService extends NotificationListenerService {

    static final int LESSON = 1, OTHER = 0, NONE = -1;

    static boolean enabled(Context c) {
        return NotificationManagerCompat.getEnabledListenerPackages(c).contains(c.getPackageName());
    }

    /** Türkçe karakterleri sadeleştirip küçük harfe çevirir: "Fıkıh Usûlü" → "fikih usulu" */
    static String norm(String s) {
        if (s == null) return "";
        String x = s.toLowerCase(new Locale("tr", "TR"))
                .replace('ı', 'i').replace('ş', 's').replace('ğ', 'g')
                .replace('ü', 'u').replace('ö', 'o').replace('ç', 'c');
        x = Normalizer.normalize(x, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        return x.replaceAll("\\s+", " ").trim();
    }

    /**
     * Ön plandaki uygulamada çalan videoyu kontrol eder.
     * LESSON: ders kanalı ya da başlıkta anahtar kelime var; OTHER: başka bir video çalıyor; NONE: video çalmıyor.
     */
    static int check(Context c, String pkg, HedefState s) {
        try {
            MediaSessionManager msm = (MediaSessionManager) c.getSystemService(Context.MEDIA_SESSION_SERVICE);
            if (msm == null) return NONE;
            List<MediaController> list = msm.getActiveSessions(new ComponentName(c, MediaWatchService.class));
            for (MediaController mc : list) {
                if (!pkg.equals(mc.getPackageName())) continue;
                PlaybackState ps = mc.getPlaybackState();
                MediaMetadata md = mc.getMetadata();
                if (md == null) continue;
                boolean playing = ps != null && (ps.getState() == PlaybackState.STATE_PLAYING || ps.getState() == PlaybackState.STATE_BUFFERING);
                String title = md.getString(MediaMetadata.METADATA_KEY_TITLE);
                String channel = md.getString(MediaMetadata.METADATA_KEY_ARTIST);
                if (channel == null || channel.isEmpty()) channel = md.getString(MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE);
                if (title == null || title.isEmpty()) continue;
                boolean lesson = isLesson(title, channel, s);
                HedefState.prefs(c).edit()
                        .putString("lastMediaTitle", title)
                        .putString("lastMediaChannel", channel == null ? "" : channel)
                        .putString("lastMediaVerdict", lesson ? "lesson" : "other")
                        .apply();
                if (!playing) return NONE;
                return lesson ? LESSON : OTHER;
            }
        } catch (SecurityException e) {
            return NONE; // izin geri alınmış
        } catch (Exception ignored) { }
        return NONE;
    }

    static String lastTitle(Context c) {
        return HedefState.prefs(c).getString("lastMediaTitle", "");
    }

    static boolean isLesson(String title, String channel, HedefState s) {
        JSONObject media = s.guard().optJSONObject("media");
        if (media == null) return false;
        String ch = norm(channel);
        JSONArray chans = media.optJSONArray("channels");
        if (chans != null && !ch.isEmpty()) {
            for (int i = 0; i < chans.length(); i++) {
                String want = norm(chans.optString(i));
                if (want.length() >= 2 && (ch.equals(want) || (want.length() >= 4 && ch.contains(want)) || (ch.length() >= 4 && want.contains(ch)))) return true;
            }
        }
        String t = " " + norm(title) + " ";
        JSONArray kws = media.optJSONArray("keywords");
        if (kws != null) {
            for (int i = 0; i < kws.length(); i++) {
                String k = norm(kws.optString(i));
                if (k.isEmpty()) continue;
                if (k.length() <= 4) {
                    // kısa kelimeler (ags, meb, öabt…) tam kelime olarak aranır
                    if (Pattern.compile("(^|[^a-z0-9])" + Pattern.quote(k) + "([^a-z0-9]|$)").matcher(t).find()) return true;
                } else if (t.contains(k)) {
                    return true;
                }
            }
        }
        return false;
    }
}
