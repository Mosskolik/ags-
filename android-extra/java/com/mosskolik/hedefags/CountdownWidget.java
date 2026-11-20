package com.mosskolik.hedefags;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.widget.RemoteViews;

/** Küçük geri sayım widget'ı: AGS'ye kalan gün, bugünkü süre, seri ve havuç. */
public class CountdownWidget extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        HedefWidget.updateAll(context);
    }

    static void update(Context context) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(context);
            int[] ids = m.getAppWidgetIds(new ComponentName(context, CountdownWidget.class));
            if (ids == null || ids.length == 0) return;
            RemoteViews v = build(context);
            for (int id : ids) m.updateAppWidget(id, v);
        } catch (Exception ignored) { }
    }

    static RemoteViews build(Context context) {
        HedefState s = HedefState.load(context);
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_countdown);
        int left = s.daysLeft();
        v.setTextViewText(R.id.c_days, left >= 0 ? String.valueOf(left) : "—");
        String d = s.json.optString("agsDate", "");
        String[] months = {"Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"};
        String when = "";
        try { when = Integer.parseInt(d.substring(8, 10)) + " " + months[Integer.parseInt(d.substring(5, 7)) - 1]; } catch (Exception ignored) { }
        v.setTextViewText(R.id.c_label, "gün kaldı · AGS " + when);
        int done = s.todayMinutes(), goal = s.goalMinutes();
        v.setTextViewText(R.id.c_today, goal > 0 ? HedefWidget.fmtMin(done) + " / " + HedefWidget.fmtMin(goal) : HedefWidget.fmtMin(done));
        v.setProgressBar(R.id.c_progress, 100, goal > 0 ? Math.min(100, done * 100 / goal) : 0, false);
        v.setTextViewText(R.id.c_stats, "🔥 " + s.streak() + "   🥕 " + s.json.optInt("coins", 0));
        v.setOnClickPendingIntent(R.id.c_root, HedefWidget.openIntent(context, "today", 11));
        return v;
    }
}
