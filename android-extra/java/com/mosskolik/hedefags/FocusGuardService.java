package com.mosskolik.hedefags;

import android.app.ActivityManager;
import android.app.AppOpsManager;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.usage.UsageEvents;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.graphics.PixelFormat;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.Process;
import android.provider.Settings;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.app.NotificationCompat;

import org.json.JSONObject;

import java.util.HashSet;
import java.util.Set;

/**
 * Odak bekçisi: çalışma saatinde dikkat dağıtan bir uygulama (ör. YouTube) açılırsa
 * ya da başlamış bir blokta sayaç çalışmıyorsa ekranın üstünde hatırlatıcı açar.
 * Kullanıcının kendi izin verdiği "kullanım erişimi" ve "diğer uygulamaların üzerinde göster"
 * yetkileriyle çalışır; hiçbir veri cihaz dışına gönderilmez.
 */
public class FocusGuardService extends Service {
    static final String CH_GUARD = "hedef_guard";
    static final String CH_ALERT = "hedef_alert";
    static final int NOTIF_ID = 4242;
    static final int ALERT_ID = 4243;
    static final long TICK_MS = 4000;

    static volatile boolean running = false;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private String currentPkg = "";
    private long lastQuery = 0;
    private long snoozeUntil = 0;
    private View overlay = null;
    private boolean overlayIsDistraction = false;
    private final Set<String> promptedBlocks = new HashSet<>();
    private final Set<String> enforcedBlocks = new HashSet<>();
    private long overlayShownAt = 0;
    private TextView countdownView = null;
    static final int STRICT_SECONDS = 15;     // sıkı modda uyarıdan sonra kapatmaya kalan süre
    static final int STRICT_IDLE_EXTRA = 10;  // sıkı modda uyarıdan kaç dk sonra uygulama açılır
    private String promptedDay = "";

