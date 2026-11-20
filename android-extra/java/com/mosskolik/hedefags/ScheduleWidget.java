package com.mosskolik.hedefags;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;

/** Ders programı widget'ı: şu an ne çalışılmalı ve günün sıradaki blokları. */
public class ScheduleWidget extends AppWidgetProvider {

    private static final int[] ROWS = {R.id.s_row1, R.id.s_row2, R.id.s_row3, R.id.s_row4};

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        HedefWidget.updateAll(context);
    }

    static void update(Context context) {
        try {
            AppWidgetManager m = AppWidgetManager.getInstance(context);
            int[] ids = m.getAppWidgetIds(new ComponentName(context, ScheduleWidget.class));
            if (ids == null || ids.length == 0) return;
            RemoteViews v = build(context);
            for (int id : ids) m.updateAppWidget(id, v);
        } catch (Exception ignored) { }
    }

    private static String end(JSONObject b) {
        int e = HedefState.toMin(b.optString("start")) + b.optInt("minutes", 0);
        return String.format(java.util.Locale.US, "%02d:%02d", (e / 60) % 24, e % 60);
    }

    static RemoteViews build(Context context) {
        HedefState s = HedefState.load(context);
        RemoteViews v = new RemoteViews(context.getPackageName(), R.layout.widget_schedule);
        int now = HedefState.nowMinutes();
        Set<String> done = s.doneToday();

        // bugünün blokları, saate göre sıralı
        JSONArray arr = s.todayBlocks();
        List<JSONObject> blocks = new ArrayList<>();
        for (int i = 0; i < arr.length(); i++) blocks.add(arr.optJSONObject(i));
        Collections.sort(blocks, (a, b) -> HedefState.toMin(a.optString("start")) - HedefState.toMin(b.optString("start")));

        JSONObject cur = s.currentBlock();
        String label, title, sub;
        if (s.timerRunning()) {
            label = "⏱ ŞU AN ÇALIŞIYORSUN";
            title = s.timerSubject();
            sub = "Harika, sayaç açık. Bitince kaydetmeyi unutma.";
        } else if (cur != null && !done.contains(cur.optString("id"))) {
            int left = HedefState.toMin(cur.optString("start")) + cur.optInt("minutes", 0) - now;
            label = "ŞİMDİ ÇALIŞ · " + cur.optString("start") + "–" + end(cur);
            title = cur.optString("full", cur.optString("name"));
            sub = cur.optString("kind") + " · " + left + " dk kaldı";
        } else {
            JSONObject next = s.nextBlock();
            if (next != null) {
                int in = HedefState.toMin(next.optString("start")) - now;
                label = "SIRADAKİ · " + next.optString("start") + (in > 0 ? " (" + (in >= 60 ? (in / 60) + " sa " + (in % 60) + " dk" : in + " dk") + " sonra)" : "");
                title = next.optString("full", next.optString("name"));
                sub = next.optString("kind") + " · " + next.optInt("minutes") + " dk";
            } else if (blocks.isEmpty()) {
                label = "BUGÜN";
                title = "Dinlenme günü";
                sub = "Kısa bir tekrar yine de iyi gelir.";
            } else {
                label = "BUGÜN";
                title = "Program tamam ✓";
                sub = "Bugünkü bütün bloklar bitti. Tebrikler!";
            }
        }
        v.setTextViewText(R.id.s_label, label);
        v.setTextViewText(R.id.s_title, title);
        v.setTextViewText(R.id.s_sub, sub);

        // günün listesi: bitenler ✓, şimdiki ▶
        int row = 0;
        for (JSONObject b : blocks) {
            if (row >= ROWS.length) break;
            boolean isDone = done.contains(b.optString("id"));
            boolean isNow = cur != null && cur.optString("id").equals(b.optString("id"));
            String mark = isDone ? "✓ " : isNow ? "▶ " : "• ";
            v.setTextViewText(ROWS[row], mark + b.optString("start") + "  " + b.optString("name") + " · " + b.optString("kind"));
            v.setTextColor(ROWS[row], isNow ? 0xFFE0B24F : isDone ? 0x99FFFFFF : 0xFFFFFFFF);
            v.setViewVisibility(ROWS[row], android.view.View.VISIBLE);
            row++;
        }
        for (; row < ROWS.length; row++) v.setViewVisibility(ROWS[row], android.view.View.GONE);

        v.setTextViewText(R.id.s_count, s.daysLeft() >= 0 ? "AGS’ye " + s.daysLeft() + " gün" : "");
        v.setOnClickPendingIntent(R.id.s_root, HedefWidget.openIntent(context, "study", 10));
        return v;
    }
}
