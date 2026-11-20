package com.mosskolik.hedefags;

import android.Manifest;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.AlarmClock;
import android.provider.CalendarContract;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.TimeZone;

/** Web arayüzü ile Android özellikleri arasındaki köprü. */
@CapacitorPlugin(
        name = "Hedef",
        permissions = {
                @Permission(alias = "calendar", strings = {Manifest.permission.READ_CALENDAR, Manifest.permission.WRITE_CALENDAR})
        }
)
public class HedefPlugin extends Plugin {

    private Context ctx() { return getContext(); }

    /** Uygulama durumunu kaydeder; widget'ı ve odak bekçisini günceller. */
    @PluginMethod
    public void update(PluginCall call) {
        String json = call.getString("json");
        if (json != null) HedefState.save(ctx(), json);
        HedefWidget.updateAll(ctx());
        FocusGuardService.sync(ctx());
        call.resolve();
    }

    /** Giydirilmiş maskot görselini (PNG, base64) widget için kaydeder. */
    @PluginMethod
    public void saveMascot(PluginCall call) {
        String mood = call.getString("mood", "");
        String data = call.getString("data", "");
        if (!mood.matches("happy|ok|worried|sad|sleep") || data.isEmpty()) { call.reject("geçersiz"); return; }
        try {
            byte[] bytes = android.util.Base64.decode(data, android.util.Base64.DEFAULT);
            java.io.File f = new java.io.File(ctx().getFilesDir(), "mascot_" + mood + ".png");
            try (java.io.FileOutputStream out = new java.io.FileOutputStream(f)) { out.write(bytes); }
            HedefWidget.updateAll(ctx());
            call.resolve();
        } catch (Exception e) {
            call.reject("kaydedilemedi");
        }
    }

    /** Odak bekçisi uygulamayı açtıysa hangi sekmeye gidileceğini bir kez verir. */
    @PluginMethod
    public void takeLaunchTab(PluginCall call) {
        android.content.SharedPreferences p = HedefState.prefs(ctx());
        JSObject r = new JSObject();
        r.put("tab", p.getString("openTab", ""));
        r.put("message", p.getString("openMsg", ""));
        r.put("reason", p.getString("openReason", ""));
        p.edit().remove("openTab").remove("openMsg").remove("openReason").apply();
        call.resolve(r);
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject r = new JSObject();
        r.put("usage", FocusGuardService.hasUsageAccess(ctx()));
        r.put("overlay", FocusGuardService.hasOverlay(ctx()));
        r.put("guardRunning", FocusGuardService.running);
        r.put("calendar", getPermissionState("calendar") == PermissionState.GRANTED);
        r.put("canPinWidget", Build.VERSION.SDK_INT >= 26 && AppWidgetManager.getInstance(ctx()).isRequestPinAppWidgetSupported());
        r.put("widgets", HedefWidget.count(ctx()));
        call.resolve(r);
    }

    private void startSettings(Intent i, PluginCall call) {
        try {
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("Ayar ekranı açılamadı");
        }
    }

