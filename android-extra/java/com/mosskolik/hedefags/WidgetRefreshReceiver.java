package com.mosskolik.hedefags;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;

/**
 * Widget'ları blok başlangıç/bitiş saatlerinde (ve en geç 15 dakikada bir) yeniler,
 * böylece ders programı widget'ı "şimdi ne çalışmalıyım" sorusuna hep güncel cevap verir.
 */
public class WidgetRefreshReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        HedefWidget.updateAll(context);
    }

    static void scheduleNext(Context context) {
        try {
            HedefState s = HedefState.load(context);
            int now = HedefState.nowMinutes();
            int next = 24 * 60; // gece yarısı
            JSONArray bl = s.todayBlocks();
            for (int i = 0; i < bl.length(); i++) {
                JSONObject b = bl.optJSONObject(i);
                int st = HedefState.toMin(b.optString("start"));
                int en = st + b.optInt("minutes", 0);
                if (st > now && st < next) next = st;
                if (en > now && en < next) next = en;
            }
            if (next - now > 15 && now >= 6 * 60) next = now + 15; // gün içinde en geç 15 dk'da bir
            Calendar c = Calendar.getInstance();
            c.set(Calendar.SECOND, 5);
            c.set(Calendar.MILLISECOND, 0);
            c.set(Calendar.HOUR_OF_DAY, 0);
            c.set(Calendar.MINUTE, 0);
            c.add(Calendar.MINUTE, next);
            long at = c.getTimeInMillis();

            Intent i = new Intent(context, WidgetRefreshReceiver.class);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= 23) flags |= PendingIntent.FLAG_IMMUTABLE;
            PendingIntent pi = PendingIntent.getBroadcast(context, 77, i, flags);
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            boolean exact = Build.VERSION.SDK_INT < 31 || am.canScheduleExactAlarms();
            if (Build.VERSION.SDK_INT >= 23) {
                if (exact) am.setExactAndAllowWhileIdle(AlarmManager.RTC, at, pi);
                else am.setAndAllowWhileIdle(AlarmManager.RTC, at, pi);
            } else {
                am.set(AlarmManager.RTC, at, pi);
            }
        } catch (Exception ignored) { }
    }
}
