package com.mosskolik.hedefags;

import android.app.AlarmManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.app.NotificationCompat;

/**
 * Çalışma süresi / mola bitince çalan alarm. Çalar saat uygulamaları gibi çalışır:
 * alarm sesiyle tam ekran bildirim gösterir ve Hedef AGS'yi öne getirip
 * "süre doldu" penceresini açar — uygulama kapalı ya da ekran kilitli olsa bile.
 */
public class TimerAlarmReceiver extends BroadcastReceiver {
    static final String CHANNEL = "hedef-alarm-fs";
    static final String EXTRA_KIND = "kind";     // "timeup" | "breakend"
    static final String EXTRA_TITLE = "title";
    static final String EXTRA_BODY = "body";

    // ------------------------------------------------------------ kurma / iptal
    private static PendingIntent broadcast(Context c, int id, String kind, String title, String body, boolean create) {
        Intent i = new Intent(c, TimerAlarmReceiver.class);
        i.putExtra(EXTRA_KIND, kind).putExtra(EXTRA_TITLE, title).putExtra(EXTRA_BODY, body);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(c, 500 + id, i, flags);
    }

    static PendingIntent activity(Context c, String kind, int requestCode) {
        Intent open = new Intent(c, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        open.putExtra("tab", "study").putExtra("alarm", true).putExtra("reason", kind);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(c, requestCode, open, flags);
    }

    static boolean canExact(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        return am != null && (Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms());
    }

    static void schedule(Context c, int id, long at, String kind, String title, String body) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        PendingIntent pi = broadcast(c, id, kind, title, body, true);
        try {
            if (canExact(c)) {
                // çalar saat alarmı: tam zamanında çalar, durum çubuğunda alarm simgesi görünür
                am.setAlarmClock(new AlarmManager.AlarmClockInfo(at, activity(c, kind, 600 + id)), pi);
            } else if (Build.VERSION.SDK_INT >= 23) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, at, pi);
            }
        } catch (SecurityException e) {
            if (Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }

    static void cancel(Context c, int id) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am != null) am.cancel(broadcast(c, id, "", "", "", false));
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm != null) nm.cancel(700 + id);
    }

    // ------------------------------------------------------------ alarm çaldığında
    @Override
    public void onReceive(Context c, Intent intent) {
        String kind = intent.getStringExtra(EXTRA_KIND);
        if (kind == null) kind = "timeup";
        String title = intent.getStringExtra(EXTRA_TITLE);
        String body = intent.getStringExtra(EXTRA_BODY);
        int id = "breakend".equals(kind) ? 3 : 1;

        HedefState.prefs(c).edit().putString("openTab", "study").putString("openReason", kind).putString("openMsg", "").apply();
        createChannel(c);

        PendingIntent full = activity(c, kind, 800 + id);
        NotificationCompat.Builder nb = new NotificationCompat.Builder(c, CHANNEL)
                .setSmallIcon(R.drawable.ic_stat_hedef)
                .setColor(0xFF0F5C4D)
                .setContentTitle(title == null ? "⏰ Süre doldu" : title)
                .setContentText(body == null ? "" : body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body == null ? "" : body))
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setContentIntent(full)
                .setFullScreenIntent(full, true);
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        try { if (nm != null) nm.notify(700 + id, nb.build()); } catch (Exception ignored) { }

        // "diğer uygulamaların üzerinde göster" izni varsa uygulamayı doğrudan öne getir
        if (Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(c)) {
            try {
                Intent open = new Intent(c, MainActivity.class);
                open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
                open.putExtra("tab", "study").putExtra("alarm", true).putExtra("reason", kind);
                c.startActivity(open);
            } catch (Exception ignored) { }
        }
        HedefWidget.updateAll(c);
    }

    static void createChannel(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || nm.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "Sayaç ve mola alarmı", NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("Çalışma süresi ya da mola bitince çalar ve uygulamayı açar");
        Uri sound = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + c.getPackageName() + "/raw/alarm_chime");
        ch.setSound(sound, new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ALARM).setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build());
        ch.enableVibration(true);
        ch.setVibrationPattern(new long[]{0, 400, 200, 400, 200, 400});
        ch.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
        ch.setBypassDnd(true);
        nm.createNotificationChannel(ch);
    }
}
