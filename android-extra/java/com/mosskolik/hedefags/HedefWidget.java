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
        for (int id : ids) manager.updateAppWidget(id, build(context));
    }

    static void updateAll(Context context) {
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
            next = b == null ? "Bugünkü bloklar tamam ✓" : "Sıradaki: " + b.optString("start") + " " + b.optString("name");
        }
        v.setTextViewText(R.id.w_next, next);
        int st = s.streak();
        int coins = s.json.optInt("coins", 0);
        v.setTextViewText(R.id.w_streak, (st > 0 ? "🔥 " + st + "  " : "") + "🥕 " + coins);

        v.setTextViewText(R.id.w_quote, s.quoteOfDay());

        Intent open = new Intent(context, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
        v.setOnClickPendingIntent(R.id.w_root, PendingIntent.getActivity(context, 0, open, flags));
        return v;
    }
}
