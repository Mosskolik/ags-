package com.mosskolik.hedefags;

import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/** Uygulamanın (JS tarafı) widget ve odak bekçisi için kaydettiği özet durum. */
public final class HedefState {
    static final String PREFS = "hedef_native";
    static final String KEY_STATE = "state";

    final JSONObject json;

    private HedefState(JSONObject json) { this.json = json; }

    static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static HedefState load(Context ctx) {
        try {
            String raw = prefs(ctx).getString(KEY_STATE, null);
            if (raw != null) return new HedefState(new JSONObject(raw));
        } catch (Exception ignored) { }
        return new HedefState(new JSONObject());
    }

    static void save(Context ctx, String raw) {
        prefs(ctx).edit().putString(KEY_STATE, raw).apply();
    }

    static String todayKey() {
        Calendar c = Calendar.getInstance();
        return String.format(Locale.US, "%04d-%02d-%02d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }

    /** Pazartesi = 0 … Pazar = 6 */
    static int todayDow() {
        int d = Calendar.getInstance().get(Calendar.DAY_OF_WEEK); // Pazar = 1
        return (d + 5) % 7;
    }

    static int nowMinutes() {
        Calendar c = Calendar.getInstance();
        return c.get(Calendar.HOUR_OF_DAY) * 60 + c.get(Calendar.MINUTE);
    }

    static int toMin(String hhmm) {
        try {
            String[] p = hhmm.split(":");
            return Integer.parseInt(p[0]) * 60 + Integer.parseInt(p[1]);
        } catch (Exception e) { return 0; }
    }

    String name() { return json.optString("name", ""); }

    int daysLeft() {
        String d = json.optString("agsDate", "");
        if (d.length() < 10) return -1;
        try {
            Calendar exam = Calendar.getInstance();
            exam.clear();
            exam.set(Integer.parseInt(d.substring(0, 4)), Integer.parseInt(d.substring(5, 7)) - 1, Integer.parseInt(d.substring(8, 10)));
            Calendar today = Calendar.getInstance();
            Calendar t = Calendar.getInstance();
            t.clear();
            t.set(today.get(Calendar.YEAR), today.get(Calendar.MONTH), today.get(Calendar.DAY_OF_MONTH));
            return (int) Math.round((exam.getTimeInMillis() - t.getTimeInMillis()) / 86400000.0);
        } catch (Exception e) { return -1; }
    }

    /** Bugün kaydedilen dakika; uygulama bugün açılmadıysa 0. */
    int todayMinutes() {
        return todayKey().equals(json.optString("dateKey")) ? json.optInt("todayMin", 0) : 0;
    }

    int goalMinutes() {
        JSONArray g = json.optJSONArray("goals");
        return g == null ? 0 : g.optInt(todayDow(), 0);
    }

    int streak() { return json.optInt("streak", 0); }

    boolean timerRunning() { return json.optBoolean("timerRunning", false); }

    String timerSubject() { return json.optString("timerSubject", ""); }

    /** Bugün işaretlenen blok kimlikleri */
    Set<String> doneToday() {
        Set<String> out = new HashSet<>();
        if (!todayKey().equals(json.optString("dateKey"))) return out;
        JSONArray a = json.optJSONArray("doneToday");
        if (a != null) for (int i = 0; i < a.length(); i++) out.add(a.optString(i));
        return out;
    }

    /** Bugünün blokları: her biri {id,start,minutes,name} */
    JSONArray todayBlocks() {
        JSONArray all = json.optJSONArray("blocks");
        JSONArray out = new JSONArray();
        if (all == null) return out;
        int dow = todayDow();
        for (int i = 0; i < all.length(); i++) {
            JSONObject b = all.optJSONObject(i);
            if (b != null && b.optInt("dow", -1) == dow) out.put(b);
        }
        return out;
    }

    /** Şu an içinde olunan blok (yoksa null) */
    JSONObject currentBlock() {
        int now = nowMinutes();
        JSONArray bl = todayBlocks();
        for (int i = 0; i < bl.length(); i++) {
            JSONObject b = bl.optJSONObject(i);
            int s = toMin(b.optString("start"));
            if (now >= s && now < s + b.optInt("minutes", 0)) return b;
        }
        return null;
    }

    /** Sıradaki (henüz bitmemiş) blok */
    JSONObject nextBlock() {
        int now = nowMinutes();
        Set<String> done = doneToday();
        JSONArray bl = todayBlocks();
        JSONObject best = null;
        int bestStart = Integer.MAX_VALUE;
        for (int i = 0; i < bl.length(); i++) {
            JSONObject b = bl.optJSONObject(i);
            int s = toMin(b.optString("start"));
            if (done.contains(b.optString("id"))) continue;
            if (s + b.optInt("minutes", 0) <= now) continue;
            if (s < bestStart) { bestStart = s; best = b; }
        }
        return best;
    }

    /** Dün kaç dakika çalışıldı (uygulama en son ne zaman açıldıysa ona göre). */
    int yesterdayMinutes() {
        Calendar c = Calendar.getInstance();
        c.add(Calendar.DAY_OF_MONTH, -1);
        String y = String.format(Locale.US, "%04d-%02d-%02d", c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
        String k = json.optString("dateKey");
        if (y.equals(k)) return json.optInt("todayMin", 0);
        if (todayKey().equals(k)) return json.optInt("yesterdayMin", 0);
        return 0;
    }

    /** Maskotun ruh hâli — mascot.js'teki kuralın aynısı. */
    String mood() {
        int hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY);
        int t = todayMinutes(), g = goalMinutes();
        if (hour < 7) return "sleep";
        if (g <= 0) return t > 0 ? "happy" : "sleep";
        if (t >= g) return "happy";
        if (t > 0) return "ok";
        if (hour >= 20 || (yesterdayMinutes() == 0 && hour >= 12)) return "sad";
        if (hour >= 14) return "worried";
        return "ok";
    }

    static String moodLine(String mood) {
        String[] l;
        switch (mood) {
            case "happy": l = new String[]{"Bugünkü hedef tamam! Seninle gurur duyuyorum.", "Harika iş! Yarın da böyle devam.", "Hedef tamam, seri büyüyor!"}; break;
            case "worried": l = new String[]{"Bugün daha hiç çalışmadık…", "Seni bekliyorum, 25 dakika yeter.", "Öğleden sonra oldu, hadi başlayalım mı?"}; break;
            case "sad": l = new String[]{"Bugün beni unuttun mu? 😢", "Seri bozulmak üzere… 1 blok kurtarır.", "Hedefimiz bizi bekliyor, gel hadi."}; break;
            case "sleep": l = new String[]{"Dinlenmek de çalışmanın parçası.", "İyi uykular, yarın erken başlarız.", "Zzz… yarın görüşürüz."}; break;
            default: l = new String[]{"İyi gidiyorsun, bir blok daha?", "Başladın bile, şimdi bırakma!", "Hadi, bugün de birlikte çalışalım."};
        }
        return l[Calendar.getInstance().get(Calendar.DAY_OF_MONTH) % l.length];
    }

    /** Günün sözü: her gün değişir, uygulama açılmasa da widget güncel kalır. */
    String quoteOfDay() {
        JSONArray q = json.optJSONArray("quotes");
        if (q == null || q.length() == 0) return "Az ama her gün çalışmak, çok ama ara sıra çalışmaktan iyidir.";
        int day = Calendar.getInstance().get(Calendar.DAY_OF_YEAR) + Calendar.getInstance().get(Calendar.YEAR) * 366;
        return q.optString(day % q.length());
    }

    JSONObject guard() {
        JSONObject g = json.optJSONObject("guard");
        return g == null ? new JSONObject() : g;
    }

    boolean guardEnabled() { return guard().optBoolean("enabled", false); }

    Set<String> guardApps() {
        Set<String> out = new HashSet<>();
        JSONArray a = guard().optJSONArray("apps");
        if (a != null) for (int i = 0; i < a.length(); i++) out.add(a.optString(i));
        return out;
    }
}