    @PluginMethod
    public void openUsageSettings(PluginCall call) {
        startSettings(new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS), call);
    }

    @PluginMethod
    public void openOverlaySettings(PluginCall call) {
        if (Build.VERSION.SDK_INT < 23) { call.resolve(); return; }
        startSettings(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + ctx().getPackageName())), call);
    }

    @PluginMethod
    public void openBatterySettings(PluginCall call) {
        if (Build.VERSION.SDK_INT < 23) { call.resolve(); return; }
        startSettings(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS), call);
    }

    /** Ana ekrana widget eklemeyi önerir (Android 8+ ve destekleyen başlatıcılar). */
    @PluginMethod
    public void pinWidget(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 26) {
            AppWidgetManager m = AppWidgetManager.getInstance(ctx());
            if (m.isRequestPinAppWidgetSupported()) {
                String kind = call.getString("kind", "mascot");
                Class<?> provider = "schedule".equals(kind) ? ScheduleWidget.class : "countdown".equals(kind) ? CountdownWidget.class : HedefWidget.class;
                m.requestPinAppWidget(new ComponentName(ctx(), provider), null, null);
                call.resolve();
                return;
            }
        }
        call.reject("unsupported");
    }

    /** Telefonun Saat uygulamasına alarm kurar. days: Calendar.SUNDAY(1) … SATURDAY(7) */
    @PluginMethod
    public void setAlarm(PluginCall call) {
        Intent i = new Intent(AlarmClock.ACTION_SET_ALARM);
        i.putExtra(AlarmClock.EXTRA_HOUR, call.getInt("hour", 8));
        i.putExtra(AlarmClock.EXTRA_MINUTES, call.getInt("minute", 0));
        i.putExtra(AlarmClock.EXTRA_MESSAGE, call.getString("message", "Hedef AGS"));
        i.putExtra(AlarmClock.EXTRA_SKIP_UI, true);
        i.putExtra(AlarmClock.EXTRA_VIBRATE, true);
        JSArray days = call.getArray("days");
        try {
            if (days != null && days.length() > 0) {
                ArrayList<Integer> list = new ArrayList<>();
                for (int k = 0; k < days.length(); k++) list.add(days.getInt(k));
                i.putExtra(AlarmClock.EXTRA_DAYS, list);
            }
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx().startActivity(i);
            call.resolve();
        } catch (Exception e) {
            call.reject("Saat uygulaması alarmı kabul etmedi");
        }
    }

    // ------------------------------------------------------------ takvim
    @PluginMethod
    public void addCalendarEvents(PluginCall call) {
        if (getPermissionState("calendar") != PermissionState.GRANTED) {
            requestPermissionForAlias("calendar", call, "calendarPermsCallback");
            return;
        }
        writeEvents(call);
    }

    @PermissionCallback
    private void calendarPermsCallback(PluginCall call) {
        if (getPermissionState("calendar") == PermissionState.GRANTED) writeEvents(call);
        else call.reject("Takvim izni verilmedi");
    }

    private long findCalendar(ContentResolver cr) {
        String[] proj = {CalendarContract.Calendars._ID, CalendarContract.Calendars.IS_PRIMARY};
        String sel = CalendarContract.Calendars.VISIBLE + "=1 AND " + CalendarContract.Calendars.CALENDAR_ACCESS_LEVEL + ">=" + CalendarContract.Calendars.CAL_ACCESS_CONTRIBUTOR;
        long first = -1;
        try (Cursor c = cr.query(CalendarContract.Calendars.CONTENT_URI, proj, sel, null, null)) {
            if (c == null) return -1;
            while (c.moveToNext()) {
                long id = c.getLong(0);
                if (first < 0) first = id;
                if (c.getInt(1) == 1) return id;
            }
        } catch (Exception ignored) { }
        return first;
    }

    private void deletePrevious(ContentResolver cr) {
        String prev = HedefState.prefs(ctx()).getString("calendarEvents", "");
        if (prev.isEmpty()) return;
        for (String id : prev.split(",")) {
            try { cr.delete(ContentUris.withAppendedId(CalendarContract.Events.CONTENT_URI, Long.parseLong(id)), null, null); }
            catch (Exception ignored) { }
        }
        HedefState.prefs(ctx()).edit().remove("calendarEvents").apply();
    }

    @PluginMethod
    public void removeCalendarEvents(PluginCall call) {
        if (getPermissionState("calendar") == PermissionState.GRANTED) deletePrevious(ctx().getContentResolver());
        call.resolve();
    }

    private void writeEvents(PluginCall call) {
        try {
            ContentResolver cr = ctx().getContentResolver();
            long calId = findCalendar(cr);
            if (calId < 0) { call.reject("Telefonda yazılabilir bir takvim bulunamadı"); return; }
            deletePrevious(cr);
            JSArray events = call.getArray("events");
            StringBuilder ids = new StringBuilder();
            int added = 0;
            String tz = TimeZone.getDefault().getID();
            for (int k = 0; events != null && k < events.length(); k++) {
                JSONObject o = events.getJSONObject(k);
                long start = o.getLong("start");
                long durMin = o.optLong("durationMin", 30);
                boolean allDay = o.optBoolean("allDay", false);
                String rrule = o.optString("rrule", "");
                ContentValues v = new ContentValues();
                v.put(CalendarContract.Events.CALENDAR_ID, calId);
                v.put(CalendarContract.Events.TITLE, o.optString("title", "Hedef AGS"));
                v.put(CalendarContract.Events.DESCRIPTION, o.optString("description", "Hedef AGS uygulamasından eklendi."));
                v.put(CalendarContract.Events.DTSTART, start);
                v.put(CalendarContract.Events.HAS_ALARM, 1);
                if (allDay) {
                    v.put(CalendarContract.Events.ALL_DAY, 1);
                    v.put(CalendarContract.Events.EVENT_TIMEZONE, "UTC");
                    v.put(CalendarContract.Events.DTEND, start + 86_400_000L);
                } else {
                    v.put(CalendarContract.Events.EVENT_TIMEZONE, tz);
                    if (rrule.isEmpty()) v.put(CalendarContract.Events.DTEND, start + durMin * 60_000L);
                    else {
                        v.put(CalendarContract.Events.RRULE, rrule);
                        v.put(CalendarContract.Events.DURATION, "P" + (durMin * 60) + "S");
                    }
                }
                Uri u = cr.insert(CalendarContract.Events.CONTENT_URI, v);
                if (u == null) continue;
                long eid = Long.parseLong(u.getLastPathSegment());
                ContentValues r = new ContentValues();
                r.put(CalendarContract.Reminders.EVENT_ID, eid);
                r.put(CalendarContract.Reminders.MINUTES, o.optInt("reminderMin", 10));
                r.put(CalendarContract.Reminders.METHOD, CalendarContract.Reminders.METHOD_ALERT);
                cr.insert(CalendarContract.Reminders.CONTENT_URI, r);
                if (ids.length() > 0) ids.append(',');
                ids.append(eid);
                added++;
            }
            HedefState.prefs(ctx()).edit().putString("calendarEvents", ids.toString()).apply();
            JSObject ret = new JSObject();
            ret.put("added", added);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Takvime eklenemedi: " + e.getMessage());
        }
    }
}
