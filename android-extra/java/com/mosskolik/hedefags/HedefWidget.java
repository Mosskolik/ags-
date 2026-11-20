package com.mosskolik.hedefags;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.widget.RemoteViews;

import org.json.JSONObject;

/** Ana ekran widget'ı: sınava kalan gün, bugünkü ilerleme, sıradaki blok. */
public class HedefWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        updateAll(context);
    }

    /** Uygulamayı belirli bir sekmede açan dokunma eylemi. */
    static PendingIntent openIntent(Context context, String tab, int requestCode) {
        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        open.putExtra("tab", tab);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(context, requestCode, open, flags);
    }

    /** Üç widget türünü de günceller ve bir sonraki yenilemeyi kurar. */
    static void updateAll(Context context) {
        updateMascot(context);
        ScheduleWidget.update(context);
        CountdownWidget.update(context);
        WidgetRefreshReceiver.scheduleNext(context);
    }

    static int count(Context context) {
        AppWidgetManager m = AppWidgetManager.getInstance(context);
        int n = 0;
        for (Class<?> c : new Class<?>[]{HedefWidget.class, ScheduleWidget.class, CountdownWidget.class}) {
            int[] ids = m.getAppWidgetIds(new ComponentName(context, c));
            if (ids != null) n += ids.length;
        }
        return n;
    }

    static void updateMascot(Context context) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(context);
            int[] ids = m.getAppWidgetIds(new ComponentName(context, HedefWidget.class));
            if (ids == null || ids.length == 0) return;
            RemoteViews v = build(context);
            for (int id : ids) m.updateAppWidget(id, v);
        } catch (Exception ignored) { }
    }

    static String fmtMin(int m) {
        int h = m / 60, r = m % 60;
        if (h == 0) return r + " dk";
        return r == 0 ? h + " sa" : h + " sa " + r + " dk";
    }

    static RemoteViews build(Context context) {
        HedefState s = HedefState.load(context);
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_hedef);

        int left = s.daysLeft();
        v.setTextViewText(R.id.w_days, left >= 0 ? String.valueOf(left) : "—");
        v.setTextViewText(R.id.w_days_label, "gün · AGS");

        String mood = s.mood();
        int img;
        switch (mood) {
            case "happy": img = R.drawable.mascot_happy; break;
            case "worried": img = R.drawable.mascot_worried; break;
            case "sad": img = R.drawable.mascot_sad; break;
            case "sleep": img = R.drawable.mascot_sleep; break;
            default: img = R.drawable.mascot_ok;
        }
        android.graphics.Bitmap custom = null;
        try {
            java.io.File f = new java.io.File(context.getFilesDir(), "mascot_" + mood + ".png");
            if (f.exists()) custom = android.graphics.BitmapFactory.decodeFile(f.getAbsolutePath());
        } catch (Exception ignored) { }
        if (custom != null) v.setImageViewBitmap(R.id.w_mascot, custom);
        else v.setImageViewResource(R.id.w_mascot, img);
        v.setTextViewText(R.id.w_say, HedefState.moodLine(mood));

        int done = s.todayMinutes(), goal = s.goalMinutes();
        v.setTextViewText(R.id.w_today, goal > 0 ? "Bugün " + fmtMin(done) + " / " + fmtMin(goal) : "Bugün " + fmtMin(done));
        v.setProgressBar(R.id.w_progress, 100, goal > 0 ? Math.min(100, done * 100 / goal) : 0, false);

        String next;
        if (s.timerRunning()) {
            next = "⏱ Çalışıyorsun: " + s.timerSubject();
        } else {
            JSONObject b = s.nextBlock();
            int missed = s.missedCount();
            if (b != null) next = (missed > 0 ? "⚠ " + missed + " blok kaçtı · " : "") + "Sıradaki: " + b.optString("start") + " " + b.optString("name");
            else if (s.todayBlocks().length() == 0) next = "Bugün dinlenme günü";
            else if (s.allDone()) next = "Bugünkü bloklar tamam ✓";
            else next = "⚠ " + missed + " blok kaçtı — 25 dk çalışarak telafi et";
        }
        v.setTextViewText(R.id.w_next, next);
        int st = s.streak();
        int coins = s.json.optInt("coins", 0);
        v.setTextViewText(R.id.w_streak, (st > 0 ? "🔥 " + st + "  " : "") + "🥕 " + coins);

        v.setTextViewText(R.id.w_quote, s.quoteOfDay());

        v.setOnClickPendingIntent(R.id.w_root, openIntent(context, "ahir", 9));
        return v;
    }
}