    // ------------------------------------------------------------ izinler
    static boolean hasUsageAccess(Context c) {
        try {
            AppOpsManager ops = (AppOpsManager) c.getSystemService(Context.APP_OPS_SERVICE);
            int mode;
            if (Build.VERSION.SDK_INT >= 29) {
                mode = ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), c.getPackageName());
            } else {
                mode = ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, Process.myUid(), c.getPackageName());
            }
            return mode == AppOpsManager.MODE_ALLOWED;
        } catch (Exception e) {
            return false;
        }
    }

    static boolean hasOverlay(Context c) {
        return Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(c);
    }

    /** Ayarlara göre servisi başlatır ya da durdurur. */
    static void sync(Context c) {
        HedefState s = HedefState.load(c);
        Intent i = new Intent(c, FocusGuardService.class);
        if (s.guardEnabled() && hasUsageAccess(c)) {
            try {
                if (Build.VERSION.SDK_INT >= 26) c.startForegroundService(i);
                else c.startService(i);
            } catch (Exception ignored) { }
        } else if (running) {
            c.stopService(i);
        }
    }

    // ------------------------------------------------------------ yaşam döngüsü
    @Override
    public IBinder onBind(Intent intent) { return null; }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        createChannels();
        NotificationCompat.Builder nb = new NotificationCompat.Builder(this, CH_GUARD)
                .setSmallIcon(R.drawable.ic_stat_hedef)
                .setContentTitle("Odak bekçisi açık")
                .setContentText("Çalışma saatlerinde dikkat dağıtan uygulamalar için seni uyaracağım.")
                .setOngoing(true)
                .setPriority(NotificationCompat.PRIORITY_MIN)
                .setContentIntent(openAppIntent());
        try {
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(NOTIF_ID, nb.build(), ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
            } else {
                startForeground(NOTIF_ID, nb.build());
            }
        } catch (Exception e) {
            stopSelf();
            return START_NOT_STICKY;
        }
        running = true;
        handler.removeCallbacks(tick);
        handler.post(tick);
        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        running = false;
        handler.removeCallbacksAndMessages(null);
        removeOverlay();
        super.onDestroy();
    }

    private final Runnable tick = new Runnable() {
        @Override
        public void run() {
            try { check(); } catch (Exception ignored) { }
            if (running) handler.postDelayed(this, TICK_MS);
        }
    };

    // ------------------------------------------------------------ kontrol
    private void check() {
        HedefState s = HedefState.load(this);
        if (!s.guardEnabled() || !hasUsageAccess(this)) {
            stopSelf();
            return;
        }
        PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
        if (pm != null && !pm.isInteractive()) return;

        updateForegroundApp();
        String today = HedefState.todayKey();
        if (!today.equals(promptedDay)) { promptedDay = today; promptedBlocks.clear(); enforcedBlocks.clear(); }
        boolean strict = s.guard().optBoolean("strict", false) && hasOverlay(this);

        if (getPackageName().equals(currentPkg)) { removeOverlay(); return; }
        if (overlay != null && !overlayIsDistraction && System.currentTimeMillis() - overlayShownAt > 3 * 60_000) removeOverlay();

        JSONObject block = s.currentBlock();
        boolean studyTime = s.timerRunning() || block != null;
        boolean goalOpen = s.goalMinutes() > 0 && s.todayMinutes() < s.goalMinutes();
        boolean guardNow = "goal".equals(s.guard().optString("mode", "blocks")) ? (studyTime || goalOpen) : studyTime;
        boolean distracting = s.guardApps().contains(currentPkg);

        if (overlay != null && overlayIsDistraction && !distracting) removeOverlay();
        if (System.currentTimeMillis() < snoozeUntil) return;

        if (guardNow && distracting) {
            if (overlay != null && overlayIsDistraction && strict) {
                long secs = STRICT_SECONDS - (System.currentTimeMillis() - overlayShownAt) / 1000;
                if (secs <= 0) { enforce(currentPkg, "Uyarıya rağmen devam ettin; uygulamayı kapattım. Şimdi ders zamanı."); return; }
                if (countdownView != null) countdownView.setText(secs + " saniye sonra bu uygulama kapatılacak");
                return;
            }
            if (overlay == null) {
                String app = s.guard().optJSONObject("labels") != null
                        ? s.guard().optJSONObject("labels").optString(currentPkg, "Bu uygulama") : "Bu uygulama";
                String what = s.timerRunning() ? s.timerSubject() + " sayacın çalışıyor."
                        : block != null ? "Şu an " + block.optString("start") + " " + block.optString("name") + " bloğundasın."
                        : "Bugünkü hedefini henüz tamamlamadın (" + HedefWidget.fmtMin(s.todayMinutes()) + " / " + HedefWidget.fmtMin(s.goalMinutes()) + ").";
                int left = s.daysLeft();
                showOverlay("📵 " + app + " şimdi değil",
                        what + (left >= 0 ? " AGS’ye " + left + " gün kaldı." : "") + " Videolar bekleyebilir; hedefin beklemez.",
                        true, strict);
            }
            return;
        }

        if (block != null && !s.timerRunning() && !s.doneToday().contains(block.optString("id"))) {
            int grace = s.guard().optInt("graceMin", 10);
            int since = HedefState.nowMinutes() - HedefState.toMin(block.optString("start"));
            String bid = block.optString("id");
            if (since >= grace && !promptedBlocks.contains(bid) && overlay == null) {
                promptedBlocks.add(bid);
                showOverlay("⏰ Bloğun başladı",
                        block.optString("name") + " bloğu " + since + " dakikadır seni bekliyor. Uygulamayı açıp sayacı başlat — 25 dakika bile yeter."
                                + (strict ? " Sıkı mod açık: " + STRICT_IDLE_EXTRA + " dakika içinde başlamazsan uygulamayı senin için açacağım." : ""),
                        false, false);
            } else if (strict && since >= grace + STRICT_IDLE_EXTRA && !enforcedBlocks.contains(bid)) {
                enforcedBlocks.add(bid);
                enforce(null, block.optString("name") + " bloğu " + since + " dakikadır bekliyor. Sayacı başlat ve çalışmaya başla.");
            }
        }
    }

    @SuppressWarnings("deprecation")
    private void updateForegroundApp() {
        UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
        if (usm == null) return;
        long now = System.currentTimeMillis();
        long begin = lastQuery == 0 ? now - 5 * 60_000 : lastQuery - 2000;
        UsageEvents events = usm.queryEvents(begin, now);
        UsageEvents.Event e = new UsageEvents.Event();
        while (events != null && events.hasNextEvent()) {
            events.getNextEvent(e);
            if (e.getEventType() == UsageEvents.Event.MOVE_TO_FOREGROUND) currentPkg = e.getPackageName();
        }
        lastQuery = now;
    }

    // ------------------------------------------------------------ ekran üstü hatırlatıcı
    private int dp(float v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics());
    }

    private Button button(String text, boolean primary) {
        Button b = new Button(this);
        b.setText(text);
        b.setAllCaps(false);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 17);
        b.setTextColor(primary ? Color.parseColor("#062019") : Color.WHITE);
        GradientDrawable bg = new GradientDrawable();
        bg.setCornerRadius(dp(14));
        if (primary) bg.setColor(Color.parseColor("#3fb59a"));
        else { bg.setColor(Color.TRANSPARENT); bg.setStroke(dp(1.5f), Color.parseColor("#93a19a")); }
        b.setBackground(bg);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(54));
        lp.topMargin = dp(12);
        b.setLayoutParams(lp);
        return b;
    }

    /** Sıkı mod: dikkat dağıtan uygulamayı ekrandan kaldırır, arka plan işlemini kapatır ve çalışma ekranını açar. */
    private void enforce(final String pkg, String message) {
        removeOverlay();
        HedefState.prefs(this).edit().putString("openTab", "study").putString("openMsg", message).apply();
        try {
            Intent open = new Intent(this, MainActivity.class);
            open.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
            startActivity(open);
        } catch (Exception e) {
            try { openAppIntent().send(); } catch (Exception ignored) { }
        }
        if (pkg != null && !pkg.isEmpty()) {
            handler.postDelayed(() -> {
                try {
                    ActivityManager am = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
                    if (am != null) am.killBackgroundProcesses(pkg);
                } catch (Exception ignored) { }
            }, 1500);
        }
        postAlert("Ders zamanı 📚", message);
    }

    private void showOverlay(String title, String body, final boolean distraction, final boolean strict) {
        if (!hasOverlay(this)) { postAlert(title, body); return; }
        removeOverlay();
        final WindowManager wm = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        if (wm == null) return;

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setBackgroundColor(Color.parseColor("#F00F1412"));
        root.setPadding(dp(28), dp(28), dp(28), dp(28));

        TextView brand = new TextView(this);
        brand.setText("HEDEF AGS · ODAK BEKÇİSİ");
        brand.setTextColor(Color.parseColor("#d6a94a"));
        brand.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        brand.setLetterSpacing(0.08f);
        root.addView(brand);

        TextView t = new TextView(this);
        t.setText(title);
        t.setTextColor(Color.WHITE);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, 28);
        t.setTypeface(t.getTypeface(), android.graphics.Typeface.BOLD);
        t.setPadding(0, dp(10), 0, dp(10));
        t.setGravity(Gravity.CENTER);
        root.addView(t);

        TextView b = new TextView(this);
        b.setText(body);
        b.setTextColor(Color.parseColor("#d0dad5"));
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 17);
        b.setGravity(Gravity.CENTER);
        b.setPadding(0, 0, 0, dp(18));
        root.addView(b);

        Button go = button("Çalışmaya dön", true);
        go.setOnClickListener(v -> {
            removeOverlay();
            try { openAppIntent().send(); } catch (Exception ignored) { }
        });
        root.addView(go);

        countdownView = null;
        if (distraction && strict) {
            TextView cd = new TextView(this);
            cd.setText(STRICT_SECONDS + " saniye sonra bu uygulama kapatılacak");
            cd.setTextColor(Color.parseColor("#e0b24f"));
            cd.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
            cd.setGravity(Gravity.CENTER);
            cd.setPadding(0, dp(16), 0, 0);
            root.addView(cd);
            countdownView = cd;
        } else {
            Button later = button(distraction ? "5 dakika izin ver" : "Daha sonra", false);
            later.setOnClickListener(v -> {
                if (distraction) snoozeUntil = System.currentTimeMillis() + 5 * 60_000;
                removeOverlay();
            });
            root.addView(later);
        }

        int type = Build.VERSION.SDK_INT >= 26
                ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                : WindowManager.LayoutParams.TYPE_PHONE;
        WindowManager.LayoutParams lp = new WindowManager.LayoutParams(
                WindowManager.LayoutParams.MATCH_PARENT,
                WindowManager.LayoutParams.MATCH_PARENT,
                type,
                WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
                        | WindowManager.LayoutParams.FLAG_FULLSCREEN | WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT);
        lp.gravity = Gravity.CENTER;
        try {
            wm.addView(root, lp);
            overlay = root;
            overlayIsDistraction = distraction;
            overlayShownAt = System.currentTimeMillis();
        } catch (Exception e) {
            postAlert(title, body);
        }
    }

    private void removeOverlay() {
        if (overlay == null) return;
        try {
            WindowManager wm = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
            if (wm != null) wm.removeView(overlay);
        } catch (Exception ignored) { }
        overlay = null;
    }

    // ------------------------------------------------------------ bildirim yedeği
    private PendingIntent openAppIntent() {
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(this, 1, open, flags);
    }

    private void createChannels() {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        nm.createNotificationChannel(new NotificationChannel(CH_GUARD, "Odak bekçisi (arka plan)", NotificationManager.IMPORTANCE_MIN));
        nm.createNotificationChannel(new NotificationChannel(CH_ALERT, "Odak uyarıları", NotificationManager.IMPORTANCE_HIGH));
    }

    private void postAlert(String title, String body) {
        createChannels();
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        NotificationCompat.Builder nb = new NotificationCompat.Builder(this, CH_ALERT)
                .setSmallIcon(R.drawable.ic_stat_hedef)
                .setContentTitle(title)
                .setContentText(body)
                .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
                .setContentIntent(openAppIntent());
        try { nm.notify(ALERT_ID, nb.build()); } catch (Exception ignored) { }
    }
}
