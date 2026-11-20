/* Hedef AGS — kişisel çalışma koçu
 * Tüm veriler cihazda (localStorage) tutulur. Sunucu yok, hesap yok. */
(function () {
  'use strict';

  // ------------------------------------------------------------------ util
  const KEY = 'hedefags.v1';
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  const pad = (n) => String(n).padStart(2, '0');
  const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseD = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const dow = (d = new Date()) => (d.getDay() + 6) % 7; // Pzt=0
  const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const DAYS_S = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
  const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const fmtDate = (d) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  const fmtMin = (m) => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h} sa ${r} dk` : `${h} sa`) : `${r} dk`; };
  const toMin = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };
  const toHHMM = (m) => `${pad(Math.floor(m / 60) % 24)}:${pad(m % 60)}`;
  const daysBetween = (a, b) => Math.round((parseD(dkey(b)) - parseD(dkey(a))) / 864e5);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const net = (d, y) => (Number(d) || 0) - (Number(y) || 0) / 4;
  const round1 = (v) => Math.round(v * 10) / 10;

  // --------------------------------------------------------- android (APK)
  const Cap = window.Capacitor;
  const isNative = !!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform());
  const plugin = (n) => (isNative && Cap.Plugins ? Cap.Plugins[n] : null);
  let nativeT = null;
  function scheduleNativeSoon() { if (!isNative) return; clearTimeout(nativeT); nativeT = setTimeout(scheduleNative, 1200); }
  /** Telefonun kendi alarm sistemine bildirim kurar: uygulama kapalıyken de çalar. */
  async function scheduleNative(askPermission = false) {
    const LN = plugin('LocalNotifications'); if (!LN) return 'none';
    try {
      const pend = await LN.getPending();
      if (pend.notifications.length) await LN.cancel({ notifications: pend.notifications.map((n) => ({ id: n.id })) });
      let perm = await LN.checkPermissions();
      if (perm.display !== 'granted' && askPermission) perm = await LN.requestPermissions();
      if (perm.display !== 'granted') return 'denied';
      const R = S.reminders; const list = []; let id = 100;
      const wd = (i) => (i === 6 ? 1 : i + 2); // Pzt=0 → Capacitor: Paz=1, Pzt=2 … Cmt=7
      const at = (hhmm) => { const m = toMin(hhmm); return { hour: Math.floor(m / 60), minute: m % 60 }; };
      const extra = { smallIcon: 'ic_stat_hedef', iconColor: '#0f5c4d' };
      if (R.enabled) {
        for (let i = 0; i < 7; i++) {
          const bl = S.plan.blocks.filter((b) => b.dow === i).sort((a, b) => toMin(a.start) - toMin(b.start));
          const goal = Math.round((S.profile.hours[i] || 0) * 60);
          list.push({ id: id++, ...extra, title: 'Bugünkü planın hazır ☀️', body: bl.length ? `${bl.length} blok, toplam ${fmtMin(goal)}. İlk blok ${bl[0].start}: ${subjName(bl[0].subjectId)}.` : 'Bugün dinlenme günü. Kısa bir tekrar yine de iyi gelir.', schedule: { on: { weekday: wd(i), ...at(R.morning) }, allowWhileIdle: true } });
          if (goal) list.push({ id: id++, ...extra, title: 'Gün özetin hazır ⭐', body: `Bugün kaç yıldız aldın? Hedefin ${fmtMin(goal)}. Uygulamayı aç, değerlendirme bonusu havuçlarını topla.`, schedule: { on: { weekday: wd(i), ...at(R.evening) }, allowWhileIdle: true } });
          if (R.blocks) for (const b of bl) {
            const m = Math.max(0, toMin(b.start) - 5);
            list.push({ id: id++, ...extra, title: `${b.start} — ${subjName(b.subjectId)}`, body: `${KIND[b.kind] || ''} · ${b.minutes} dk. 5 dakika sonra başlıyor.`, schedule: { on: { weekday: wd(i), hour: Math.floor(m / 60), minute: m % 60 }, allowWhileIdle: true } });
          }
        }
        for (const k of keyDates()) {
          const when = addDays(parseD(k.d), -1); when.setHours(10, 0, 0, 0);
          if (when > new Date()) list.push({ id: id++, ...extra, title: `Yarın: ${k.short}`, body: k.t, schedule: { at: when, allowWhileIdle: true } });
        }
      }
      if (S.timer && S.timer.running && !S.timer.alerted) {
        const end = new Date(S.timer.startedAt + S.timer.target * 60000 - S.timer.acc);
        if (end > new Date()) list.push({ id: 1, ...extra, title: 'Blok tamamlandı ⏰', body: `${subjName(S.timer.subjectId)}: ${S.timer.target} dakika doldu. Kaydet ve mola ver.`, schedule: { at: end, allowWhileIdle: true } });
      }
      if (list.length) await LN.schedule({ notifications: list });
      return 'ok';
    } catch (e) { return 'error'; }
  }
  // ---- widget, odak bekçisi, alarm ve takvim (yalnızca APK)
  const GUARD_APPS = [
    ['com.google.android.youtube', 'YouTube'], ['com.instagram.android', 'Instagram'],
    ['com.zhiliaoapp.musically', 'TikTok'], ['com.ss.android.ugc.trill', 'TikTok Lite'],
    ['com.twitter.android', 'X (Twitter)'], ['com.facebook.katana', 'Facebook'],
    ['com.netflix.mediaclient', 'Netflix'], ['com.snapchat.android', 'Snapchat'],
    ['com.reddit.frontpage', 'Reddit'], ['tv.twitch.android.app', 'Twitch']
  ];
  // Ders videosu başlıklarında geçebilecek kelimeler. Ders dışı videoları yanlışlıkla
  // yakalamasın diye çok genel kelimeler (kamp, sünnet, problem, tarih…) tek başına kullanılmadı.
  const DEFAULT_LESSON_KEYWORDS = [
    // genel sınav ve ders ifadeleri
    'ags', 'öabt', 'kpss', 'meb ags', 'akademi giriş', 'konu anlatımı', 'konu anlatım', 'ders anlatımı', 'soru çözümü', 'soru çözüm',
    'deneme sınavı', 'deneme çözümü', 'çıkmış sorular', 'çıkmış soru', 'tekrar kampı', 'soru kampı', 'genel tekrar', 'full tekrar', 'hızlı tekrar',
    'ders notu', 'canlı ders', 'öğretmen adayı', 'öğretmenlik', 'akılda kalıcı', 'soru taktikleri', 'çözüm taktikleri', 'soru tipleri',
    // eğitim bilimleri ve Türk millî eğitim sistemi
    'eğitim bilimleri', 'eğitimin temelleri', 'eğitim psikolojisi', 'gelişim psikolojisi', 'öğrenme psikolojisi', 'öğrenme kuramları',
    'davranışçı kuram', 'bilişsel kuram', 'yapılandırmacı', 'piaget', 'vygotsky', 'erikson', 'kohlberg', 'bandura', 'maslow', 'bronfenbrenner',
    'bloom taksonomisi', 'ölçme ve değerlendirme', 'ölçme değerlendirme', 'güvenirlik', 'geçerlik', 'program geliştirme', 'öğretim ilke',
    'öğretim yöntem', 'öğretim strateji', 'öğretim teknolojileri', 'materyal tasarımı', 'rehberlik', 'psikolojik danışma', 'özel eğitim',
    'kaynaştırma', 'sınıf yönetimi', 'eğitim felsefesi', 'eğitim sosyolojisi', 'türk eğitim tarihi', 'eğitim tarihi', 'milli eğitim', 'millî eğitim',
    // mevzuat
    'mevzuat', 'anayasa', 'temel haklar', '657', 'devlet memurları kanunu', '1739', 'milli eğitim temel kanunu', '222 sayılı', '7528',
    'öğretmenlik meslek kanunu', 'yönetmelik', 'ortaöğretim kurumları', 'okul öncesi eğitim ve ilköğretim', 'çocuk hakları', 'insan hakları',
    // sözel yetenek
    'sözel yetenek', 'sözel mantık', 'sözcükte anlam', 'cümlede anlam', 'paragrafta anlam', 'paragraf soruları', 'paragraf çözüm',
    'anlatım bozukluğu', 'yazım kuralları', 'noktalama işaretleri', 'dil bilgisi', 'dilbilgisi', 'türkçe dersi',
    // sayısal yetenek
    'sayısal yetenek', 'sayısal mantık', 'matematik', 'yaş problemleri', 'işçi problemleri', 'hız problemleri', 'yüzde problemleri',
    'sayı problemleri', 'kesir problemleri', 'karışım problemleri', 'kar zarar', 'oran orantı', 'ebob', 'ekok', 'bölünebilme', 'rasyonel sayılar',
    'üslü sayılar', 'köklü sayılar', 'permütasyon', 'kombinasyon', 'olasılık', 'kümeler', 'fonksiyonlar', 'geometri', 'grafik yorumlama', 'tablo yorumlama',
    // tarih
    'tarih dersi', 'tarih konu', 'islamiyet öncesi türk', 'türk islam devletleri', 'ilk türk devletleri', 'osmanlı tarihi', 'osmanlı devleti',
    'selçuklu tarihi', 'kuruluş dönemi', 'yükselme dönemi', 'kurtuluş savaşı', 'milli mücadele', 'inkılap tarihi', 'atatürk ilkeleri',
    'atatürk ilke ve inkılapları', 'çağdaş türk ve dünya tarihi', 'xx. yüzyıl başlarında',
    // coğrafya
    'türkiye coğrafyası', 'coğrafya', 'iklim ve bitki örtüsü', 'yer şekilleri', 'nüfus ve yerleşme', 'coğrafi bölgeler', 'coğrafi konum',
    // ÖABT din kültürü ve ilahiyat
    'din kültürü', 'dkab', 'ahlak bilgisi', 'ilahiyat', 'kuran-ı kerim', 'kur’an', "kur'an", 'kuran ilimleri', 'ulumul kuran', 'tecvit', 'tecvid',
    'tefsir', 'kuran meali', 'meali', 'hadis', 'hadis usulü', 'fıkıh', 'fıkıh usulü', 'usul-i fıkıh', 'kelam', 'akaid', 'akait', 'mezhepler tarihi', 'islam mezhepleri',
    'siyer', 'siyer-i nebi', 'islam tarihi', 'islam medeniyeti', 'tasavvuf', 'islam felsefesi', 'din felsefesi', 'dinler tarihi', 'din psikolojisi',
    'din sosyolojisi', 'din eğitimi', 'din öğretimi', 'değerler eğitimi', 'islam ahlakı', 'ahlak felsefesi', 'dkab öğretim programı',
    // yüksek lisans ve tez
    'tez yazımı', 'tez yazma', 'tez danışmanı', 'tez önerisi', 'akademik yazım', 'akademik yazma', 'araştırma yöntemleri', 'bilimsel araştırma',
    'nitel araştırma', 'nicel araştırma', 'karma yöntem', 'literatür taraması', 'kaynak gösterme', 'apa', 'spss', 'veri analizi', 'makale yazımı',
    'yüksek lisans', 'lisansüstü'
  ];
  const OLD_DEFAULT_KEYWORDS_V1 = ['ags', 'öabt', 'kpss', 'meb', 'eğitim bilimleri', 'eğitimin temelleri', 'gelişim psikolojisi', 'öğrenme psikolojisi',
    'ölçme ve değerlendirme', 'ölçme değerlendirme', 'program geliştirme', 'öğretim ilke', 'öğretim yöntem', 'rehberlik', 'sınıf yönetimi', 'özel eğitim',
    'mevzuat', 'anayasa', 'milli eğitim', 'öğretmenlik meslek', '657', '1739', 'sözel mantık', 'paragraf', 'sözcükte anlam', 'problem', 'sayısal mantık',
    'inkılap', 'osmanlı', 'türk tarihi', 'coğrafya', 'din kültürü', 'dkab', 'tefsir', 'hadis', 'fıkıh', 'kelam', 'siyer', 'islam tarihi', 'tasavvuf',
    'dinler tarihi', 'din psikolojisi', 'din sosyolojisi', 'din eğitimi', 'din felsefesi', 'mezhepler', 'tecvit', 'konu anlatımı', 'soru çözümü', 'deneme çözümü',
    'tez yazımı', 'akademik yazım', 'araştırma yöntemleri', 'literatür'];
  const sameList = (a, b) => Array.isArray(a) && a.length === b.length && a.every((x, i) => x === b[i]);
  const lessonKeywords = () => (S.guard.media && Array.isArray(S.guard.media.keywords) ? S.guard.media.keywords : DEFAULT_LESSON_KEYWORDS);
  let syncT = null;
  function nativeSyncSoon() { if (!isNative) return; clearTimeout(syncT); syncT = setTimeout(nativeSync, 800); }
  function nativeSync() {
    const H = plugin('Hedef'); if (!H) return;
    const today = new Date(); const k = dkey(today); const g = S.guard || {};
    const labels = {}; for (const [pkg, n] of GUARD_APPS) labels[pkg] = n;
    const snap = {
      name: S.profile.name, agsDate: S.profile.agsDate, dateKey: k,
      todayMin: minutesOn(k), yesterdayMin: minutesOn(dkey(addDays(today, -1))), goals: S.profile.hours.map((h) => Math.round(h * 60)), streak: streak(),
      timerRunning: !!(S.timer && S.timer.running), timerSubject: S.timer ? (subj(S.timer.subjectId)?.short || '') : '',
      doneToday: Object.keys(S.done).filter((x) => x.startsWith(k + '|')).map((x) => x.slice(11)),
      blocks: S.plan.blocks.map((b) => ({ id: b.id, dow: b.dow, start: b.start, minutes: b.minutes, name: subj(b.subjectId)?.short || subjName(b.subjectId), full: subjName(b.subjectId), kind: KIND[b.kind] || '' })),
      guard: { enabled: !!g.enabled, mode: g.mode || 'blocks', apps: g.apps || [], strict: !!g.strict, graceMin: Number(g.graceMin) || 10, labels,
        media: { enabled: !!(g.media && g.media.enabled), channels: (g.media && g.media.channels) || [], keywords: lessonKeywords() } },
      quotes: window.QUOTES, coins: S.coins || 0, mascotName: S.mascotName || 'Rüzgar'
    };
    H.update({ json: JSON.stringify(snap) }).catch(() => {});
  }
  async function takeLaunchTab() {
    const H = plugin('Hedef'); if (!H) return;
    try {
      const r = await H.takeLaunchTab();
      if (r && r.tab) {
        location.hash = '#' + r.tab;
        if (r.reason && r.reason.startsWith('strict')) setTimeout(() => showStrictAngry(r.reason, r.message), 350);
        else if (r.message) setTimeout(() => toast(r.message, 6000), 300);
      }
    } catch (e) { /* yok */ }
  }
  async function nativeStatus() {
    const H = plugin('Hedef'); if (!H) return null;
    try { return await H.status(); } catch (e) { return null; }
  }
  async function fillNativeStatus() {
    const st = await nativeStatus(); if (!st) return;
    const set = (id, ok, okText, noText) => { const el = document.getElementById(id); if (el) { el.textContent = ok ? okText : noText; el.className = 'chip ' + (ok ? 'chip-ok' : 'chip-no'); } };
    set('st-usage', st.usage, 'verildi', 'gerekli');
    set('st-overlay', st.overlay, 'verildi', 'gerekli');
    set('st-guard', st.guardRunning, 'çalışıyor', 'kapalı');
    set('st-media', st.media, 'verildi', 'gerekli');
    const lm = document.getElementById('last-media');
    if (lm) {
      if (st.lastTitle) {
        lm.hidden = false;
        lm.querySelector('.lm-title').textContent = st.lastTitle;
        lm.querySelector('.lm-ch').textContent = st.lastChannel || 'kanal bilinmiyor';
        lm.querySelector('.lm-verdict').textContent = st.lastVerdict === 'lesson' ? '✓ ders sayıldı' : '✗ ders sayılmadı';
        lm.querySelector('.lm-verdict').className = 'lm-verdict ' + (st.lastVerdict === 'lesson' ? 'ok' : 'no');
        const btn = lm.querySelector('[data-act=addChannel]'); btn.dataset.ch = st.lastChannel || ''; btn.hidden = !st.lastChannel || (S.guard.media.channels || []).includes(st.lastChannel);
      } else lm.hidden = true;
    }
    const w = document.getElementById('st-widget'); if (w) w.textContent = st.widgets ? `${st.widgets} widget ekli` : 'henüz eklenmedi';
  }
  function alarmDays(pred) { return [0, 1, 2, 3, 4, 5, 6].filter(pred).map((i) => (i === 6 ? 1 : i + 2)); }
  async function setPhoneAlarms() {
    const H = plugin('Hedef'); if (!H) return;
    const P = S.profile; const R = S.reminders;
    const hm = (t) => { const m = toMin(t); return { hour: Math.floor(m / 60), minute: m % 60 }; };
    const jobs = [
      { ...hm(R.morning), message: 'Hedef AGS: Bugünkü planına bak ☀️', days: alarmDays((i) => P.hours[i] > 0) },
      { ...hm(P.startTime), message: 'Hedef AGS: Çalışma zamanı 📚', days: alarmDays((i) => i < 5 && P.hours[i] > 0) },
      { ...hm(P.weekendStart), message: 'Hedef AGS: Hafta sonu çalışma zamanı 📚', days: alarmDays((i) => i >= 5 && P.hours[i] > 0) }
    ].filter((j) => j.days.length);
    let ok = 0;
    for (const j of jobs) { try { await H.setAlarm(j); ok++; } catch (e) { /* atla */ } }
    toast(ok ? `${ok} alarm Saat uygulamasına kuruldu ⏰` : 'Saat uygulaması alarm kabul etmedi.', 4000);
  }
  async function addToPhoneCalendar() {
    const H = plugin('Hedef'); if (!H) return;
    const monday = addDays(new Date(), -dow(new Date())); const ex = parseD(S.profile.agsDate);
    const until = `${ex.getFullYear()}${pad(ex.getMonth() + 1)}${pad(ex.getDate())}T235959Z`;
    const events = S.plan.blocks.map((b) => {
      const d = addDays(monday, b.dow); const m = toMin(b.start); d.setHours(Math.floor(m / 60), m % 60, 0, 0);
      return { title: `📚 ${subjName(b.subjectId)} — ${KIND[b.kind] || ''}`, start: d.getTime(), durationMin: b.minutes, rrule: `FREQ=WEEKLY;UNTIL=${until}`, reminderMin: 10 };
    });
    for (const k of keyDates().filter((x) => x.left >= 0)) {
      const [y, mo, da] = k.d.split('-').map(Number);
      events.push({ title: `🎯 ${k.t}`, start: Date.UTC(y, mo - 1, da), allDay: true, reminderMin: 15 * 60 });
    }
    try { const r = await H.addCalendarEvents({ events }); toast(`${r.added} etkinlik telefon takvimine eklendi 📅`, 4000); }
    catch (e) { toast((e && e.message) || 'Takvime eklenemedi.', 4000); }
  }

  // widget için giydirilmiş maskot görselleri (görünüm değişince yeniden çizilir)
  async function renderWidgetMascots(force = false) {
    const H = plugin('Hedef'); if (!H || !window.Mascot) return;
    const key = JSON.stringify(mascotLook()) + '|v2';
    if (!force && S.widgetLookKey === key) return;
    try {
      for (const m of window.Mascot.MOODS) await H.saveMascot({ mood: m, data: await window.Mascot.png(m, mascotLook(), 264) });
      S.widgetLookKey = key; save();
    } catch (e) { /* widget varsayılan görselle kalır */ }
  }

  async function nativeShareFile(name, text) {
    const FS = plugin('Filesystem'); const SH = plugin('Share'); if (!FS || !SH) return false;
    const r = await FS.writeFile({ path: name, data: text, directory: 'CACHE', encoding: 'utf8' });
    await SH.share({ title: name, files: [r.uri], dialogTitle: 'Kaydet veya paylaş' });
    return true;
  }

  // ----------------------------------------------------------------- state
  function defaultState() {
    return {
      v: 1,
      profile: {
        name: '', onboarded: false,
        agsDate: '2027-05-08',
        oabtDate: '2027-05-09',
        hours: [3, 3, 3, 3, 3, 4, 4], // gün başına saat (Pzt..Paz)
        startTime: '18:00',
        weekendStart: '10:00',
        ylShare: 25, // yüzde
        block: 50, brk: 10
      },
      subjects: JSON.parse(JSON.stringify(window.DEFAULT_SUBJECTS)).map((s) => ({
        ...s, topics: s.topics.map((t) => ({ id: uid(), name: t, status: 0 }))
      })),
      sessions: [], // {id,date,subjectId,topicId,minutes,questions,correct,wrong,note,blockId}
      exams: [],    // {id,date,name,type,res:{subjectId:{d,y}}}
      tasks: window.DEFAULT_YL_TASKS.map((t) => ({ id: uid(), title: t.title, type: t.type, due: '', done: false })),
      plan: { blocks: [], generatedAt: null },
      done: {}, // "YYYY-MM-DD|blockId": true
      reminders: { enabled: false, morning: '08:30', evening: '21:30', blocks: true, fired: {} },
      timer: null,
      guard: { enabled: false, mode: 'blocks', apps: ['com.google.android.youtube', 'com.instagram.android', 'com.zhiliaoapp.musically', 'com.ss.android.ugc.trill'], strict: false, graceMin: 10, media: { enabled: false, channels: [], keywords: null } },
      reviews: [], lastWeekly: null, updatedAt: 0,
      coins: 0, earned: 0, owned: [], look: {}, mascotName: 'Rüzgar', awards: {}, coinLog: [], dayRatings: {}, firstDay: null
    };
  }

  // ÖSYM 2027 takvimi (28 Ekim 2026'da açıklandı)
  const KEY_DATES = [
    { d: '2027-03-19', t: 'AGS başvuruları başlıyor', short: 'Başvuru başlar', kind: 'basvuru' },
    { d: '2027-03-29', t: 'Normal başvurunun son günü', short: 'Son başvuru', kind: 'basvuru' },
    { d: '2027-04-06', t: 'Geç başvuru günü', short: 'Geç başvuru', kind: 'basvuru' },
    { d: '2027-05-08', t: 'MEB-AGS sınavı (Cumartesi 10.15)', short: 'AGS', kind: 'sinav', ags: true },
    { d: '2027-05-09', t: 'ÖABT — Din Kültürü ve Ahlak Bilgisi (Pazar)', short: 'ÖABT', kind: 'sinav', oabt: true },
    { d: '2027-06-11', t: 'AGS ve ÖABT sonuçları', short: 'Sonuç', kind: 'sonuc' }
  ];
  const OLD_DEFAULT_DATE = '2027-07-25';
  let migrated = false;
  function mergeDefaults(s) {
    const d = defaultState();
    const m = { ...d, ...s, profile: { ...d.profile, ...s.profile }, reminders: { ...d.reminders, ...s.reminders }, plan: { ...d.plan, ...s.plan }, guard: { ...d.guard, ...(s.guard || {}), media: { ...d.guard.media, ...((s.guard || {}).media || {}) } }, look: { ...(s.look || {}) }, awards: { ...(s.awards || {}) } };
    // eski tahmini tarihi ÖSYM'nin açıkladığı resmi tarihle değiştir
    m.dayRatings = { ...(s.dayRatings || {}) };
    if (!m.firstDay) m.firstDay = (s.sessions || []).reduce((a, x) => (!a || x.date < a ? x.date : a), null) || null;
    if (m.guard && m.guard.media && Array.isArray(m.guard.media.keywords) && typeof OLD_DEFAULT_KEYWORDS_V1 !== 'undefined' && sameList(m.guard.media.keywords, OLD_DEFAULT_KEYWORDS_V1)) m.guard.media.keywords = null;
    if (m.profile.agsDate === OLD_DEFAULT_DATE) { m.profile.agsDate = '2027-05-08'; m.profile.oabtDate = '2027-05-09'; migrated = true; }
    return m;
  }
  function keyDates() {
    // kullanıcı sınav tarihini değiştirdiyse sınav satırları onu izler
    return KEY_DATES.map((k) => (k.ags ? { ...k, d: S.profile.agsDate } : k.oabt ? { ...k, d: S.profile.oabtDate || k.d } : k))
      .map((k) => ({ ...k, left: daysBetween(new Date(), parseD(k.d)) }));
  }
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      return mergeDefaults(JSON.parse(raw));
    } catch (e) { return defaultState(); }
  }
  let S = load();
  let cloud = null; let cloudT = null;
  function save() {
    S.updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* tarayıcı depolaması yok */ }
    if (cloud) { clearTimeout(cloudT); cloudT = setTimeout(pushCloud, 1500); }
    scheduleNativeSoon();
    nativeSyncSoon();
  }
  async function pushCloud() {
    if (!cloud) return;
    const json = JSON.stringify(S);
    if (json.length > 250000) { toast('Veri çok büyüdü; Ayarlar’dan yedek alıp eski kayıtları temizle.'); return; }
    try { await cloud.ref.set({ json, updatedAt: S.updatedAt }); setSync('ok'); } catch (e) { setSync('err'); }
  }
  let syncState = 'local';
  function setSync(st) { syncState = st; const el = document.getElementById('sync-chip'); if (el) el.textContent = { ok: '☁ eşitlendi', err: '☁ eşitlenemedi', local: '', wait: '☁ …' }[st]; }
  async function initCloud() {
    if (!window.claude || typeof window.claude.use !== 'function') return;
    try {
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return;
      const id = await user.id(); if (!id) return;
      const ref = db.collection('data/users/' + id).doc('state');
      setSync('wait');
      const snap = await ref.get();
      cloud = { ref };
      if (snap.exists) {
        const d = snap.data();
        if (d && d.json && (Number(d.updatedAt) || 0) > (Number(S.updatedAt) || 0)) {
          const remote = JSON.parse(d.json);
          try { localStorage.setItem(KEY, d.json); } catch (e) { /* yok */ }
          S = mergeDefaults(remote);
          if (migrated) { migrated = false; save(); toast('Sınav tarihi ÖSYM takvimine göre güncellendi: AGS 8 Mayıs 2027'); }
          if (S.profile.onboarded && modalIsOnboarding && $('#modal').open) { modalHandler = null; modalCancel = null; modalIsOnboarding = false; $('#modal').close(); }
          render(); toast('Verilerin hesabından yüklendi ☁');
          setSync('ok'); return;
        }
      }
      await pushCloud();
    } catch (e) { setSync('err'); }
  }

  const subj = (id) => S.subjects.find((s) => s.id === id);
  const examSubjects = () => S.subjects.filter((s) => s.group !== 'yl');
  const subjName = (id) => (id === 'deneme' ? 'Deneme Sınavı' : (subj(id)?.name || 'Genel'));
  const subjColor = (id) => (id === 'deneme' ? '#0f5c4d' : (subj(id)?.color || '#64748b'));

  // -------------------------------------------------------------- analytics
  function minutesOn(dateK) { return S.sessions.filter((s) => s.date === dateK).reduce((a, s) => a + s.minutes, 0); }
  function goalOn(d) { return Math.round((S.profile.hours[dow(d)] || 0) * 60); }
  function rangeMinutes(days) {
    const out = []; const today = new Date();
    for (let i = days - 1; i >= 0; i--) { const d = addDays(today, -i); out.push({ d, k: dkey(d), m: minutesOn(dkey(d)), g: goalOn(d) }); }
    return out;
  }
  function streak() {
    let n = 0; let d = new Date();
    if (minutesOn(dkey(d)) === 0) d = addDays(d, -1); // bugün henüz çalışılmadıysa seriyi bozma
    while (minutesOn(dkey(d)) >= 15) { n++; d = addDays(d, -1); }
    return n;
  }
  function subjectStats(sinceDays = 3650) {
    const since = dkey(addDays(new Date(), -sinceDays));
    const st = {};
    for (const s of S.subjects) st[s.id] = { minutes: 0, q: 0, c: 0, w: 0, last: null };
    for (const x of S.sessions) {
      if (!st[x.subjectId]) continue;
      const t = st[x.subjectId];
      if (!t.last || x.date > t.last) t.last = x.date;
      if (x.date < since) continue;
      t.minutes += x.minutes; t.q += x.questions || 0; t.c += x.correct || 0; t.w += x.wrong || 0;
    }
    return st;
  }
  function topicProgress(s) {
    if (!s.topics.length) return 0;
    return s.topics.reduce((a, t) => a + (t.status >= 2 ? 1 : t.status === 1 ? 0.4 : 0), 0) / s.topics.length;
  }
  // aralıklı tekrar: konu bittikten sonra 1-3-7-14-30 gün
  const SR = [1, 3, 7, 14, 30];
  function reviewDue(t) {
    if (t.status < 2 || !t.doneAt) return null;
    const n = t.reviews || 0; if (n >= SR.length) return null;
    const base = t.lastReview || t.doneAt;
    const due = addDays(parseD(base), SR[n] - (n ? SR[n - 1] : 0));
    return due;
  }
  function dueReviews() {
    const today = parseD(dkey()); const out = [];
    for (const s of S.subjects) for (const t of s.topics) { const d = reviewDue(t); if (d && d <= today) out.push({ s, t, late: daysBetween(d, today) }); }
    return out.sort((a, b) => b.late - a.late);
  }
  // ------------------------------------------------------------ havuç 🥕
  const mascotLook = () => S.look || {};
  /** Havuç kazandırır; art arda gelen ödülleri tek bildirimde toplar. */
  let pendingAward = null; let awardT = null;
  function award(n, why) {
    n = Math.round(n); if (n <= 0) return;
    S.coins = (S.coins || 0) + n; S.earned = (S.earned || 0) + n;
    S.coinLog = [{ d: dkey(), n, why }, ...(S.coinLog || [])].slice(0, 40);
    pendingAward = pendingAward ? { n: pendingAward.n + n, why: pendingAward.why } : { n, why };
    clearTimeout(awardT); awardT = setTimeout(() => {
      const a = pendingAward; pendingAward = null; if (!a) return;
      toast(`+${a.n} 🥕 ${a.why} — ${S.mascotName || 'Rüzgar'} çok mutlu!`, 3800);
      document.querySelectorAll('.coin-chip').forEach((el) => { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); });
    }, 350);
  }
  /** Günlük hedef tamamlandıysa günde bir kez bonus verir. */
  function checkGoalAward(dateK) {
    const g = goalOn(parseD(dateK)); S.awards = S.awards || {};
    if (!g || S.awards['goal|' + dateK] || minutesOn(dateK) < g) return;
    S.awards['goal|' + dateK] = 1;
    award(20 + Math.min(streak(), 10) * 2, 'Günlük hedef tamam');
  }
  function setTopicStatus(t, v) {
    if (v >= 2 && t.status < 2) { t.doneAt = dkey(); t.reviews = 0; t.lastReview = null; if (!t.rewarded) { t.rewarded = true; award(3, 'Konu bitti'); } }
    if (v < 2) { t.doneAt = null; t.reviews = 0; t.lastReview = null; }
    t.status = v;
  }
  function lastExamRatio(subjectId) {
    const ex = [...S.exams].sort((a, b) => b.date.localeCompare(a.date)).find((e) => e.res && e.res[subjectId]);
    if (!ex) return null;
    const r = ex.res[subjectId]; const s = subj(subjectId);
    return s && s.weight ? clamp(net(r.d, r.y) / s.weight, 0, 1) : null;
  }
  /** 0 (güçlü) .. 1 (zayıf) */
  function weakness(s, stats) {
    const prog = topicProgress(s);
    const st = stats[s.id];
    let acc = lastExamRatio(s.id);
    if (acc === null && st && st.c + st.w >= 10) acc = st.c / (st.c + st.w);
    if (acc === null) acc = 0.5;
    return clamp(0.45 * (1 - prog) + 0.55 * (1 - acc), 0, 1);
  }
  function daysLeft() { return daysBetween(new Date(), parseD(S.profile.agsDate)); }
  function phase() {
    const d = daysLeft();
    if (d > 150) return { id: 1, name: 'Temel kurulum', desc: 'Konu anlatımı ağırlıklı; her konudan sonra kısa soru çözümü.' };
    if (d > 60) return { id: 2, name: 'Pekiştirme', desc: 'Konu + soru dengesi; haftada bir deneme.' };
    if (d >= 0) return { id: 3, name: 'Son düzlük', desc: 'Soru, deneme ve tekrar ağırlıklı; yeni konu az.' };
    return { id: 0, name: 'Sınav geçti', desc: 'Ayarlar’dan yeni sınav tarihini gir.' };
  }

  // ------------------------------------------------------------ plan engine
  function generatePlan() {
    const P = S.profile; const blockLen = Number(P.block) || 50; const brk = Number(P.brk) || 10;
    const stats = subjectStats(60); const ph = phase();
    const exS = examSubjects().filter((s) => s.weight > 0);
    const scores = {}; let sum = 0;
    for (const s of exS) { scores[s.id] = s.weight * (0.6 + 1.4 * weakness(s, stats)); sum += scores[s.id]; }

    // günlük slotlar
    const days = [];
    let totalExam = 0;
    for (let i = 0; i < 7; i++) {
      const total = Math.round((P.hours[i] || 0) * 60);
      const yl = Math.round(total * (P.ylShare / 100) / 25) * 25;
      const exam = total - yl;
      days.push({ i, total, yl, exam, start: toMin(i >= 5 ? P.weekendStart : P.startTime) });
    }
    // haftalık deneme(ler)
    const denemeDays = [];
    if (ph.id >= 2) { const sun = days[6].exam >= 120 ? 6 : days[5].exam >= 120 ? 5 : -1; if (sun >= 0) denemeDays.push(sun); }
    if (ph.id === 3 && days[2].exam >= 120) denemeDays.push(2);

    const blocks = [];
    const slotsPerDay = days.map((d) => {
      const arr = []; let rem = d.exam;
      if (denemeDays.includes(d.i)) { arr.push({ min: 110, deneme: true }); rem -= 120; }
      while (rem >= 25) { const m = rem >= blockLen ? blockLen : rem; arr.push({ min: m }); rem -= m + brk; }
      for (const a of arr) if (!a.deneme) totalExam += a.min;
      return arr;
    });
    const target = {}; const got = {};
    for (const s of exS) { target[s.id] = totalExam * scores[s.id] / sum; got[s.id] = 0; }
    const counts = {};

    for (const d of days) {
      let t = d.start; let prev = null; const usedToday = {};
      for (const slot of slotsPerDay[d.i]) {
        if (slot.deneme) {
          blocks.push({ id: uid(), dow: d.i, start: toHHMM(t), minutes: 110, subjectId: 'deneme', kind: 'deneme' });
          t += 120; prev = 'deneme'; continue;
        }
        let best = null; let bestV = -Infinity;
        for (const s of exS) {
          if (s.id === prev) continue;
          let v = target[s.id] - got[s.id];
          if (usedToday[s.id]) v -= blockLen * 0.6 * usedToday[s.id]; // aynı gün tekrarı azalt
          if (v > bestV) { bestV = v; best = s; }
        }
        if (!best) best = exS[0];
        got[best.id] += slot.min; usedToday[best.id] = (usedToday[best.id] || 0) + 1;
        counts[best.id] = (counts[best.id] || 0) + 1;
        const n = counts[best.id];
        let kind = 'konu';
        if (ph.id === 1) kind = n % 3 === 0 ? 'soru' : 'konu';
        else if (ph.id === 2) kind = n % 2 === 0 ? 'soru' : 'konu';
        else kind = n % 4 === 0 ? 'tekrar' : 'soru';
        if (d.i === 6 && ph.id !== 3 && n % 2 === 1) kind = 'tekrar';
        blocks.push({ id: uid(), dow: d.i, start: toHHMM(t), minutes: slot.min, subjectId: best.id, kind });
        t += slot.min + brk; prev = best.id;
      }
      // yüksek lisans blokları (tez ağırlıklı)
      let yl = d.yl; let k = 0;
      while (yl >= 25) {
        const m = yl >= blockLen ? blockLen : yl;
        const sid = (d.i + k) % 3 === 2 ? 'yldersler' : 'tez';
        blocks.push({ id: uid(), dow: d.i, start: toHHMM(t), minutes: m, subjectId: sid, kind: sid === 'tez' ? 'yazım' : 'okuma' });
        t += m + brk; yl -= m + brk; k++;
      }
    }
    S.plan = { blocks, generatedAt: new Date().toISOString() };
    save();
  }
  // -------------------------------------------------------- gün özeti ⭐
  const DAY_BONUS = [0, 2, 5, 10, 15, 25];
  const DAY_TITLES = ['Bugün hiç koşmadık', 'Zor bir gündü', 'Biraz daha zorlayabilirdik', 'İyi bir gün', 'Çok iyi bir gün!', 'Muhteşem bir gün!'];
  const WIN_QUOTES = [
    'Bugün kendine verdiğin sözü tuttun. Yarın da aynı yoldan devam!',
    '“Amellerin Allah katında en sevimlisi, az da olsa devamlı olanıdır.” Sen bugün devam ettin.',
    'Her başarılı gün, sınav salonunda sana bir net olarak dönecek.',
    'Rüzgar şahlandı, çünkü sen bugün dört nala koştun!',
    'İstikrar yeteneği yener. Bugün istikrarlıydın.',
    '“Şüphesiz zorlukla beraber bir kolaylık vardır.” Bugünün emeği yarının kolaylığı.'
  ];
  const LOSE_QUOTES = [
    'Kötü bir gün, kötü bir hafta demek değil. Yarın ilk bloğu kaçırma, yeter.',
    'Düşmek sorun değil; yerde kalmak sorun. Yarın kalkıyoruz!',
    'Bugün az oldu ama sıfır değil. Yarın 25 dakikayla başla, gerisi gelir.',
    '“Bir işi bitirince diğerine koyul.” Bugün bitti, yarına koyulalım.',
    'Rüzgar biraz üzgün ama sana inanıyor. Yarın birlikte koşalım.',
    'Hedefin hâlâ yerinde duruyor. Yarın ona bir adım daha yaklaş.'
  ];
  const ANGRY_QUOTES = [
    'Rüzgar sinirlendi ama kin tutmaz: yarın bir blok yap, barışırız!',
    'Tükürük silinir, kaybedilen gün geri gelmez. Yarın 25 dakikayla başla.',
    'Bugün olmadı. Yarın ilk iş sayacı başlat; Rüzgar affetmeye hazır.',
    'Sınav günü kimse “dün yorgundum” diye sormaz. Yarın kalkıyoruz!',
    'Bir günlük boşluk seni durduramaz; ikinci günü boş bırakmamak yeter.'
  ];
  // ---- ses efektleri (Web Audio ile üretilir, dosya gerekmez)
  let actx = null;
  function audio() {
    if (S.profile.sfx === false) return null;
    try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch (e) { actx = null; }
    return actx;
  }
  function noise(a, t, dur, freq, vol, type = 'bandpass') {
    const n = Math.floor(a.sampleRate * dur); const buf = a.createBuffer(1, n, a.sampleRate); const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const src = a.createBufferSource(); src.buffer = buf; const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq;
    const g = a.createGain(); g.gain.value = vol; src.connect(f); f.connect(g); g.connect(a.destination); src.start(t);
  }
  function sfx(kind, delay = 0) {
    const a = audio(); if (!a) return; const t = a.currentTime + 0.02 + delay;
    try {
      if (kind === 'neigh') { // kişneme: titreşimli, yükselip alçalan ses + sonunda burun sesi
        const o = a.createOscillator(); o.type = 'sawtooth'; const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 1.3;
        const g = a.createGain(); const lfo = a.createOscillator(); const lg = a.createGain();
        lfo.frequency.setValueAtTime(9, t); lfo.frequency.linearRampToValueAtTime(15, t + 1.1); lg.gain.value = 70; lfo.connect(lg); lg.connect(o.frequency);
        o.frequency.setValueAtTime(600, t); o.frequency.linearRampToValueAtTime(1000, t + 0.2); o.frequency.exponentialRampToValueAtTime(420, t + 1.2);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.06); g.gain.setValueAtTime(0.2, t + 0.9); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
        o.connect(f); f.connect(g); g.connect(a.destination); o.start(t); lfo.start(t); o.stop(t + 1.35); lfo.stop(t + 1.35);
        noise(a, t + 1.35, 0.3, 800, 0.16);
      } else if (kind === 'spit') { // "tuh" + fışş + şap
        const o = a.createOscillator(); o.type = 'sine'; const g = a.createGain();
        o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.12);
        g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15); o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + 0.16);
        noise(a, t + 0.03, 0.22, 3200, 0.22, 'highpass');
        noise(a, t + 0.5, 0.18, 450, 0.32);
      } else if (kind === 'snort') {
        noise(a, t, 0.35, 650, 0.2); noise(a, t + 0.45, 0.3, 600, 0.18);
      } else if (kind === 'sad') {
        [440, 392, 330].forEach((fr, i) => {
          const o = a.createOscillator(); o.type = 'triangle'; const g = a.createGain(); const s0 = t + i * 0.34;
          o.frequency.setValueAtTime(fr, s0); o.frequency.linearRampToValueAtTime(fr * 0.94, s0 + 0.3);
          g.gain.setValueAtTime(0.0001, s0); g.gain.exponentialRampToValueAtTime(0.14, s0 + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, s0 + 0.42);
          o.connect(g); g.connect(a.destination); o.start(s0); o.stop(s0 + 0.45);
        });
      }
    } catch (e) { /* ses yok */ }
  }
  function daySummary(k) {
    const d = parseD(k); const goal = goalOn(d); const min = minutesOn(k);
    const sess = S.sessions.filter((x) => x.date === k);
    const q = sess.reduce((a, x) => a + (x.questions || 0), 0);
    const c = sess.reduce((a, x) => a + (x.correct || 0), 0);
    const w = sess.reduce((a, x) => a + (x.wrong || 0), 0);
    const bl = blocksFor(d); const bd = bl.filter((b) => S.done[`${k}|${b.id}`]).length;
    const earned = (S.coinLog || []).filter((x) => x.d === k && !/^Gün değerlendirmesi/.test(x.why)).reduce((a, x) => a + x.n, 0);
    let stars;
    if (!goal) stars = min > 0 ? 5 : 3; // dinlenme günü: dinlenmek de başarı
    else if (min === 0) stars = 0;
    else {
      const r = Math.min(1, min / goal);
      let sc = r * 4 + (bl.length ? (bd / bl.length) * 0.5 : r * 0.5);
      if (q >= 20 && c / Math.max(1, c + w) >= 0.7) sc += 0.5;
      stars = clamp(Math.round(sc), 1, 5);
    }
    return { k, goal, min, sessions: sess.length, q, c, w, bl: bl.length, bd, earned, stars, bonus: DAY_BONUS[stars], rest: !goal };
  }
  /** Değerlendirilmeyi bekleyen gün: dün (henüz bakılmadıysa) ya da akşam saatinden sonra bugün. */
  function pendingSummary() {
    if (!S.profile.onboarded) return null; S.dayRatings = S.dayRatings || {};
    const y = dkey(addDays(new Date(), -1));
    if (!S.dayRatings[y] && S.firstDay && y >= S.firstDay) return y;
    const t = dkey(); const now = new Date();
    if (!S.dayRatings[t] && now.getHours() * 60 + now.getMinutes() >= toMin(S.reminders.evening || '21:30')) return t;
    return null;
  }
  function showDaySummary(k) {
    S.dayRatings = S.dayRatings || {};
    const sm = daySummary(k); const fresh = !S.dayRatings[k];
    if (fresh) { S.dayRatings[k] = { stars: sm.stars, bonus: sm.bonus, min: sm.min }; if (sm.bonus) award(sm.bonus, `Gün değerlendirmesi ${'★'.repeat(sm.stars)}`); save(); }
    const st = S.dayRatings[k].stars; const ok = st >= 3; const angry = !ok && st < 2 && !sm.rest;
    const quotes = ok ? WIN_QUOTES : angry ? ANGRY_QUOTES : LOSE_QUOTES; const quote = quotes[(parseD(k).getDate() + st) % quotes.length];
    const when = k === dkey() ? 'Bugün' : k === dkey(addDays(new Date(), -1)) ? 'Dün' : fmtDate(parseD(k));
    const M = window.Mascot;
    const conf = ok ? Array.from({ length: 16 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(i % 5) * 0.18}s;--c:${['#E0B24F', '#3FB59A', '#F472B6', '#60A5FA'][i % 4]}"></i>`).join('') : '';
    const rain = ok || angry ? '' : `<div class="cloud">☁️${Array.from({ length: 6 }, (_, i) => `<b style="--x:${12 + i * 14}%;--d:${i * 0.25}s"></b>`).join('')}</div>`;
    openModal(`
      <div class="summary ${ok ? 'win' : angry ? 'angry' : 'lose'}">
        ${angry ? SPLAT_SVG : ''}
        <p class="eyebrow">${when} · Gün özeti</p>
        <div class="horse-anim">${conf}${rain}${angry ? '<span class="spit"></span>' : ''}${M ? M.svg(ok ? 'happy' : angry ? 'angry' : 'sad', 230, 'sum', mascotLook()) : ''}</div>
        <div class="stars" aria-label="${st} yıldız">${[1, 2, 3, 4, 5].map((i) => `<span class="${i <= st ? 'on' : ''}" style="--i:${i}">★</span>`).join('')}</div>
        <h3>${sm.rest ? (st === 5 ? 'Dinlenme gününde bile çalıştın!' : 'Dinlenme günü') : angry ? `${esc(S.mascotName || 'Rüzgar')} çok sinirli! 😤` : DAY_TITLES[st]}</h3>
        <p class="sum-quote">${esc(quote)}</p>
        <ul class="sum-stats">
          <li><span>Çalışma</span><b>${fmtMin(sm.min)}${sm.goal ? ` / ${fmtMin(sm.goal)}` : ''}</b></li>
          <li><span>Bloklar</span><b>${sm.bd} / ${sm.bl}</b></li>
          <li><span>Soru</span><b>${sm.q}${sm.c + sm.w ? ` · %${Math.round((100 * sm.c) / (sm.c + sm.w))} doğru` : ''}</b></li>
          <li><span>Gün içinde kazanılan</span><b>${sm.earned} 🥕</b></li>
          <li class="bonus"><span>Değerlendirme bonusu</span><b>+${S.dayRatings[k].bonus} 🥕</b></li>
        </ul>
        <div class="btn-row end"><button class="btn" value="ok">${ok ? 'Harika, devam!' : angry ? 'Tamam, yarın çalışacağım!' : 'Yarın daha iyi olacak'}</button></div>
      </div>`, () => render());
    if (ok) sfx('neigh', 0.25); else if (angry) { sfx('snort', 0.1); sfx('spit', 1.05); } else sfx('sad', 0.3);
  }
  const SPLAT_SVG = '<div class="splat" aria-hidden="true"><svg viewBox="0 0 200 200"><path d="M100 30 C130 20 150 50 170 60 C190 70 180 100 186 120 C192 150 160 160 140 176 C120 192 90 180 70 182 C40 186 24 160 20 136 C14 110 8 84 30 62 C50 42 70 40 100 30 Z" fill="#DFF3FA" fill-opacity=".85"/><circle cx="40" cy="40" r="10" fill="#DFF3FA" fill-opacity=".85"/><circle cx="178" cy="36" r="7" fill="#DFF3FA" fill-opacity=".8"/><circle cx="186" cy="172" r="9" fill="#DFF3FA" fill-opacity=".8"/><path d="M80 178 q4 30 0 40 q-4 -10 0 -40z M130 172 q4 22 0 32 q-4 -10 0 -32z" fill="#DFF3FA" fill-opacity=".85"/><ellipse cx="80" cy="80" rx="18" ry="9" fill="#fff" opacity=".7" transform="rotate(-30 80 80)"/></svg></div>';
  const STRICT_QUOTES = [
    'Ben burada senin için koşuyorum, sen video mu izliyorsun? Hadi, sayacı başlat!',
    'Videolar bekleyebilir; AGS beklemez. Şimdi 25 dakika, sonra konuşuruz.',
    'Söz vermiştin! Bu blok bitmeden ekran yok.',
    'Sınav günü YouTube sana net vermeyecek. Ders kitabı verecek.',
    'Kızdım ama hâlâ yanındayım. Başla, birlikte bitirelim.'
  ];
  /** Sıkı mod uygulamayı kapatıp geri getirdiğinde: at sinirlenir, tükürür ve sert bakar. */
  function showStrictAngry(reason, message) {
    if ($('#modal').open) return;
    const M = window.Mascot; const name = esc(S.mascotName || 'Rüzgar');
    const quote = STRICT_QUOTES[Math.floor(Date.now() / 60000) % STRICT_QUOTES.length];
    openModal(`
      <div class="summary angry strictmode">
        ${SPLAT_SVG}
        <p class="eyebrow">Sıkı mod · Odak bekçisi</p>
        <div class="horse-anim"><span class="spit"></span>${M ? M.svg('angry', 230, 'strict', mascotLook()) : ''}</div>
        <h3>${name} sana çok kızgın! 😤</h3>
        <p class="strict-why">${esc(reason === 'strict-app' ? 'Uyarıya rağmen devam ettin, o uygulamayı kapattım.' : 'Bloğun başladı ama hâlâ çalışmaya başlamadın.')}</p>
        <p class="sum-quote">${esc(quote)}</p>
        <div class="btn-row end"><button class="btn" value="ok">Tamam, şimdi çalışıyorum</button></div>
      </div>`, () => { location.hash = '#study'; render(); });
    sfx('snort', 0.1); sfx('spit', 1.05);
  }

  function summaryCard() {
    const k = pendingSummary(); if (!k) return '';
    return `<section class="card summary-cta"><div><b>⭐ ${k === dkey() ? 'Bugünün' : 'Dünün'} özeti hazır</b><p class="muted small">Kaç yıldız aldın? Değerlendirme bonusu havuçlarını topla.</p></div><button class="btn" data-act="daySummary" data-k="${k}">Özeti gör</button></section>`;
  }

  const KIND = { konu: 'Konu çalışması', soru: 'Soru çözümü', tekrar: 'Tekrar', deneme: 'Deneme (80 soru / 110 dk)', yazım: 'Tez yazımı / okuma', okuma: 'Ders okuması / ödev' };
  function blocksFor(d) { return S.plan.blocks.filter((b) => b.dow === dow(d)).sort((a, b) => toMin(a.start) - toMin(b.start)); }
  const isDone = (d, b) => !!S.done[`${dkey(d)}|${b.id}`];

  // ------------------------------------------------------------------ coach
  function coachMessages() {
    const msgs = []; const today = new Date();
    const dl = daysLeft(); const ph = phase();
    const stats = subjectStats(14); const all = subjectStats();
    const tMin = minutesOn(dkey(today)); const tGoal = goalOn(today);
    const yMin = minutesOn(dkey(addDays(today, -1))); const yGoal = goalOn(addDays(today, -1));
    const hour = today.getHours();
    const name = S.profile.name ? `${S.profile.name}, ` : '';

    if (dl >= 0) msgs.push({ t: 'info', h: `AGS’ye ${dl} gün kaldı · ${ph.name} dönemi`, p: ph.desc });
    const nextApp = keyDates().find((k) => k.kind === 'basvuru' && k.left >= 0);
    if (nextApp && nextApp.left <= 21) msgs.push({ t: 'warn', h: nextApp.left === 0 ? `Bugün: ${nextApp.t}` : `${nextApp.left} gün sonra: ${nextApp.t}`, p: 'ÖSYM başvurusunu (ais.osym.gov.tr) son güne bırakma; ücreti yatırıp başvurunu onaylatmayı unutma.' });

    if (S.sessions.length === 0) {
      msgs.push({ t: 'go', h: 'İlk adım', p: `${name}bugünkü programındaki ilk bloğa başla. “Çalış” sekmesinden sayacı açman yeterli; bitince süre kendiliğinden kaydedilir.` });
    } else if (yMin === 0 && yGoal > 0) {
      msgs.push({ t: 'warn', h: 'Dün çalışma kaydın yok', p: 'Sorun değil, seriyi bugün yeniden başlatalım. Programdan en kısa bloğu seçip 25 dakikayla başla.' });
    } else if (yGoal > 0 && yMin >= yGoal) {
      msgs.push({ t: 'good', h: 'Dün hedefini tamamladın 👏', p: `${fmtMin(yMin)} çalıştın. Aynı ritmi koru.` });
    } else if (yGoal > 0) {
      msgs.push({ t: 'info', h: `Dün hedefin %${Math.round(100 * yMin / yGoal)}’ü`, p: `${fmtMin(yMin)} / ${fmtMin(yGoal)}. Hedefler fazla yüksekse Ayarlar’dan günlük saatleri düşür — gerçekçi plan, sürdürülebilir plan.` });
    }

    if (tGoal > 0 && hour >= 19 && tMin < tGoal * 0.5) {
      msgs.push({ t: 'warn', h: 'Bugünün hedefi geride', p: `Şu ana kadar ${fmtMin(tMin)}. Yatmadan önce en az bir blok (${S.profile.block} dk) daha yapabilirsin.` });
    }

    const rv = dueReviews();
    if (rv.length) msgs.push({ t: 'focus', h: `Bugün ${rv.length} konu tekrar bekliyor`, p: rv.slice(0, 3).map((x) => x.t.name).join(', ') + (rv.length > 3 ? '…' : '') + ' — 15-20 dakikalık hızlı tekrar + 10 soru yeterli. Unutmadan önce tekrar etmek kalıcılığı katlar.' });
    if (dow(today) === 6 && S.lastWeekly !== dkey(today)) msgs.push({ t: 'tip', h: 'Pazar: haftalık değerlendirme', p: '5 dakikanı ayır: “Analiz” sekmesindeki haftalık değerlendirmeyi doldur, gelecek haftanın programını birlikte güncelleyelim.' });
    // zayıf ders
    const ex = examSubjects().filter((s) => s.weight > 0);
    const weak = ex.map((s) => ({ s, w: weakness(s, all) })).sort((a, b) => b.w - a.w)[0];
    if (weak && (S.exams.length || S.sessions.length >= 5)) {
      msgs.push({ t: 'focus', h: `Odak: ${weak.s.name}`, p: `Şu an en çok gelişime açık dersin. Programda bu derse daha fazla blok ayırdım; “Konular”dan eksik konuları işaretlemeyi unutma.` });
    }
    // ihmal edilen ders
    const neglected = ex.filter((s) => s.weight >= 8 && stats[s.id].minutes === 0 && S.sessions.length >= 3);
    if (neglected.length) {
      msgs.push({ t: 'warn', h: 'Son 14 günde hiç çalışılmayanlar', p: neglected.map((s) => s.short).join(', ') + '. Unutma eğrisini kırmak için bu hafta en az birer blok ekle.' });
    }
    // deneme
    const lastEx = [...S.exams].sort((a, b) => b.date.localeCompare(a.date))[0];
    if (ph.id >= 2 && (!lastEx || daysBetween(parseD(lastEx.date), today) > 14)) {
      msgs.push({ t: 'focus', h: 'Deneme zamanı', p: 'Son 2 haftada deneme girmedin. Bu hafta sonu bir AGS denemesi çöz, sonuçlarını “Denemeler”e gir — program sonuçlarına göre yeniden ayarlanır.' });
    }
    // yüksek lisans
    const soon = S.tasks.filter((t) => !t.done && t.due && daysBetween(today, parseD(t.due)) <= 7).sort((a, b) => a.due.localeCompare(b.due));
    for (const t of soon.slice(0, 2)) {
      const n = daysBetween(today, parseD(t.due));
      msgs.push({ t: n < 0 ? 'warn' : 'info', h: n < 0 ? `Gecikti: ${t.title}` : `${n === 0 ? 'Bugün' : n + ' gün içinde'}: ${t.title}`, p: 'Yüksek lisans görevi. Tez bloklarında öncelik bunda olsun.' });
    }
    // sinerji ipucu
    const ae = subj('alanegitimi');
    if (ae && topicProgress(ae) < 0.3 && today.getDate() % 3 === 0) {
      msgs.push({ t: 'tip', h: 'Avantajını kullan', p: 'Yüksek lisansın Din Eğitimi alanında: ÖABT’deki Alan Eğitimi konularıyla ders okumalarını birleştir, tek okumayla iki işi gör.' });
    }
    // seri
    const st = streak();
    if (st >= 3) msgs.push({ t: 'good', h: `${st} günlük seri 🔥`, p: 'Zinciri kırma. Zor bir günde bile 25 dakika yeter.' });

    msgs.push({ t: 'quote', h: 'Günün sözü', p: window.QUOTES[(today.getDate() + today.getMonth()) % window.QUOTES.length] });
    return msgs;
  }

  // ----------------------------------------------------------------- charts
  // SVG with % widths needs non-scaled coordinates; render via HTML instead for robustness
  function barsHTML(data, { goal = true } = {}) {
    const max = Math.max(60, ...data.map((x) => Math.max(x.v, goal ? x.g || 0 : 0)));
    return `<div class="bars">${data.map((x) => `
      <div class="bar-col" title="${esc(x.title || '')}">
        <div class="bar-area">
          ${goal && x.g ? `<div class="bar-goal" style="height:${(x.g / max) * 100}%"></div>` : ''}
          <div class="bar" style="height:${(x.v / max) * 100}%;background:${x.c || 'var(--accent)'}"></div>
        </div>
        <span class="bar-l">${esc(x.l)}</span>
      </div>`).join('')}</div>`;
  }
  function lineChart(series, { h = 180, maxY = null } = {}) {
    const W = 600; const pts = series[0]?.pts || [];
    if (pts.length < 1) return '<p class="muted">Grafik için en az bir deneme gir.</p>';
    const all = series.flatMap((s) => s.pts.map((p) => p.y));
    const mx = maxY ?? Math.max(10, Math.ceil(Math.max(...all) / 10) * 10);
    const n = pts.length; const px = (i) => (n === 1 ? W / 2 : 30 + (i * (W - 50)) / (n - 1)); const py = (v) => h - 24 - (v / mx) * (h - 40);
    const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => `<line x1="28" x2="${W - 10}" y1="${py(mx * f)}" y2="${py(mx * f)}" class="grid"/><text x="2" y="${py(mx * f) + 4}" class="ax">${Math.round(mx * f)}</text>`).join('');
    const lines = series.map((s) => `<polyline fill="none" stroke="${s.color}" stroke-width="2.5" stroke-linejoin="round" points="${s.pts.map((p, i) => `${px(i)},${py(p.y)}`).join(' ')}"/>` +
      s.pts.map((p, i) => `<circle cx="${px(i)}" cy="${py(p.y)}" r="4" fill="${s.color}"><title>${esc(s.name)}: ${round1(p.y)} net (${esc(p.l)})</title></circle>`).join('')).join('');
    const labels = pts.map((p, i) => `<text x="${px(i)}" y="${h - 6}" text-anchor="middle" class="ax">${esc(p.l)}</text>`).join('');
    return `<svg class="chart" viewBox="0 0 ${W} ${h}" role="img">${grid}${lines}${labels}</svg>`;
  }
  const progressBar = (v, color = 'var(--accent)') => `<div class="pbar"><span style="width:${clamp(v * 100, 0, 100)}%;background:${color}"></span></div>`;

  // ------------------------------------------------------------------ views
  const VIEWS = [
    { id: 'today', title: 'Bugün', icon: '◉' },
    { id: 'plan', title: 'Program', icon: '▦' },
    { id: 'study', title: 'Çalış', icon: '⏱' },
    { id: 'topics', title: 'Konular', icon: '☰' },
    { id: 'exams', title: 'Denemeler', icon: '✎' },
    { id: 'yl', title: 'Yüksek Lisans', icon: '🎓' },
    { id: 'ahir', title: 'Ahır', icon: '🐴' },
    { id: 'stats', title: 'Analiz', icon: '📈' },
    { id: 'guide', title: 'Rehber', icon: '🧭' },
    { id: 'ayarlar', title: 'Ayarlar', icon: '⚙' }
  ];
  const TAB_IDS = ['today', 'plan', 'study', 'ahir', 'more'];
  let current = (location.hash || '#today').slice(1);
  if (!VIEWS.find((v) => v.id === current) && current !== 'more') current = 'today';

  function renderNav() {
    $('#nav').innerHTML = VIEWS.map((v) => `<a href="#${v.id}" class="${v.id === current ? 'active' : ''}"><span class="ico">${v.icon}</span>${v.title}</a>`).join('');
    const more = ['topics', 'exams', 'yl', 'stats', 'guide', 'ayarlar', 'more'].includes(current);
    $('#tabbar').innerHTML = TAB_IDS.map((id) => {
      if (id === 'more') return `<a href="#more" class="${more ? 'active' : ''}"><span class="ico">⋯</span>Diğer</a>`;
      const v = VIEWS.find((x) => x.id === id);
      return `<a href="#${id}" class="${id === current ? 'active' : ''}"><span class="ico">${v.icon}</span>${v.title}</a>`;
    }).join('');
    const dl = daysLeft();
    const od = S.profile.oabtDate ? daysBetween(new Date(), parseD(S.profile.oabtDate)) : null;
    $('#countdown-mini').innerHTML = dl >= 0 ? `<b>${dl}</b> gün<br><small>AGS: ${fmtDate(parseD(S.profile.agsDate))} ${parseD(S.profile.agsDate).getFullYear()}${od !== null && od >= 0 ? `<br>ÖABT: ${fmtDate(parseD(S.profile.oabtDate))} · ${od} gün` : ''}</small>` : '';
    const st = streak();
    $('#streak-chip').textContent = st ? `🔥 ${st} gün` : `⏳ ${Math.max(dl, 0)} gün`;
    const cc = $('#coin-chip'); if (cc) cc.textContent = `🥕 ${S.coins || 0}`;
  }

  function render() {
    renderNav();
    const v = VIEWS.find((x) => x.id === current);
    $('#page-title').textContent = current === 'more' ? 'Diğer' : v.title;
    const fn = { today: vToday, plan: vPlan, study: vStudy, topics: vTopics, exams: vExams, yl: vYL, stats: vStats, ahir: vShop, guide: vGuide, ayarlar: vSettings, more: vMore }[current];
    $('#view').innerHTML = fn();
    renderTimerChip();
    if (current === 'study') tickTimer();
    setSync(syncState);
    if (isNative && current === 'ayarlar') fillNativeStatus();
  }

  function vMore() {
    return `<div class="grid-more">${['stats', 'topics', 'exams', 'yl', 'guide', 'ayarlar'].map((id) => { const v = VIEWS.find((x) => x.id === id); return `<a class="card more-card" href="#${id}"><span class="big-ico">${v.icon}</span>${v.title}</a>`; }).join('')}</div>`;
  }

  function blockRow(b, d, { actions = true } = {}) {
    const done = isDone(d, b);
    const end = toHHMM(toMin(b.start) + b.minutes);
    return `<li class="block ${done ? 'is-done' : ''}" style="--c:${subjColor(b.subjectId)}">
      <div class="block-time">${b.start}<small>${end}</small></div>
      <div class="block-body"><b>${esc(subjName(b.subjectId))}</b><small>${KIND[b.kind] || ''} · ${b.minutes} dk</small></div>
      ${actions ? `<div class="block-act">
        ${done ? '<span class="ok">✓</span>' : `<button class="btn sm" data-act="startBlock" data-id="${b.id}" title="Sayacı başlat">▶</button>`}
        <button class="btn sm ghost" data-act="toggleDone" data-id="${b.id}" data-date="${dkey(d)}" title="${done ? 'Geri al' : 'Yapıldı işaretle'}">${done ? '↺' : '✓'}</button>
      </div>` : ''}
    </li>`;
  }

  function datesCard() {
    const ks = keyDates(); const upcoming = ks.filter((k) => k.left >= 0);
    if (!upcoming.length) return '';
    return `<section class="card"><div class="card-h"><h3>Önemli tarihler</h3><span class="muted small">ÖSYM 2027 takvimi</span></div>
      <ol class="keydates">${ks.map((k) => `<li class="kd-${k.kind} ${k.left < 0 ? 'past' : ''} ${k === upcoming[0] ? 'next' : ''}">
        <span class="kd-date">${fmtDate(parseD(k.d))}</span><span class="kd-t">${esc(k.short)}</span>
        <span class="kd-left">${k.left < 0 ? 'geçti' : k.left === 0 ? 'bugün' : k.left + ' gün'}</span></li>`).join('')}</ol></section>`;
  }
  function vToday() {
    const today = new Date(); const dl = daysLeft();
    const tMin = minutesOn(dkey(today)); const tGoal = goalOn(today);
    const week = rangeMinutes(7); const wMin = week.reduce((a, x) => a + x.m, 0); const wGoal = week.reduce((a, x) => a + x.g, 0);
    const blocks = blocksFor(today);
    const doneN = blocks.filter((b) => isDone(today, b)).length;
    const hr = today.getHours();
    const greet = hr < 6 ? 'İyi geceler' : hr < 12 ? 'Günaydın' : hr < 18 ? 'İyi günler' : 'İyi akşamlar';
    const msgs = coachMessages();
    const tasks = S.tasks.filter((t) => !t.done).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999')).slice(0, 4);

    const md = window.Mascot ? window.Mascot.mood({ todayMin: tMin, goal: tGoal, yesterdayMin: minutesOn(dkey(addDays(today, -1))), hour: hr }) : null;
    return `
    <div class="hero card">
      ${md ? `<a class="mascot" href="#ahir" title="${esc(S.mascotName || 'Rüzgar')} — ahıra git">${window.Mascot.svg(md, 96, 'hero', mascotLook())}<span class="bubble"><b>${esc(S.mascotName || 'Rüzgar')}:</b> ${esc(window.Mascot.line(md))}</span></a>` : ''}
      <div class="hero-text">
        <p class="eyebrow">${DAYS[dow(today)]}, ${fmtDate(today)}</p>
        <h2>${greet}${S.profile.name ? ', ' + esc(S.profile.name) : ''}</h2>
        <p class="muted">Bugünkü hedef: <b>${fmtMin(tGoal)}</b> · ${blocks.length} blok</p>
      </div>
      <div class="ring" style="--p:${tGoal ? clamp(tMin / tGoal, 0, 1) : 0}">
        <div><b>${fmtMin(tMin)}</b><small>bugün</small></div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat card"><small>AGS’ye</small><b>${dl >= 0 ? dl : '—'}</b><span>gün</span></div>
      <div class="stat card"><small>Bu hafta</small><b>${Math.round(wMin / 60 * 10) / 10}</b><span>/ ${Math.round(wGoal / 60)} saat</span></div>
      <div class="stat card"><small>Seri</small><b>${streak()}</b><span>gün</span></div>
      <div class="stat card"><small>Bugün blok</small><b>${doneN}</b><span>/ ${blocks.length}</span></div>
    </div>

    ${summaryCard()}
    ${datesCard()}
    <div class="two-col">
      <section class="card">
        <div class="card-h"><h3>Koçun diyor ki</h3></div>
        <ul class="coach">${msgs.map((m) => `<li class="c-${m.t}"><b>${esc(m.h)}</b><p>${esc(m.p)}</p></li>`).join('')}</ul>
      </section>
      <div class="stack">
        <section class="card">
          <div class="card-h"><h3>Bugünün programı</h3><a href="#plan" class="link">Tümü →</a></div>
          ${blocks.length ? `<ul class="blocks">${blocks.map((b) => blockRow(b, today)).join('')}</ul>` :
            `<p class="muted">Bugün için blok yok. ${S.plan.blocks.length ? 'Dinlenme günü — ya da Ayarlar’dan saat ekle.' : ''}</p>
             ${S.plan.blocks.length ? '' : '<button class="btn" data-act="regen">Programımı oluştur</button>'}`}
        </section>
        ${reviewCard()}
        <section class="card">
          <div class="card-h"><h3>Yüksek lisans</h3><a href="#yl" class="link">Görevler →</a></div>
          ${tasks.length ? `<ul class="tasks">${tasks.map(taskRow).join('')}</ul>` : '<p class="muted">Açık görev yok.</p>'}
        </section>
      </div>
    </div>
    ${!S.reminders.enabled ? `<section class="card banner"><div><b>Hatırlatıcıları aç</b><p class="muted">Sabah planını, akşam kontrolünü ve blok başlangıçlarını bildirim olarak al.</p></div><a class="btn" href="#ayarlar">Ayarla</a></section>` : ''}`;
  }

  function reviewCard() {
    const rv = dueReviews(); if (!rv.length) return '';
    return `<section class="card"><div class="card-h"><h3>Bugünkü tekrarlar</h3><span class="chip">${rv.length}</span></div>
      <ul class="reviews">${rv.slice(0, 6).map((x) => `<li style="--c:${x.s.color}"><div><b>${esc(x.t.name)}</b><small class="muted">${esc(x.s.short)} · ${(x.t.reviews || 0) + 1}. tekrar${x.late ? ` · ${x.late} gün gecikti` : ''}</small></div>
        <button class="btn sm" data-act="reviewed" data-s="${x.s.id}" data-t="${x.t.id}">Tekrar ettim</button></li>`).join('')}</ul></section>`;
  }

  let planDay = dow();
  function vPlan() {
    const today = new Date(); const monday = addDays(today, -dow(today));
    const P = S.profile;
    const byDay = [0, 1, 2, 3, 4, 5, 6].map((i) => S.plan.blocks.filter((b) => b.dow === i).sort((a, b) => toMin(a.start) - toMin(b.start)));
    const totals = {}; for (const b of S.plan.blocks) totals[b.subjectId] = (totals[b.subjectId] || 0) + b.minutes;
    const totalAll = Object.values(totals).reduce((a, b) => a + b, 0);
    const ph = phase();
    return `
    <section class="card">
      <div class="card-h wrap">
        <div><h3>Haftalık program</h3><p class="muted small">Dönem: <b>${ph.name}</b> — ${ph.desc}${S.plan.generatedAt ? ` · Son güncelleme: ${fmtDate(new Date(S.plan.generatedAt))}` : ''}</p></div>
        <div class="btn-row">
          <button class="btn" data-act="regen">↻ Yeniden oluştur</button>
          <button class="btn ghost" data-act="addBlock">+ Blok</button>
          <button class="btn ghost" data-act="ics">📅 Takvime aktar</button>
        </div>
      </div>
      <p class="muted small">Program; ders ağırlıklarına, konu ilerlemene ve deneme sonuçlarına göre otomatik dağıtılır. Zayıf olduğun derse daha çok blok düşer. Bir bloğa dokunarak değiştirebilirsin.</p>
      <div class="day-tabs">${DAYS_S.map((d, i) => `<button class="${i === planDay ? 'active' : ''} ${i === dow() ? 'is-today' : ''}" data-act="planDay" data-i="${i}">${d}<small>${fmtMin(byDay[i].reduce((a, b) => a + b.minutes, 0))}</small></button>`).join('')}</div>
      <div class="week">
        ${byDay.map((bl, i) => {
          const d = addDays(monday, i);
          return `<div class="day ${i === planDay ? 'show' : ''} ${i === dow() ? 'is-today' : ''}">
            <h4>${DAYS[i]} <small>${fmtDate(d)} · ${P.hours[i]} sa</small></h4>
            ${bl.length ? `<ul class="blocks compact">${bl.map((b) => `<li class="block ${isDone(d, b) ? 'is-done' : ''}" style="--c:${subjColor(b.subjectId)}" data-act="editBlock" data-id="${b.id}" tabindex="0">
                <div class="block-time">${b.start}</div>
                <div class="block-body"><b>${esc(subj(b.subjectId)?.short || subjName(b.subjectId))}</b><small>${KIND[b.kind] || ''} · ${b.minutes} dk</small></div></li>`).join('')}</ul>` : '<p class="muted small">Boş gün</p>'}
          </div>`;
        }).join('')}
      </div>
    </section>
    <section class="card">
      <div class="card-h"><h3>Haftalık dağılım</h3><span class="muted">${fmtMin(totalAll)}</span></div>
      <div class="dist">${Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([id, m]) => `
        <div class="dist-row"><span class="dot" style="background:${subjColor(id)}"></span><span class="dist-n">${esc(subjName(id))}</span>${progressBar(m / (totalAll || 1), subjColor(id))}<span class="dist-v">${fmtMin(m)}</span></div>`).join('')}</div>
    </section>`;
  }

  // ------------------------------------------------------------------ timer
  function timerElapsed() { const t = S.timer; if (!t) return 0; return t.acc + (t.running ? (Date.now() - t.startedAt) : 0); }
  function subjectOptions(sel, { includeYL = true } = {}) {
    return Object.entries(window.GROUPS).filter(([g]) => includeYL || g !== 'yl').map(([g, G]) => `<optgroup label="${G.name}">${S.subjects.filter((s) => s.group === g).map((s) => `<option value="${s.id}" ${s.id === sel ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</optgroup>`).join('');
  }
  function topicOptions(sid, sel) {
    const s = subj(sid); if (!s) return '<option value="">—</option>';
    return '<option value="">Konu seç (isteğe bağlı)</option>' + s.topics.map((t) => `<option value="${t.id}" ${t.id === sel ? 'selected' : ''}>${esc(t.name)}</option>`).join('');
  }
  let studySubject = null;
  function vStudy() {
    const t = S.timer;
    const sid = t?.subjectId || studySubject || nextBlockToday()?.subjectId || 'egitim';
    const recent = [...S.sessions].sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id)).slice(0, 12);
    const target = t ? t.target : Number(S.profile.block) || 50;
    return `
    <div class="two-col">
      <section class="card timer-card">
        <div class="field-row">
          <label>Ders<select id="t-subject" ${t ? 'disabled' : ''}>${subjectOptions(sid)}</select></label>
          <label>Konu<select id="t-topic" ${t ? 'disabled' : ''}>${topicOptions(sid, t?.topicId)}</select></label>
        </div>
        <div class="field-row">
          <label>Süre (dk)<select id="t-target" ${t ? 'disabled' : ''}>${[25, 30, 40, 50, 60, 90, 110].map((m) => `<option ${m === target ? 'selected' : ''}>${m}</option>`).join('')}</select></label>
        </div>
        ${window.Mascot ? `<div class="sprint ${t && t.running ? 'running' : ''}">
          <div class="sprint-horse">${window.Mascot.svg(t && t.running ? 'happy' : t ? 'worried' : 'ok', 92, 'sprint', mascotLook())}</div>
          <span class="bubble">${t && t.running ? `Dört nala! Her 5 dakika = 1 🥕${t.blockId ? ', blok bitince +5' : ''}` : t ? 'Mola mı? Hadi devam edelim!' : 'Başla’ya bas, birlikte koşalım. 🥕 kazan!'}</span>
        </div>` : ''}
        <div class="clock" id="clock" style="--c:${subjColor(sid)}">
          <svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" class="clock-bg"/><circle cx="60" cy="60" r="54" class="clock-fg" id="clock-arc" pathLength="100"/></svg>
          <div class="clock-t"><b id="clock-time">00:00</b><small id="clock-sub">${t ? (t.running ? 'çalışıyor' : 'duraklatıldı') : 'hazır'}</small></div>
        </div>
        <div class="btn-row center">
          ${!t ? '<button class="btn lg" data-act="tStart">▶ Başla</button>' :
            `${t.running ? '<button class="btn lg ghost" data-act="tPause">❚❚ Duraklat</button>' : '<button class="btn lg ghost" data-act="tResume">▶ Devam</button>'}
             <button class="btn lg" data-act="tFinish">■ Bitir ve kaydet</button>
             <button class="btn sm ghost danger" data-act="tCancel">İptal</button>`}
        </div>
        <p class="muted small center">Sayaç arka planda da sayar; sekmeyi kapatsan bile geri döndüğünde devam eder.</p>
      </section>
      <section class="card">
        <div class="card-h"><h3>Son çalışmalar</h3><button class="btn sm ghost" data-act="addSession">+ Elle ekle</button></div>
        ${recent.length ? `<ul class="sessions">${recent.map((x) => `<li style="--c:${subjColor(x.subjectId)}">
          <div><b>${esc(subj(x.subjectId)?.short || 'Genel')}</b> <small class="muted">${esc(subj(x.subjectId)?.topics.find((t) => t.id === x.topicId)?.name || '')}</small>
          <small class="muted d">${fmtDate(parseD(x.date))}${x.questions ? ` · ${x.questions} soru (${x.correct}D/${x.wrong}Y)` : ''}</small></div>
          <span>${fmtMin(x.minutes)}</span><button class="icon-btn" data-act="delSession" data-id="${x.id}" title="Sil">×</button></li>`).join('')}</ul>` :
          '<p class="muted">Henüz kayıt yok. Sayacı başlat ya da elle ekle.</p>'}
      </section>
    </div>`;
  }
  function nextBlockToday() {
    const now = new Date(); const nowM = now.getHours() * 60 + now.getMinutes();
    return blocksFor(now).find((b) => !isDone(now, b) && toMin(b.start) + b.minutes > nowM) || null;
  }
  function tickTimer() {
    const el = $('#clock-time'); if (!el) return;
    const ms = timerElapsed(); const s = Math.floor(ms / 1000);
    el.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
    const target = (S.timer?.target || Number($('#t-target')?.value) || 50) * 60000;
    const arc = $('#clock-arc'); if (arc) { arc.style.strokeDasharray = `${clamp(ms / target * 100, 0, 100)} 100`; arc.style.opacity = ms > 1000 ? 1 : 0; }
    if (S.timer && S.timer.running && !S.timer.alerted && ms >= target) {
      S.timer.alerted = true; save();
      notify('Blok tamamlandı ⏰', `${subjName(S.timer.subjectId)}: ${S.timer.target} dakika doldu. Kaydet ve ${S.profile.brk} dk mola ver.`, 'timer');
      beep();
    }
  }
  function renderTimerChip() {
    const c = $('#timer-chip');
    if (!S.timer) { c.classList.add('hidden'); return; }
    c.classList.remove('hidden');
    const s = Math.floor(timerElapsed() / 1000);
    c.textContent = `${S.timer.running ? '⏱' : '❚❚'} ${pad(Math.floor(s / 60))}:${pad(s % 60)} ${subj(S.timer.subjectId)?.short || ''}`;
  }
  function startTimer(subjectId, topicId, target, blockId) {
    S.timer = { subjectId, topicId: topicId || '', target: Number(target) || 50, blockId: blockId || null, running: true, startedAt: Date.now(), acc: 0, date: dkey() };
    save();
  }
  function beep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.25, 0.5].forEach((t) => { const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.value = 880; o.connect(g); g.connect(ctx.destination); g.gain.setValueAtTime(0.2, ctx.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.2); o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.2); });
    } catch (e) { /* ses yok */ }
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }

  function sessionForm(x = {}) {
    const sid = x.subjectId || 'egitim';
    return `
      <h3>${x.id ? 'Çalışmayı düzenle' : 'Çalışmayı kaydet'}</h3>
      <div class="field-row">
        <label>Ders<select name="subjectId" id="m-subject">${subjectOptions(sid)}</select></label>
        <label>Konu<select name="topicId" id="m-topic">${topicOptions(sid, x.topicId)}</select></label>
      </div>
      <div class="field-row">
        <label>Tarih<input type="date" name="date" value="${x.date || dkey()}" required></label>
        <label>Süre (dk)<input type="number" name="minutes" min="1" max="600" value="${x.minutes || 50}" required></label>
      </div>
      <div class="field-row three">
        <label>Doğru<input type="number" name="correct" min="0" value="${x.correct || 0}"></label>
        <label>Yanlış<input type="number" name="wrong" min="0" value="${x.wrong || 0}"></label>
        <label>Boş<input type="number" name="blank" min="0" value="${x.blank || 0}"></label>
      </div>
      <label>Konu durumu
        <select name="topicStatus"><option value="">Değiştirme</option>${window.TOPIC_STATUS.map((s) => `<option value="${s.id}">${s.label}</option>`).join('')}</select>
      </label>
      <label>Not<input name="note" value="${esc(x.note || '')}" placeholder="Ör. yanlış yaptığım soru tipleri"></label>
      <div class="btn-row end"><button class="btn ghost" value="cancel" formnovalidate>Vazgeç</button><button class="btn" value="ok">Kaydet</button></div>`;
  }
  function saveSession(f, extra = {}) {
    const correct = Number(f.correct) || 0, wrong = Number(f.wrong) || 0, blank = Number(f.blank) || 0;
    const sess = { id: uid(), date: f.date || dkey(), subjectId: f.subjectId, topicId: f.topicId || '', minutes: Number(f.minutes) || 0, correct, wrong, blank, questions: correct + wrong + blank, note: f.note || '', ...extra };
    if (sess.minutes <= 0) return;
    S.sessions.push(sess);
    if (f.topicStatus !== '' && f.topicStatus != null && sess.topicId) {
      const t = subj(sess.subjectId)?.topics.find((x) => x.id === sess.topicId); if (t) setTopicStatus(t, Number(f.topicStatus));
    } else if (sess.topicId) {
      const t = subj(sess.subjectId)?.topics.find((x) => x.id === sess.topicId); if (t && t.status === 0) t.status = 1;
    }
    let blockDone = false;
    if (extra.blockId) { S.done[`${sess.date}|${extra.blockId}`] = true; blockDone = true; }
    else { // plana uyan bloğu otomatik işaretle
      const d = parseD(sess.date); const b = blocksFor(d).find((b) => b.subjectId === sess.subjectId && !isDone(d, b));
      if (b && sess.minutes >= b.minutes * 0.6) { S.done[`${sess.date}|${b.id}`] = true; blockDone = true; }
    }
    award(Math.floor(Math.min(sess.minutes, 240) / 5) + (blockDone ? 5 : 0), blockDone ? 'Blok tamamlandı' : 'Çalışma');
    checkGoalAward(sess.date);
    save();
    toast(`Kaydedildi: ${fmtMin(sess.minutes)} ${subj(sess.subjectId)?.short || ''} ✓`);
  }

  // ----------------------------------------------------------------- topics
  let openSubj = null;
  function vTopics() {
    return Object.entries(window.GROUPS).map(([g, G]) => {
      const list = S.subjects.filter((s) => s.group === g);
      const avg = list.reduce((a, s) => a + topicProgress(s), 0) / (list.length || 1);
      return `<section class="card">
        <div class="card-h"><div><h3>${G.name}</h3><p class="muted small">${G.desc}</p></div><b>%${Math.round(avg * 100)}</b></div>
        ${list.map((s) => {
          const p = topicProgress(s); const open = openSubj === s.id;
          return `<div class="subj ${open ? 'open' : ''}" style="--c:${s.color}">
            <button class="subj-h" data-act="openSubj" data-id="${s.id}">
              <span class="dot"></span><span class="subj-n">${esc(s.name)}${s.weight ? ` <small class="muted">· ${s.weight} soru</small>` : ''}</span>
              ${progressBar(p, s.color)}<span class="subj-p">%${Math.round(p * 100)}</span><span class="chev">${open ? '▴' : '▾'}</span>
            </button>
            ${open ? `<ul class="topics">${s.topics.map((t) => `<li>
                <span class="t-n">${esc(t.name)}</span>
                <div class="seg">${window.TOPIC_STATUS.map((st) => `<button class="${t.status === st.id ? 'on s' + st.id : ''}" data-act="topicStatus" data-s="${s.id}" data-t="${t.id}" data-v="${st.id}" title="${st.label}">${st.short}</button>`).join('')}</div>
                <button class="icon-btn" data-act="delTopic" data-s="${s.id}" data-t="${t.id}" title="Sil">×</button></li>`).join('')}
              <li class="add-topic"><input id="new-topic-${s.id}" placeholder="Yeni konu ekle…"><button class="btn sm" data-act="addTopic" data-s="${s.id}">Ekle</button></li></ul>` : ''}
          </div>`;
        }).join('')}
      </section>`;
    }).join('') + `<p class="muted small center">— Başlanmadı · ◐ Çalışılıyor · ✓ Bitti · ★ Tekrar edildi</p>`;
  }

  // ------------------------------------------------------------------ exams
  function examTotals(e) {
    const ids = Object.keys(e.res || {});
    return ids.reduce((a, id) => { const r = e.res[id]; a.d += Number(r.d) || 0; a.y += Number(r.y) || 0; a.q += subj(id)?.weight || 0; return a; }, { d: 0, y: 0, q: 0 });
  }
  function vExams() {
    const list = [...S.exams].sort((a, b) => a.date.localeCompare(b.date));
    const mk = (type) => list.filter((e) => e.type === type).slice(-10);
    const agsL = mk('AGS'); const oabtL = mk('ÖABT');
    const series = (L, ids) => ids.map((id) => ({ name: subj(id).short, color: subj(id).color, pts: L.map((e) => ({ y: e.res[id] ? net(e.res[id].d, e.res[id].y) : 0, l: fmtDate(parseD(e.date)) })) }));
    const totSeries = (L, name) => [{ name, color: 'var(--accent)', pts: L.map((e) => { const t = examTotals(e); return { y: net(t.d, t.y), l: fmtDate(parseD(e.date)) }; }) }];
    return `
    <section class="card">
      <div class="card-h wrap"><div><h3>Deneme sınavları</h3><p class="muted small">Net = Doğru − Yanlış ÷ 4. Sonuçlar programın ağırlıklarını otomatik günceller.</p></div>
      <div class="btn-row"><button class="btn" data-act="addExam" data-type="AGS">+ AGS denemesi</button><button class="btn ghost" data-act="addExam" data-type="ÖABT">+ ÖABT denemesi</button></div></div>
    </section>
    <div class="two-col">
      <section class="card"><div class="card-h"><h3>AGS toplam net</h3><span class="muted">/ 80</span></div>${lineChart(totSeries(agsL, 'AGS'), { maxY: 80 })}
        ${agsL.length ? `<div class="legend">${series(agsL, examSubjects().filter((s) => s.group === 'ags').map((s) => s.id)).map((s) => `<span><i style="background:${s.color}"></i>${s.name}: <b>${round1(s.pts[s.pts.length - 1].y)}</b></span>`).join('')}</div>` : ''}</section>
      <section class="card"><div class="card-h"><h3>ÖABT toplam net</h3><span class="muted">/ 50</span></div>${lineChart(totSeries(oabtL, 'ÖABT'), { maxY: 50 })}
        ${oabtL.length ? `<div class="legend">${series(oabtL, examSubjects().filter((s) => s.group === 'oabt').map((s) => s.id)).map((s) => `<span><i style="background:${s.color}"></i>${s.name}: <b>${round1(s.pts[s.pts.length - 1].y)}</b></span>`).join('')}</div>` : ''}</section>
    </div>
    <section class="card">
      <div class="card-h"><h3>Tüm denemeler</h3></div>
      ${list.length ? `<div class="table-wrap"><table><thead><tr><th>Tarih</th><th>Ad</th><th>Tür</th><th>D</th><th>Y</th><th>Net</th><th></th></tr></thead><tbody>
        ${[...list].reverse().map((e) => { const t = examTotals(e); return `<tr><td>${fmtDate(parseD(e.date))}</td><td>${esc(e.name)}</td><td>${e.type}</td><td>${t.d}</td><td>${t.y}</td><td><b>${round1(net(t.d, t.y))}</b></td>
          <td class="nowrap"><button class="icon-btn" data-act="editExam" data-id="${e.id}" title="Düzenle">✎</button><button class="icon-btn" data-act="delExam" data-id="${e.id}" title="Sil">×</button></td></tr>`; }).join('')}
      </tbody></table></div>` : '<p class="muted">Henüz deneme girmedin.</p>'}
    </section>`;
  }
  function examForm(type, e = {}) {
    const ids = examSubjects().filter((s) => s.group === (type === 'AGS' ? 'ags' : 'oabt'));
    return `<h3>${type} denemesi</h3>
      <div class="field-row"><label>Tarih<input type="date" name="date" value="${e.date || dkey()}" required></label>
      <label>Yayın / ad<input name="name" value="${esc(e.name || '')}" placeholder="Ör. X Yayınları 3. deneme"></label></div>
      <table class="exam-input"><thead><tr><th>Test</th><th>Soru</th><th>Doğru</th><th>Yanlış</th></tr></thead><tbody>
      ${ids.map((s) => `<tr><td>${esc(s.name)}</td><td class="muted">${s.weight}</td>
        <td><input type="number" min="0" max="${s.weight}" name="d_${s.id}" value="${e.res?.[s.id]?.d ?? ''}"></td>
        <td><input type="number" min="0" max="${s.weight}" name="y_${s.id}" value="${e.res?.[s.id]?.y ?? ''}"></td></tr>`).join('')}
      </tbody></table>
      <input type="hidden" name="type" value="${type}">
      <div class="btn-row end"><button class="btn ghost" value="cancel" formnovalidate>Vazgeç</button><button class="btn" value="ok">Kaydet</button></div>`;
  }

  // --------------------------------------------------------------------- YL
  function taskRow(t) {
    const today = new Date(); const n = t.due ? daysBetween(today, parseD(t.due)) : null;
    const badge = t.due ? `<span class="due ${t.done ? '' : n < 0 ? 'late' : n <= 3 ? 'soon' : ''}">${t.done ? fmtDate(parseD(t.due)) : n < 0 ? `${-n} gün gecikti` : n === 0 ? 'Bugün' : `${n} gün`}</span>` : '';
    const TYPES = { tez: 'Tez', ders: 'Ders', odev: 'Ödev', makale: 'Makale', sunum: 'Sunum', diger: 'Diğer' };
    return `<li class="${t.done ? 'is-done' : ''}"><button class="check" data-act="toggleTask" data-id="${t.id}" aria-label="Tamamlandı">${t.done ? '✓' : ''}</button>
      <div class="task-b"><span>${esc(t.title)}</span><small class="muted">${TYPES[t.type] || ''}</small></div>${badge}
      <button class="icon-btn" data-act="editTask" data-id="${t.id}" title="Düzenle">✎</button></li>`;
  }
  function vYL() {
    const open = S.tasks.filter((t) => !t.done).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
    const done = S.tasks.filter((t) => t.done);
    const tez = subj('tez'); const st = subjectStats(7);
    return `
    <div class="two-col">
      <section class="card">
        <div class="card-h"><h3>Görevler ve teslim tarihleri</h3><button class="btn sm" data-act="addTask">+ Görev</button></div>
        ${open.length ? `<ul class="tasks">${open.map(taskRow).join('')}</ul>` : '<p class="muted">Açık görev yok 🎉</p>'}
        ${done.length ? `<details><summary class="muted">Tamamlananlar (${done.length})</summary><ul class="tasks">${done.map(taskRow).join('')}</ul></details>` : ''}
      </section>
      <div class="stack">
        <section class="card">
          <div class="card-h"><h3>Tez yol haritası</h3><b>%${Math.round(topicProgress(tez) * 100)}</b></div>
          <ol class="roadmap">${tez.topics.map((t) => `<li class="s${t.status}"><button data-act="cycleTopic" data-s="tez" data-t="${t.id}">${window.TOPIC_STATUS[t.status].short}</button>${esc(t.name)}</li>`).join('')}</ol>
          <p class="muted small">Adıma dokunarak durumunu değiştir. Adımları “Konular” sekmesinden düzenleyebilirsin.</p>
        </section>
        <section class="card">
          <h3>Bu hafta yüksek lisansa ayrılan</h3>
          <p class="big">${fmtMin((st.tez?.minutes || 0) + (st.yldersler?.minutes || 0))}</p>
          <p class="muted small">Programdaki pay: %${S.profile.ylShare}. Teslim haftalarında Ayarlar’dan bu oranı artırıp programı yeniden oluştur.</p>
        </section>
      </div>
    </div>`;
  }
  function taskForm(t = {}) {
    const TYPES = { tez: 'Tez', ders: 'Ders', odev: 'Ödev', makale: 'Makale', sunum: 'Sunum', diger: 'Diğer' };
    return `<h3>${t.id ? 'Görevi düzenle' : 'Yeni görev'}</h3>
      <label>Başlık<input name="title" value="${esc(t.title || '')}" required placeholder="Ör. Din Eğitimi Tarihi dersi ödevi"></label>
      <div class="field-row"><label>Tür<select name="type">${Object.entries(TYPES).map(([k, v]) => `<option value="${k}" ${t.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
      <label>Teslim tarihi<input type="date" name="due" value="${t.due || ''}"></label></div>
      <div class="btn-row end">${t.id ? '<button class="btn ghost danger" value="delete" formnovalidate>Sil</button>' : ''}<button class="btn ghost" value="cancel" formnovalidate>Vazgeç</button><button class="btn" value="ok">Kaydet</button></div>`;
  }

  // ------------------------------------------------------------------ stats
  function vStats() {
    const days14 = rangeMinutes(14);
    const bars = days14.map((x) => ({ v: x.m, g: x.g, l: DAYS_S[dow(x.d)].slice(0, 2), title: `${fmtDate(x.d)}: ${fmtMin(x.m)} / ${fmtMin(x.g)}` }));
    const st30 = subjectStats(30); const all = subjectStats();
    const ex = examSubjects();
    const totalMin = S.sessions.reduce((a, s) => a + s.minutes, 0);
    const totalQ = S.sessions.reduce((a, s) => a + (s.questions || 0), 0);
    const totalC = S.sessions.reduce((a, s) => a + (s.correct || 0), 0);
    const totalW = S.sessions.reduce((a, s) => a + (s.wrong || 0), 0);
    const w7 = rangeMinutes(7); const pw = []; for (let i = 13; i >= 7; i--) pw.push(minutesOn(dkey(addDays(new Date(), -i))));
    const thisW = w7.reduce((a, x) => a + x.m, 0); const prevW = pw.reduce((a, b) => a + b, 0);
    const consistency = w7.filter((x) => x.m >= 15).length;
    const goalHit = w7.filter((x) => x.g && x.m >= x.g).length;
    const examMin = ex.reduce((a, s) => a + st30[s.id].minutes, 0);
    const wsum = ex.reduce((a, s) => a + s.weight, 0);
    const rows = ex.map((s) => {
      const share = examMin ? st30[s.id].minutes / examMin : 0; const ideal = s.weight / wsum;
      const acc = all[s.id].c + all[s.id].w ? all[s.id].c / (all[s.id].c + all[s.id].w) : null;
      return { s, share, ideal, acc, w: weakness(s, all), prog: topicProgress(s), m: st30[s.id].minutes };
    });
    const insights = [];
    if (prevW || thisW) insights.push(thisW >= prevW ? `Bu hafta geçen haftaya göre ${fmtMin(thisW - prevW)} daha fazla çalıştın.` : `Bu hafta geçen haftadan ${fmtMin(prevW - thisW)} daha az çalıştın.`);
    insights.push(`Son 7 günün ${consistency}’sinde çalıştın, ${goalHit} gün hedefi tutturdun.`);
    const under = rows.filter((r) => examMin > 0 && r.share < r.ideal * 0.6).map((r) => r.s.short);
    if (under.length) insights.push(`Sınav ağırlığına göre az çalışılanlar: ${under.join(', ')}.`);
    const lowAcc = rows.filter((r) => r.acc !== null && r.acc < 0.6).map((r) => `${r.s.short} (%${Math.round(r.acc * 100)})`);
    if (lowAcc.length) insights.push(`Soru başarısı %60’ın altında: ${lowAcc.join(', ')} — konu tekrarı + yanlış analizi öneririm.`);
    const best = rows.filter((r) => r.acc !== null).sort((a, b) => b.acc - a.acc)[0];
    if (best) insights.push(`En güçlü olduğun ders: ${best.s.short} (%${Math.round(best.acc * 100)} doğru).`);
    const dl = daysLeft(); const remainingTopics = ex.reduce((a, s) => a + s.topics.filter((t) => t.status < 2).length, 0);
    if (dl > 0 && remainingTopics) insights.push(`Bitmemiş ${remainingTopics} konu var; sınava ${dl} gün kaldı → haftada ~${Math.ceil(remainingTopics / Math.max(1, (dl - 45) / 7))} konu bitirmen gerekiyor (son 45 gün tekrar için ayrıldı).`);

    return `
    <div class="stats-row">
      <div class="stat card"><small>Toplam çalışma</small><b>${Math.round(totalMin / 60)}</b><span>saat</span></div>
      <div class="stat card"><small>Çözülen soru</small><b>${totalQ}</b><span>soru</span></div>
      <div class="stat card"><small>Doğru oranı</small><b>${totalC + totalW ? '%' + Math.round(100 * totalC / (totalC + totalW)) : '—'}</b><span>genel</span></div>
      <div class="stat card"><small>Deneme</small><b>${S.exams.length}</b><span>adet</span></div>
    </div>
    <section class="card">
      <div class="card-h"><h3>Haftalık rapor</h3><button class="btn sm" data-act="weekly">📝 Haftalık değerlendirme</button></div>
      <ul class="insights">${insights.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>
    </section>
    ${(S.reviews || []).length ? `<section class="card"><div class="card-h"><h3>Değerlendirme geçmişi</h3></div><ul class="journal">${[...S.reviews].reverse().slice(0, 6).map((r) => `<li><small class="muted">${fmtDate(parseD(r.date))} · enerji ${'●'.repeat(r.energy)}${'○'.repeat(5 - r.energy)}</small>${r.good ? `<p>✅ ${esc(r.good)}</p>` : ''}${r.hard ? `<p>⚠️ ${esc(r.hard)}</p>` : ''}${r.next ? `<p>🎯 ${esc(r.next)}</p>` : ''}</li>`).join('')}</ul></section>` : ''}
    <section class="card">
      <div class="card-h"><h3>Gün değerlendirmeleri</h3><span class="muted small">5 yıldız üzerinden</span></div>
      <div class="week-stars">${[6, 5, 4, 3, 2, 1, 0].map((i) => { const d = addDays(new Date(), -i); const k = dkey(d); const r = (S.dayRatings || {})[k];
        return `<div><small class="muted">${DAYS_S[dow(d)]}</small><span class="ws">${r ? '★'.repeat(r.stars) + '<i>' + '★'.repeat(5 - r.stars) + '</i>' : '<i>—</i>'}</span></div>`; }).join('')}</div>
    </section>
    <section class="card">
      <div class="card-h"><h3>Son 14 gün</h3><span class="legend"><span><i style="background:var(--accent)"></i>çalışılan</span><span><i class="goal-i"></i>hedef</span></span></div>
      ${barsHTML(bars)}
    </section>
    <section class="card">
      <div class="card-h"><h3>Ders bazında (son 30 gün)</h3></div>
      <div class="table-wrap"><table class="subj-table"><thead><tr><th>Ders</th><th>Süre</th><th>Pay / ideal</th><th>Konu</th><th>Doğru %</th><th>Öncelik</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td><span class="dot" style="background:${r.s.color}"></span>${esc(r.s.short)}</td><td>${fmtMin(r.m)}</td>
        <td><span class="${r.share < r.ideal * 0.6 && examMin ? 'neg' : ''}">%${Math.round(r.share * 100)}</span> <small class="muted">/ %${Math.round(r.ideal * 100)}</small></td>
        <td>%${Math.round(r.prog * 100)}</td><td>${r.acc === null ? '—' : '%' + Math.round(r.acc * 100)}</td>
        <td>${progressBar(r.w, r.w > 0.6 ? 'var(--bad)' : r.w > 0.4 ? 'var(--warn)' : 'var(--good)')}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="muted small">Öncelik çubuğu konu ilerlemen ve doğru oranından hesaplanır; uzun çubuk = programda daha çok blok.</p>
    </section>`;
  }

  function weeklyReview() {
    openModal(`<h3>Haftalık değerlendirme</h3>
      <p class="muted small">Dürüst ol, kimse görmüyor. Cevaplarına göre programını ayarlayacağım.</p>
      <label>Bu hafta neler iyi gitti?<textarea name="good" rows="2"></textarea></label>
      <label>Nerede zorlandın / neden aksadı?<textarea name="hard" rows="2"></textarea></label>
      <label>Gelecek haftanın tek ana hedefi<input name="next" placeholder="Ör. Ölçme-değerlendirmeyi bitirmek"></label>
      <label>Enerji / motivasyon (1-5)<input type="range" name="energy" min="1" max="5" value="3"></label>
      <label>Program yoğunluğu nasıldı?<select name="load"><option value="ok">Tam kararında</option><option value="heavy">Fazla ağırdı</option><option value="light">Daha fazlasını yapabilirim</option></select></label>
      <div class="btn-row end"><button class="btn ghost" value="cancel" formnovalidate>Vazgeç</button><button class="btn" value="ok">Kaydet</button></div>`,
    (v, f) => {
      S.reviews = S.reviews || [];
      S.reviews.push({ date: dkey(), good: f.good, hard: f.hard, next: f.next, energy: Number(f.energy) || 3, load: f.load });
      S.lastWeekly = dkey(); award(10, 'Haftalık değerlendirme');
      let msg = 'Değerlendirme kaydedildi.';
      if (f.load === 'heavy') { S.profile.hours = S.profile.hours.map((h) => Math.max(0, Math.round((h * 0.85) * 2) / 2)); msg = 'Günlük saatleri ~%15 azalttım; sürdürülebilirlik her şeyden önemli.'; }
      if (f.load === 'light') { S.profile.hours = S.profile.hours.map((h) => Math.min(14, h + 0.5)); msg = 'Her güne 30 dk ekledim. Zorlarsa geri alırız.'; }
      if (f.next) S.tasks.push({ id: uid(), title: '🎯 Haftanın hedefi: ' + f.next, type: 'diger', due: dkey(addDays(new Date(), 7)), done: false });
      if (Number(f.energy) <= 2) msg += ' Enerjin düşük: uykuya ve molalara dikkat et, gerekirse bir gün tamamen dinlen.';
      generatePlan(); save(); render(); toast(msg, 6000);
    });
  }

  function vGuide() {
    const ph = phase(); const dl = daysLeft();
    const card = (h, items) => `<section class="card guide"><h3>${h}</h3><ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul></section>`;
    return `
    <section class="card hero-guide"><p class="eyebrow">Şu an: ${ph.name} dönemi${dl >= 0 ? ` · ${dl} gün` : ''}</p><h2>Yol haritan</h2>
      <ol class="phases">
        <li class="${ph.id === 1 ? 'on' : ''}"><b>1. Temel kurulum</b><span>Sınava 150+ gün: tüm konuları bir kez bitir. Her konudan sonra 15-20 soru. Ayda 1 deneme ile seviyeni gör.</span></li>
        <li class="${ph.id === 2 ? 'on' : ''}"><b>2. Pekiştirme</b><span>150-60 gün: konu + soru dengesi, haftada 1 deneme, yanlış defteri ve aralıklı tekrar.</span></li>
        <li class="${ph.id === 3 ? 'on' : ''}"><b>3. Son düzlük</b><span>Son 60 gün: haftada 2 deneme, çıkmış sorular, sadece eksik konular. Son hafta yeni konu yok, sadece tekrar ve uyku düzeni.</span></li>
      </ol></section>
    <div class="two-col">
      ${card('Etkili çalışma yöntemleri', [
        '<b>Aktif hatırlama:</b> Okuduktan sonra kitabı kapat, aklında kalanları boş kâğıda yaz. Tekrar okumaktan 2-3 kat etkili.',
        '<b>Aralıklı tekrar:</b> Bir konuyu “Bitti” işaretlediğinde uygulama 1-3-7-14-30 gün sonra tekrar ettirir. “Bugün” ekranındaki tekrarları atlama.',
        '<b>Yanlış defteri:</b> Her yanlışın için: soru tipi + neden yanlış (bilgi eksiği / dikkat / süre) + doğru bilgi. Denemeden önce sadece bu defteri oku.',
        '<b>Feynman tekniği:</b> Bir konuyu (ör. Piaget’nin evreleri) 12 yaşındaki birine anlatır gibi sesli anlat. Takıldığın yer = eksiğin.',
        '<b>Pomodoro:</b> 50 dk odak + 10 dk mola. Telefon başka odada; molada ekrana değil, yürümeye/suya.',
        '<b>Zor olan önce:</b> Günün en dinç saatine en zayıf dersini koy.'])}
      ${card('AGS stratejisi', [
        '<b>Eğitimin Temelleri</b> en yüksek ağırlıklı test — puanının belkemiği. Gelişim, öğrenme psikolojisi ve ölçme-değerlendirmeye öncelik ver.',
        '<b>Sözel / Sayısal yetenek</b> ezberle değil, her gün düzenli soruyla gelişir: her gün 10 paragraf + 10 problem rutini kur.',
        '<b>Mevzuat:</b> Kanunların amaç, kapsam, görev-yetki maddelerine odaklan; madde numarası değil içerik sorulur. Kısa kart notları çıkar.',
        '<b>Tarih / Coğrafya:</b> Kronoloji çizelgesi ve harita üzerinde çalış; görsel hafıza ile kalıcılık artar.',
        '<b>Deneme sonrası:</b> Denemeyi çözdüğün kadar analizine de zaman ayır (en az 1 saat). Sonuçları buraya gir — program kendini ayarlar.'])}
      ${card('ÖABT — Din Kültürü ve Ahlak Bilgisi', [
        '<b>Temel İslam Bilimleri</b> (Tefsir, Hadis, Fıkıh, Kelam, Siyer) ÖABT’nin çoğunluğu. Her bilim dalı için “kavram – şahsiyet – eser” üçlü tablosu hazırla.',
        '<b>Usul terimleri</b> (nesih, mütevatir, icmâ, kıyas, istihsan…) karıştırılır: benzer kavramları yan yana karşılaştırmalı tabloyla çalış.',
        '<b>Mezhepler ve Kelam:</b> Mezhep → kurucu → temel görüş → eser tablosu en çok soru getiren kısımdır.',
        '<b>Din bilimleri:</b> Din psikolojisi/sosyolojisi kuramcıları ve kuramları eşleştir (James, Freud, Allport, Durkheim, Weber…).',
        '<b>Alan Eğitimi:</b> DKAB öğretim programının yaklaşımı, öğrenme alanları ve yöntemler — yüksek lisans dersinle örtüşür, avantajını kullan.'])}
      ${card('Yüksek lisans ve tez', [
        '<b>Her gün az ama düzenli:</b> Tez için günde 25-50 dk bile, haftada bir gün 5 saatten verimlidir.',
        '<b>Okurken not sistemi:</b> Her kaynak için kısa özet + kullanacağın alıntı + sayfa no. Zotero/Mendeley gibi bir kaynak yöneticisi kullan.',
        '<b>Çift kazanç:</b> Tez literatürünü din eğitimi kuramlarıyla kurarsan ÖABT Alan Eğitimi’ne de çalışmış olursun.',
        '<b>Danışman takvimi:</b> Her görüşmeden sonra çıkan işleri “Yüksek Lisans” sekmesine teslim tarihiyle gir.',
        '<b>Teslim haftaları:</b> Ayarlar’dan yüksek lisans payını geçici olarak %50’ye çıkar, sonra geri al.'])}
      ${card('Motivasyon ve sağlık', [
        'Seriyi kırmamak için en kötü günde bile <b>25 dakika</b> yeter. Sıfır gün olmasın.',
        'Uyku 7-8 saat. Sınava son ay uyanma saatini sınav saatine (sabah) göre ayarla.',
        'Haftada en az yarım gün tamamen dinlen — tükenmişlik en büyük düşman.',
        'Kendini başkalarıyla değil, geçen haftaki kendinle kıyasla. “Analiz” sekmesi tam bunun için.',
        'Her pazar 5 dakikalık haftalık değerlendirmeyi yap; program buna göre hafifler veya artar.'])}
      ${card('Uygulamayı en iyi nasıl kullanırsın?', [
        'Sabah bildirimi gelince günün planına bak; her blokta ▶ ile sayacı başlat.',
        'Blok bitince doğru/yanlış sayılarını gir — analiz ve program bunlardan beslenir.',
        'Bitirdiğin konuları “Konular”da ✓ işaretle; tekrarları koç sana hatırlatacak.',
        'Programı takvime aktar (📅): telefon kapalı olsa bile alarm çalar.',
        'Haftada bir yedek indir; bilgisayar ve telefon arasında yedekle taşı.'])}
    </div>
    <p class="muted small center">Soru sayıları ve sınav tarihi için her zaman ÖSYM’nin güncel kılavuzunu esas al.</p>`;
  }

  // --------------------------------------------------------------- settings
  function vSettings() {
    const P = S.profile; const R = S.reminders;
    const perm = isNative ? (S.reminders.enabled ? 'granted' : 'default') : 'Notification' in window ? Notification.permission : 'unsupported';
    return `
    <form class="card" data-form="profile">
      <div class="card-h"><h3>Profil ve hedef</h3></div>
      <div class="field-row"><label>Adın<input name="name" value="${esc(P.name)}"></label>
      <label>AGS tarihi<input type="date" name="agsDate" value="${P.agsDate}" required></label></div>
      <label>ÖABT tarihi<input type="date" name="oabtDate" value="${P.oabtDate || ''}"></label>
      <p class="muted small">ÖSYM 2027 takvimi: AGS 8 Mayıs 2027, ÖABT 9 Mayıs 2027, başvuru 19-29 Mart 2027. Değişiklik olursa buradan güncelle.</p>
      <h4>Günlük çalışma saatlerin</h4>
      <div class="hours">${DAYS_S.map((d, i) => `<label>${d}<input type="number" step="0.5" min="0" max="14" name="h${i}" value="${P.hours[i]}"></label>`).join('')}</div>
      <div class="field-row three">
        <label>Hafta içi başlangıç<input type="time" name="startTime" value="${P.startTime}"></label>
        <label>Hafta sonu başlangıç<input type="time" name="weekendStart" value="${P.weekendStart}"></label>
        <label>Yüksek lisans payı (%)<input type="number" min="0" max="80" name="ylShare" value="${P.ylShare}"></label>
      </div>
      <div class="field-row"><label>Blok süresi (dk)<input type="number" min="20" max="120" name="block" value="${P.block}"></label>
      <label>Mola (dk)<input type="number" min="0" max="30" name="brk" value="${P.brk}"></label></div>
      <div class="btn-row end"><button class="btn">Kaydet ve programı güncelle</button></div>
    </form>

    <form class="card" data-form="reminders">
      <div class="card-h"><h3>Hatırlatıcılar</h3><span class="chip">${{ granted: 'izin verildi', denied: 'engellendi', default: 'izin bekleniyor', unsupported: 'desteklenmiyor' }[perm]}</span></div>
      <label class="switch"><input type="checkbox" name="enabled" ${R.enabled ? 'checked' : ''}> Bildirimleri aç</label>
      <div class="field-row"><label>Sabah planı<input type="time" name="morning" value="${R.morning}"></label>
      <label>Akşam kontrolü<input type="time" name="evening" value="${R.evening}"></label></div>
      <label class="switch"><input type="checkbox" name="blocks" ${R.blocks ? 'checked' : ''}> Her blok başlarken haber ver</label>
      <label class="switch"><input type="checkbox" name="sfx" ${S.profile.sfx !== false ? 'checked' : ''}> Ses efektleri (kişneme, tükürme…)</label>
      <div class="btn-row end"><button type="button" class="btn ghost" data-act="testNotif">Test bildirimi</button><button class="btn">Kaydet</button></div>
      ${isNative ? `<div class="note">Bildirimler telefonunun kendi alarm sistemiyle kurulur: uygulama kapalıyken de gelir. Gelmezse telefon Ayarları → Uygulamalar → Hedef AGS → Bildirimler’i aç ve pil tasarrufu kısıtlamasını kaldır.</div>` : `<div class="note">
        <b>Önemli:</b> Tarayıcı bildirimleri uygulama açıkken ya da arka planda çalışırken gelir. Telefonun kapalıyken bile
        <b>kesin</b> hatırlatma almak için <button type="button" class="link-btn" data-act="ics">programını takvime aktar (.ics)</button> —
        her blok için 10 dk önce ve her akşam kontrol alarmı telefonunun kendi takviminde çalar.
        ${perm === 'denied' ? '<br>Bildirimler engellenmiş: tarayıcı ayarlarından bu site için izin ver.' : ''}
        ${/iPhone|iPad/.test(navigator.userAgent) && !window.navigator.standalone ? '<br>iPhone’da bildirim için önce Paylaş → “Ana Ekrana Ekle” ile uygulamayı kur.' : ''}
      </div>`}
    </form>

    ${isNative ? nativeSettingsHTML() : ''}
    <form class="card" data-form="weights">
      <div class="card-h"><h3>Ders ağırlıkları (soru sayısı)</h3></div>
      <p class="muted small">Varsayılanlar tahminidir. ÖSYM’nin güncel AGS / ÖABT kılavuzundaki soru dağılımına göre düzenle.</p>
      <div class="weights">${examSubjects().map((s) => `<label><span><span class="dot" style="background:${s.color}"></span>${esc(s.name)}</span><input type="number" min="0" max="80" name="w_${s.id}" value="${s.weight}"></label>`).join('')}</div>
      <div class="btn-row end"><button class="btn">Kaydet</button></div>
    </form>

    <section class="card">
      <div class="card-h"><h3>Veriler ve eşitleme</h3><span class="chip" id="sync-chip"></span></div>
      <p class="muted small">${cloud ? 'Verilerin hesabına kaydediliyor: aynı bağlantıyı telefonda ve bilgisayarda açtığında hepsi kendiliğinden eşitlenir. Yine de ayda bir yedek indirmeni öneririm.' : 'Veriler bu cihazda saklanır. Diğer cihaza geçmek için yedeği indir, öbür cihazda “Yedeği yükle” de.'}</p>
      <div class="btn-row"><button class="btn" data-act="export">⬇ Yedeği indir</button>
      <label class="btn ghost file-btn">⬆ Yedeği yükle<input type="file" accept="application/json,.json" id="import-file" hidden></label>
      <button class="btn ghost danger" data-act="reset">Sıfırla</button></div>
    </section>
    <p class="muted small center">Hedef AGS · çevrimdışı çalışır · v1.0</p>`;
  }

  function nativeSettingsHTML() {
    const g = S.guard;
    return `
    <section class="card">
      <div class="card-h"><h3>Ana ekran widget’ları</h3><span class="chip" id="st-widget">…</span></div>
      <p class="muted small">Üç farklı widget var; istediğini ana ekranına ekle:</p>
      <div class="widget-list">
        <div><b>🐴 ${esc(S.mascotName || 'Rüzgar')}</b><small class="muted">Ruh hâli değişen maskot, ilerleme, günün sözü</small><button type="button" class="btn sm" data-act="pinWidget" data-kind="mascot">Ekle</button></div>
        <div><b>📅 Ders programı</b><small class="muted">Şu an ne çalışman gerektiği ve günün sıradaki blokları</small><button type="button" class="btn sm" data-act="pinWidget" data-kind="schedule">Ekle</button></div>
        <div><b>⏳ Geri sayım</b><small class="muted">Küçük boy: AGS’ye kalan gün, bugünkü süre, seri ve havuç</small><button type="button" class="btn sm" data-act="pinWidget" data-kind="countdown">Ekle</button></div>
      </div>
      <p class="muted small">Buton çalışmazsa: ana ekranda boş bir yere basılı tut → Widget’lar → Hedef AGS.</p>
    </section>

    <section class="card">
      <div class="card-h"><h3>Alarm ve takvim</h3></div>
      <p class="muted small">Telefonunun Saat uygulamasına gerçek alarm kurar; program bloklarını ve sınav tarihlerini hatırlatmalarıyla telefon takvimine yazar.</p>
      <div class="btn-row">
        <button type="button" class="btn" data-act="phoneAlarms">⏰ Alarmları kur</button>
        <button type="button" class="btn" data-act="phoneCalendar">📅 Takvime ekle</button>
        <button type="button" class="btn ghost" data-act="phoneCalendarRemove">Takvimden kaldır</button>
      </div>
      <p class="muted small">Alarm saatleri: sabah planı (${esc(S.reminders.morning)}), hafta içi başlangıç (${esc(S.profile.startTime)}), hafta sonu başlangıç (${esc(S.profile.weekendStart)}). Program değişince takvime yeniden ekle; eskileri kendiliğinden silinir.</p>
    </section>

    <form class="card" data-form="guard">
      <div class="card-h"><h3>Odak bekçisi</h3><span class="chip" id="st-guard">…</span></div>
      <p class="muted small">Çalışma saatinde aşağıdaki uygulamalardan birini açarsan ekranı kaplayan bir uyarı çıkar. Bloğun başladığı hâlde sayaç çalışmıyorsa da seni uyarır.</p>
      <label class="switch"><input type="checkbox" name="enabled" ${g.enabled ? 'checked' : ''}> Odak bekçisini aç</label>
      <div class="field-row">
        <label>Ne zaman?<select name="mode">
          <option value="blocks" ${g.mode !== 'goal' ? 'selected' : ''}>Sadece çalışma bloklarında</option>
          <option value="goal" ${g.mode === 'goal' ? 'selected' : ''}>Günlük hedef tamamlanana kadar</option></select></label>
        <label>Blok başlayınca bekleme (dk)<input type="number" name="graceMin" min="1" max="60" value="${Number(g.graceMin) || 10}"></label>
      </div>
      <h4>İzlenecek uygulamalar</h4>
      <div class="apps">${GUARD_APPS.map(([pkg, n]) => `<label class="switch"><input type="checkbox" name="app:${pkg}" ${g.apps.includes(pkg) ? 'checked' : ''}> ${n}</label>`).join('')}</div>
      <div class="strict">
        <label class="switch"><input type="checkbox" name="strict" ${g.strict ? 'checked' : ''}> <b>Sıkı mod</b></label>
        <p class="muted small">Açıkken uyarıda “izin ver” düğmesi olmaz: uyarıya rağmen ${15} saniye içinde çıkmazsan o uygulamayı kapatır ve seni çalışma ekranına getirir. Blok başladığı hâlde ${Number(g.graceMin) || 10}+10 dakika çalışmazsan uygulamayı kendisi açar. İstediğin an buradan kapatabilirsin.</p>
      </div>
      <div class="media-box">
        <label class="switch"><input type="checkbox" name="mediaEnabled" ${g.media && g.media.enabled ? 'checked' : ''}> <b>🎬 YouTube’da ders videolarına izin ver</b></label>
        <p class="muted small">Açıkken YouTube’da çalan videonun <b>kanalına</b> ve <b>başlığına</b> bakılır. Video aşağıdaki kanallardan birindeyse ya da başlığında anahtar kelimelerden biri geçiyorsa uyarı gelmez. Ders videosu ararken 60 saniye serbest gezinebilirsin. Video adı yalnızca bu cihazda kontrol edilir, hiçbir yere gönderilmez.</p>
        <label>Ders kanallarım <small class="muted">(her satıra bir kanal adı, YouTube’da göründüğü gibi)</small>
          <textarea name="channels" rows="4" placeholder="Örneğin:&#10;Kanal adı 1&#10;Kanal adı 2">${esc(((g.media && g.media.channels) || []).join('\n'))}</textarea></label>
        <label>Başlıkta aranacak anahtar kelimeler <small class="muted">(virgülle ayır)</small>
          <textarea name="keywords" rows="4">${esc(lessonKeywords().join(', '))}</textarea></label>
        <button type="button" class="btn sm ghost" data-act="resetKeywords">Varsayılan kelimelere dön</button>
        <div id="last-media" class="last-media" hidden>
          <small class="muted">Son algılanan video</small>
          <b class="lm-title"></b>
          <span><span class="lm-ch muted"></span> · <span class="lm-verdict"></span></span>
          <button type="button" class="btn sm" data-act="addChannel" data-ch="">Bu kanalı ders kanallarıma ekle</button>
        </div>
      </div>
      <h4>Gerekli izinler</h4>
      <div class="perm-row"><span>Bildirim erişimi <small class="muted">(YouTube’da çalan videonun adını görmek için; sadece ders videosu kontrolü açıksa gerekir)</small></span><span class="chip" id="st-media">…</span><button type="button" class="btn sm" data-act="permMedia">Ver</button></div>
      <div class="perm-row"><span>Kullanım erişimi <small class="muted">(hangi uygulamanın açık olduğunu görmek için)</small></span><span class="chip" id="st-usage">…</span><button type="button" class="btn sm" data-act="permUsage">Ver</button></div>
      <div class="perm-row"><span>Diğer uygulamaların üzerinde göster <small class="muted">(tam ekran uyarı için)</small></span><span class="chip" id="st-overlay">…</span><button type="button" class="btn sm" data-act="permOverlay">Ver</button></div>
      <div class="perm-row"><span>Pil kısıtlamasını kaldır <small class="muted">(bekçi kapanmasın)</small></span><span></span><button type="button" class="btn sm ghost" data-act="permBattery">Ayarla</button></div>
      <div class="btn-row end"><button class="btn">Kaydet</button></div>
    </form>`;
  }

  // -------------------------------------------------------------- ahır 🐴
  let shopCat = 'head';
  function vShop() {
    const M = window.Mascot; if (!M) return '<p class="muted">Maskot yüklenemedi.</p>';
    const look = mascotLook(); const today = new Date();
    const md = M.mood({ todayMin: minutesOn(dkey(today)), goal: goalOn(today), yesterdayMin: minutesOn(dkey(addDays(today, -1))), hour: today.getHours() });
    const owned = new Set(S.owned || []);
    const list = M.ITEMS.filter((i) => i.cat === shopCat).sort((a, b) => a.price - b.price);
    const isOn = (i) => look[i.cat] === i.id;
    const log = (S.coinLog || []).slice(0, 6);
    return `
    <section class="card shop-hero">
      <div class="stage">${M.svg(md, 260, 'stage', look)}</div>
      <div class="shop-info">
        <form data-form="mascot" class="name-row"><input id="mascot-name" name="name" value="${esc(S.mascotName || 'Rüzgar')}" maxlength="18" aria-label="Maskotun adı"><button class="btn sm ghost">Adını kaydet</button></form>
        <p class="bubble-l">${esc(M.line(md))}</p>
        <div class="wallet"><span class="coin-big">🥕 ${S.coins || 0}</span><small class="muted">havuç · toplam kazanılan ${S.earned || 0}</small></div>
        <ul class="earn">
          <li><b>1 🥕</b> her 5 dk çalışma</li><li><b>+5</b> planlı blok</li><li><b>+20</b> günlük hedef (+seri bonusu)</li>
          <li><b>+15</b> deneme girme</li><li><b>+3</b> konu bitirme</li><li><b>+2</b> tekrar</li><li><b>+10</b> haftalık değerlendirme</li>
        </ul>
      </div>
    </section>
    <section class="card">
      <div class="cat-tabs">${Object.entries(M.CATS).map(([k, n]) => `<button class="${k === shopCat ? 'active' : ''}" data-act="shopCat" data-c="${k}">${n}</button>`).join('')}</div>
      <div class="items">${list.map((i) => {
        const prev = { ...look, [i.cat]: i.id };
        const can = (S.coins || 0) >= i.price;
        return `<div class="item ${isOn(i) ? 'on' : ''} ${owned.has(i.id) ? 'owned' : ''}">
          <div class="item-pic">${M.svg('happy', 132, 'it' + i.id, prev)}</div>
          <b>${esc(i.name)}</b>
          ${owned.has(i.id)
            ? `<button class="btn sm ${isOn(i) ? 'ghost' : ''}" data-act="equip" data-id="${i.id}">${isOn(i) ? 'Çıkar' : 'Giy'}</button>`
            : `<button class="btn sm" data-act="buy" data-id="${i.id}" ${can ? '' : 'disabled'}>${can ? `Al · ${i.price} 🥕` : `${i.price} 🥕 · ${i.price - (S.coins || 0)} eksik`}</button>`}
        </div>`;
      }).join('')}</div>
      ${shopCat === 'coat' || shopCat === 'mane' ? '<p class="muted small">Varsayılan: kestane at, koyu yele. Giydiğini çıkarınca varsayılana döner.</p>' : ''}
    </section>
    ${log.length ? `<section class="card"><div class="card-h"><h3>Son kazançlar</h3></div><ul class="coinlog">${log.map((x) => `<li><span>${esc(x.why)}</span><small class="muted">${fmtDate(parseD(x.d))}</small><b>+${x.n} 🥕</b></li>`).join('')}</ul></section>` : ''}`;
  }

  // ------------------------------------------------------------------ modal
  let modalHandler = null;
  let modalCancel = null;
  function openModal(html, onClose, onInput, onCancel) {
    const dlg = $('#modal'); $('#modal-body').innerHTML = html; modalHandler = onClose; modalCancel = onCancel || null;
    dlg._onInput = onInput || null;
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }
  $('#modal-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = e.submitter?.value || 'ok';
    const data = Object.fromEntries(new FormData(e.target).entries());
    const dlg = $('#modal');
    if (v === 'ok' && !e.target.reportValidity()) return;
    dlg.close();
    const h = modalHandler; const c = modalCancel; modalHandler = null; modalCancel = null; modalIsOnboarding = false;
    if (h && v !== 'cancel') h(v, data); else if (c) c();
  });
  $('#modal').addEventListener('cancel', () => { const c = modalCancel; modalHandler = null; modalCancel = null; if (c) c(); });
  $('#modal-form').addEventListener('change', (e) => {
    if (e.target.id === 'm-subject') $('#m-topic').innerHTML = topicOptions(e.target.value);
    const dlg = $('#modal'); if (dlg._onInput) dlg._onInput(e);
  });

  function ask(msg, yes = 'Evet') {
    return new Promise((res) => openModal(`<h3>Emin misin?</h3><p>${esc(msg)}</p>
      <div class="btn-row end"><button class="btn ghost" value="cancel" formnovalidate>Vazgeç</button><button class="btn danger-solid" value="ok">${esc(yes)}</button></div>`,
      () => res(true), null, () => res(false)));
  }
  let modalIsOnboarding = false;
  function onboarding() {
    modalIsOnboarding = true;
    openModal(`
      <h3>Hoş geldin 👋</h3>
      <p class="muted">Ben senin çalışma koçunum. AGS + ÖABT (Din Kültürü) ve yüksek lisansın için haftalık program hazırlayacağım, çalışmanı takip edip analiz çıkaracağım ve sana hatırlatacağım. Birkaç bilgi yeter:</p>
      <label>Adın<input name="name" placeholder="Adın" autocomplete="given-name"></label>
      <label>AGS tarihi<input type="date" name="agsDate" value="${S.profile.agsDate}" required></label>
      <div class="field-row"><label>Hafta içi günlük saat<input type="number" step="0.5" min="0" max="14" name="wd" value="3"></label>
      <label>Hafta sonu günlük saat<input type="number" step="0.5" min="0" max="14" name="we" value="5"></label></div>
      <div class="field-row"><label>Hafta içi başlangıç<input type="time" name="startTime" value="18:00"></label>
      <label>Yüksek lisansa ayrılacak pay (%)<input type="number" min="0" max="80" name="ylShare" value="25"></label></div>
      <div class="btn-row end"><button class="btn" value="ok">Programımı oluştur</button></div>`,
    (v, f) => {
      const P = S.profile; P.name = f.name.trim(); P.agsDate = f.agsDate || P.agsDate;
      const wd = Number(f.wd) || 0, we = Number(f.we) || 0; P.hours = [wd, wd, wd, wd, wd, we, we];
      P.startTime = f.startTime || P.startTime; P.ylShare = clamp(Number(f.ylShare) || 0, 0, 80); P.onboarded = true; if (!S.firstDay) S.firstDay = dkey();
      generatePlan(); save(); render(); toast('Programın hazır! 🎯'); setTimeout(welcomeGift, 2600);
    });
  }

  // ---------------------------------------------------------- notifications
  let swReg = null;
  async function notify(title, body, tag) {
    toast(`${title} — ${body}`, 6000);
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const opts = { body, tag: tag || title, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', vibrate: [150, 80, 150] };
    try { if (swReg) await swReg.showNotification(title, opts); else new Notification(title, opts); } catch (e) { try { new Notification(title, opts); } catch (_) { /* yok */ } }
  }
  function checkReminders() {
    const R = S.reminders; if (!R.enabled || isNative) return; // APK'da telefonun alarmları kullanılır
    const now = new Date(); const k = dkey(now); const m = now.getHours() * 60 + now.getMinutes();
    const fire = (id, t, b) => { const key = `${k}|${id}`; if (R.fired[key]) return; R.fired[key] = 1; save(); notify(t, b, id); };
    const blocks = blocksFor(now);
    if (m >= toMin(R.morning) && m < toMin(R.morning) + 90) {
      const first = blocks[0];
      fire('morning', 'Bugünkü planın hazır ☀️', blocks.length ? `${blocks.length} blok, toplam ${fmtMin(goalOn(now))}. İlk blok ${first.start}: ${subjName(first.subjectId)}.` : 'Bugün dinlenme günü. Kısa bir tekrar yine de iyi gelir.');
    }
    if (m >= toMin(R.evening) && m < toMin(R.evening) + 90) {
      const done = minutesOn(k); const g = goalOn(now);
      if (g && done < g) fire('evening', 'Gün sonu kontrolü 🌙', `Bugün ${fmtMin(done)} / ${fmtMin(g)}. ${done === 0 ? 'Seriyi kaybetmemek için 25 dakikalık bir blok yap.' : 'Bir blok daha yapabilir misin?'}`);
      else if (g) fire('evening', 'Harika gün! ✅', `Bugün ${fmtMin(done)} çalıştın, hedef tamam.`);
    }
    if (R.blocks) for (const b of blocks) {
      const st = toMin(b.start);
      if (m >= st - 5 && m <= st + 5 && !isDone(now, b)) fire('b' + b.id, `${b.start} — ${subjName(b.subjectId)}`, `${KIND[b.kind] || ''} · ${b.minutes} dk. Sayacı başlatmak için uygulamayı aç.`);
    }
    // eski kayıtları temizle
    for (const key of Object.keys(R.fired)) if (key.slice(0, 10) < dkey(addDays(now, -3))) delete R.fired[key];
  }

  // -------------------------------------------------------------------- ics
  function icsExport() {
    if (!S.plan.blocks.length) return toast('Önce program oluştur.');
    const today = new Date(); const monday = addDays(today, -dow(today));
    const until = parseD(S.profile.agsDate);
    const fmt = (d, mins) => { const x = new Date(d); x.setHours(0, mins, 0, 0); return `${x.getFullYear()}${pad(x.getMonth() + 1)}${pad(x.getDate())}T${pad(x.getHours())}${pad(x.getMinutes())}00`; };
    const untilS = `${until.getFullYear()}${pad(until.getMonth() + 1)}${pad(until.getDate())}T235900`;
    const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Hedef AGS//TR', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Hedef AGS Çalışma Programı'];
    for (const b of S.plan.blocks) {
      const d = addDays(monday, b.dow); const st = toMin(b.start);
      lines.push('BEGIN:VEVENT', `UID:${b.id}@hedefags`, `DTSTAMP:${stamp}`, `DTSTART:${fmt(d, st)}`, `DTEND:${fmt(d, st + b.minutes)}`,
        `RRULE:FREQ=WEEKLY;UNTIL=${untilS}`, `SUMMARY:📚 ${subjName(b.subjectId)} — ${KIND[b.kind] || ''}`,
        'DESCRIPTION:Hedef AGS uygulamasını açıp sayacı başlat.', 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Çalışma zamanı', 'TRIGGER:-PT10M', 'END:VALARM', 'END:VEVENT');
    }
    const ev = toMin(S.reminders.evening);
    lines.push('BEGIN:VEVENT', 'UID:evening@hedefags', `DTSTAMP:${stamp}`, `DTSTART:${fmt(today, ev)}`, `DTEND:${fmt(today, ev + 10)}`, `RRULE:FREQ=DAILY;UNTIL=${untilS}`,
      'SUMMARY:🌙 Gün sonu: çalışmanı Hedef AGS’ye kaydet', 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Gün sonu kontrolü', 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT');
    for (const k of keyDates().filter((x) => x.left >= 0)) {
      const dd = k.d.replace(/-/g, ''); const nx = dkey(addDays(parseD(k.d), 1)).replace(/-/g, '');
      lines.push('BEGIN:VEVENT', `UID:kd-${k.kind}-${dd}@hedefags`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${dd}`, `DTEND;VALUE=DATE:${nx}`,
        `SUMMARY:🎯 ${k.t}`, 'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:Yarın: ${k.t}`, 'TRIGGER:-PT15H', 'END:VALARM', 'END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    download('hedef-ags-program.ics', lines.join('\r\n'), 'text/calendar');
    toast('Takvim dosyası indirildi — açıp takvimine ekle.');
  }
  async function download(name, text, type) {
    if (isNative) { try { if (await nativeShareFile(name, text)) return; } catch (e) { if (!/cancel/i.test(String(e && e.message))) toast('Dosya paylaşılamadı.'); return; } }
    try {
      const dl = window.claude && typeof window.claude.use === 'function' ? await window.claude.use('downloads') : null;
      if (dl) { await dl.save({ filename: name, data: new Blob([text], { type }) }); return; }
    } catch (e) { if (e && e.code && e.code !== 'unavailable') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  // ------------------------------------------------------------------ toast
  let toastT = null;
  function toast(msg, ms = 2800) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms); }

  // ---------------------------------------------------------------- actions
  const A = {
    regen() { generatePlan(); render(); toast('Program güncellendi'); },
    planDay(el) { planDay = Number(el.dataset.i); render(); },
    toggleDone(el) { const k = `${el.dataset.date}|${el.dataset.id}`; if (S.done[k]) delete S.done[k]; else S.done[k] = true; save(); render(); },
    startBlock(el) {
      const b = S.plan.blocks.find((x) => x.id === el.dataset.id); if (!b) return;
      if (S.timer) { toast('Önce çalışan sayacı bitir.'); location.hash = '#study'; return; }
      if (b.subjectId === 'deneme') { location.hash = '#exams'; toast('Denemeyi kâğıt üzerinde 110 dk süreyle çöz, sonra sonuçlarını buraya gir.'); S.done[`${dkey()}|${b.id}`] = true; save(); return; }
      startTimer(b.subjectId, '', b.minutes, b.id);
      location.hash = '#study'; render();
    },
    editBlock(el) {
      const b = S.plan.blocks.find((x) => x.id === el.dataset.id); if (!b) return;
      openModal(`<h3>Bloğu düzenle</h3>
        <div class="field-row"><label>Gün<select name="dow">${DAYS.map((d, i) => `<option value="${i}" ${i === b.dow ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
        <label>Başlangıç<input type="time" name="start" value="${b.start}" required></label></div>
        <div class="field-row"><label>Ders<select name="subjectId"><option value="deneme" ${b.subjectId === 'deneme' ? 'selected' : ''}>Deneme Sınavı</option>${subjectOptions(b.subjectId)}</select></label>
        <label>Süre (dk)<input type="number" name="minutes" min="10" max="240" value="${b.minutes}"></label></div>
        <label>Tür<select name="kind">${Object.entries(KIND).map(([k, v]) => `<option value="${k}" ${k === b.kind ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <div class="btn-row end"><button class="btn ghost danger" value="delete" formnovalidate>Sil</button><button class="btn ghost" value="cancel" formnovalidate>Vazgeç</button><button class="btn" value="ok">Kaydet</button></div>`,
      (v, f) => {
        if (v === 'delete') S.plan.blocks = S.plan.blocks.filter((x) => x !== b);
        else Object.assign(b, { dow: Number(f.dow), start: f.start, subjectId: f.subjectId, minutes: Number(f.minutes) || b.minutes, kind: f.kind });
        save(); render();
      });
    },
    addBlock() {
      const b = { id: uid(), dow: planDay, start: S.profile.startTime, minutes: Number(S.profile.block) || 50, subjectId: 'egitim', kind: 'konu' };
      S.plan.blocks.push(b); save(); render(); A.editBlock({ dataset: { id: b.id } });
    },
    ics: icsExport,
    tStart() { const sid = $('#t-subject').value; startTimer(sid, $('#t-topic').value, $('#t-target').value, nextBlockToday()?.subjectId === sid ? nextBlockToday().id : null); render(); },
    tPause() { const t = S.timer; t.acc += Date.now() - t.startedAt; t.running = false; save(); render(); },
    tResume() { const t = S.timer; t.startedAt = Date.now(); t.running = true; save(); render(); },
    async tCancel() { if (await ask('Sayaç kaydedilmeden silinsin mi?', 'Sil')) { S.timer = null; save(); render(); } },
    tFinish() {
      const t = S.timer; const mins = Math.max(1, Math.round(timerElapsed() / 60000));
      openModal(sessionForm({ subjectId: t.subjectId, topicId: t.topicId, minutes: mins, date: t.date }), (v, f) => {
        saveSession(f, t.blockId ? { blockId: t.blockId } : {}); S.timer = null; save(); render();
      });
    },
    addSession() { openModal(sessionForm({ subjectId: studySubject || 'egitim' }), (v, f) => { saveSession(f); render(); }); },
    async delSession(el) { if (!(await ask('Bu çalışma kaydı silinsin mi?', 'Sil'))) return; S.sessions = S.sessions.filter((s) => s.id !== el.dataset.id); save(); render(); },
    openSubj(el) { openSubj = openSubj === el.dataset.id ? null : el.dataset.id; render(); },
    topicStatus(el) { const t = subj(el.dataset.s).topics.find((x) => x.id === el.dataset.t); setTopicStatus(t, Number(el.dataset.v)); save(); render(); },
    reviewed(el) { const t = subj(el.dataset.s).topics.find((x) => x.id === el.dataset.t); award(2, 'Tekrar'); t.reviews = (t.reviews || 0) + 1; t.lastReview = dkey(); if (t.reviews >= 3) t.status = 3; save(); render(); toast(t.reviews >= SR.length ? 'Konu kalıcı hafızada ★' : `Tekrar kaydedildi — sonraki: ${SR[t.reviews]} gün sonra`); },
    weekly() { weeklyReview(); },
    cycleTopic(el) { const t = subj(el.dataset.s).topics.find((x) => x.id === el.dataset.t); setTopicStatus(t, (t.status + 1) % 4); save(); render(); },
    addTopic(el) { const inp = $(`#new-topic-${el.dataset.s}`); const n = inp.value.trim(); if (!n) return; subj(el.dataset.s).topics.push({ id: uid(), name: n, status: 0 }); save(); render(); },
    async delTopic(el) { if (!(await ask('Konu silinsin mi?', 'Sil'))) return; const s = subj(el.dataset.s); s.topics = s.topics.filter((t) => t.id !== el.dataset.t); save(); render(); },
    addExam(el) { openModal(examForm(el.dataset.type), (v, f) => { saveExam(f); }); },
    editExam(el) { const e = S.exams.find((x) => x.id === el.dataset.id); openModal(examForm(e.type, e), (v, f) => saveExam(f, e)); },
    async delExam(el) { if (!(await ask('Deneme silinsin mi?', 'Sil'))) return; S.exams = S.exams.filter((x) => x.id !== el.dataset.id); save(); render(); },
    addTask() { openModal(taskForm(), (v, f) => { S.tasks.push({ id: uid(), title: f.title.trim(), type: f.type, due: f.due, done: false }); save(); render(); }); },
    editTask(el) {
      const t = S.tasks.find((x) => x.id === el.dataset.id);
      openModal(taskForm(t), (v, f) => { if (v === 'delete') S.tasks = S.tasks.filter((x) => x !== t); else Object.assign(t, { title: f.title.trim(), type: f.type, due: f.due }); save(); render(); });
    },
    toggleTask(el) { const t = S.tasks.find((x) => x.id === el.dataset.id); t.done = !t.done; save(); render(); if (t.done) toast('Görev tamamlandı ✓'); },
    async testNotif() {
      if (isNative) {
        const LN = plugin('LocalNotifications'); if (!LN) return;
        let perm = await LN.checkPermissions(); if (perm.display !== 'granted') perm = await LN.requestPermissions();
        if (perm.display !== 'granted') return toast('Bildirim izni verilmedi. Telefon Ayarları → Uygulamalar → Hedef AGS → Bildirimler.');
        await LN.schedule({ notifications: [{ id: 2, title: 'Hedef AGS', body: 'Bildirimler çalışıyor 🎉', smallIcon: 'ic_stat_hedef', iconColor: '#0f5c4d', schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true } }] });
        return toast('5 saniye içinde bir test bildirimi gelecek. Uygulamayı kapatıp deneyebilirsin.', 4000);
      }
      if (!('Notification' in window)) return toast('Bu tarayıcı bildirim desteklemiyor. Takvime aktarmayı kullan.');
      const p = await Notification.requestPermission();
      if (p === 'granted') notify('Hedef AGS', 'Bildirimler çalışıyor 🎉'); else toast('Bildirim izni verilmedi.');
      render();
    },
    daySummary(el) { showDaySummary(el.dataset.k); },
    shopCat(el) { shopCat = el.dataset.c; render(); },
    buy(el) {
      const i = window.Mascot.item(el.dataset.id); if (!i) return;
      S.owned = S.owned || [];
      if (S.owned.includes(i.id)) return;
      if ((S.coins || 0) < i.price) return toast(`${i.price - S.coins} havuç daha lazım. Bir blok çalış, kazan! 🥕`);
      S.coins -= i.price; S.owned.push(i.id); S.look = { ...mascotLook(), [i.cat]: i.id };
      save(); render(); renderWidgetMascots(); toast(`${i.name} alındı ve giyildi! ${S.mascotName || 'Rüzgar'} bayıldı 🐴`, 3500);
    },
    equip(el) {
      const i = window.Mascot.item(el.dataset.id); if (!i) return;
      const look = { ...mascotLook() }; if (look[i.cat] === i.id) delete look[i.cat]; else look[i.cat] = i.id;
      S.look = look; save(); render(); renderWidgetMascots();
    },
    async pinWidget(el) { const H = plugin('Hedef'); try { await H.pinWidget({ kind: el.dataset.kind || 'mascot' }); } catch (e) { toast('Ana ekranda boş yere basılı tut → Widget’lar → Hedef AGS', 5000); } },
    phoneAlarms() { setPhoneAlarms(); },
    phoneCalendar() { addToPhoneCalendar(); },
    async phoneCalendarRemove() { const H = plugin('Hedef'); try { await H.removeCalendarEvents(); toast('Hedef AGS etkinlikleri takvimden kaldırıldı'); } catch (e) { /* yok */ } },
    async permUsage() { try { await plugin('Hedef').openUsageSettings(); toast('Listede Hedef AGS’yi bul ve izin ver, sonra geri dön.', 5000); } catch (e) { /* yok */ } },
    async permOverlay() { try { await plugin('Hedef').openOverlaySettings(); } catch (e) { /* yok */ } },
    async permMedia() { try { await plugin('Hedef').openMediaSettings(); toast('Listede Hedef AGS’yi bul ve izin ver, sonra geri dön.', 5000); } catch (e) { /* yok */ } },
    addChannel(el) {
      const ch = el.dataset.ch; if (!ch) return; S.guard.media = S.guard.media || { enabled: true, channels: [] };
      S.guard.media.channels = [...new Set([...(S.guard.media.channels || []), ch])]; save(); render(); toast(`“${ch}” ders kanallarına eklendi ✓`);
    },
    resetKeywords() { S.guard.media = S.guard.media || {}; S.guard.media.keywords = null; save(); render(); toast('Varsayılan anahtar kelimeler geri yüklendi'); },
    async permBattery() { try { await plugin('Hedef').openBatterySettings(); toast('Hedef AGS → Kısıtlama yok / Optimize etme', 5000); } catch (e) { /* yok */ } },
    export() { download(`hedef-ags-yedek-${dkey()}.json`, JSON.stringify(S, null, 1), 'application/json'); toast('Yedek indirildi'); },
    async reset() { if (await ask('TÜM veriler silinecek. Önce yedek almanı öneririm.', 'Hepsini sil')) { S = defaultState(); save(); render(); onboarding(); } }
  };
  function saveExam(f, existing) {
    const res = {};
    for (const [k, v] of Object.entries(f)) {
      const m = k.match(/^([dy])_(.+)$/); if (!m || v === '') continue;
      res[m[2]] = res[m[2]] || { d: 0, y: 0 }; res[m[2]][m[1]] = Number(v) || 0;
    }
    if (existing) Object.assign(existing, { date: f.date, name: f.name, res });
    else { S.exams.push({ id: uid(), date: f.date, name: f.name || `${f.type} denemesi`, type: f.type, res }); award(15, 'Deneme girildi'); }
    generatePlan(); save(); render(); toast('Deneme kaydedildi — program sonuçlarına göre güncellendi');
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const fn = A[el.dataset.act]; if (!fn) return;
    e.preventDefault(); fn(el);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('li[data-act]')) A[e.target.dataset.act](e.target); });
  document.addEventListener('change', (e) => {
    if (e.target.id === 't-subject') { studySubject = e.target.value; $('#t-topic').innerHTML = topicOptions(studySubject); $('#clock').style.setProperty('--c', subjColor(studySubject)); }
    if (e.target.id === 't-target') tickTimer();
    if (e.target.id === 'import-file') importFile(e.target.files[0]);
  });
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('[data-form]'); if (!form) return;
    e.preventDefault();
    const f = Object.fromEntries(new FormData(form).entries());
    const P = S.profile;
    if (form.dataset.form === 'profile') {
      P.name = f.name.trim(); P.agsDate = f.agsDate; P.oabtDate = f.oabtDate || P.oabtDate; P.hours = [0, 1, 2, 3, 4, 5, 6].map((i) => clamp(Number(f['h' + i]) || 0, 0, 14));
      P.startTime = f.startTime; P.weekendStart = f.weekendStart; P.ylShare = clamp(Number(f.ylShare) || 0, 0, 80);
      P.block = clamp(Number(f.block) || 50, 20, 120); P.brk = clamp(Number(f.brk) || 0, 0, 30);
      generatePlan(); toast('Kaydedildi, program güncellendi');
    } else if (form.dataset.form === 'reminders') {
      const R = S.reminders; R.enabled = !!f.enabled; R.morning = f.morning; R.evening = f.evening; R.blocks = !!f.blocks; S.profile.sfx = !!f.sfx;
      if (isNative) scheduleNative(R.enabled).then((r) => { if (r === 'denied' && R.enabled) toast('Bildirim izni verilmedi; telefon ayarlarından izin ver.', 4000); });
      else if (R.enabled && 'Notification' in window && Notification.permission === 'default') Notification.requestPermission().then(render);
      toast(R.enabled ? 'Hatırlatıcılar açık' : 'Hatırlatıcılar kapalı');
    } else if (form.dataset.form === 'mascot') {
      S.mascotName = (f.name || '').trim().slice(0, 18) || 'Rüzgar'; toast(`Maskotunun adı artık ${S.mascotName} 🐴`);
    } else if (form.dataset.form === 'guard') {
      const g = S.guard; g.enabled = !!f.enabled; g.mode = f.mode; g.strict = !!f.strict; g.graceMin = clamp(Number(f.graceMin) || 10, 1, 60);
      g.media = g.media || {};
      g.media.enabled = !!f.mediaEnabled;
      g.media.channels = String(f.channels || '').split('\n').map((x) => x.trim()).filter(Boolean).slice(0, 60);
      const kw = String(f.keywords || '').split(/[,\n]/).map((x) => x.trim()).filter(Boolean).slice(0, 150);
      g.media.keywords = kw.length && !sameList(kw, DEFAULT_LESSON_KEYWORDS) ? kw : null;
      if (g.media.enabled) nativeStatus().then((st) => { if (st && !st.media) toast('Ders videosu kontrolü için “Bildirim erişimi” iznini ver.', 5000); });
      g.apps = GUARD_APPS.map(([pkg]) => pkg).filter((pkg) => f['app:' + pkg]);
      toast(g.enabled ? (g.strict ? 'Odak bekçisi sıkı modda açık 🔒' : 'Odak bekçisi açık') : 'Odak bekçisi kapalı');
      nativeStatus().then((st) => { if (g.enabled && st && !st.usage) toast('Bekçinin çalışması için “Kullanım erişimi” iznini ver.', 5000); });
    } else if (form.dataset.form === 'weights') {
      for (const s of examSubjects()) s.weight = clamp(Number(f['w_' + s.id]) || 0, 0, 80);
      generatePlan(); toast('Ağırlıklar kaydedildi');
    }
    save(); render();
  });
  function importFile(file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        const d = JSON.parse(r.result);
        if (!d || !d.profile || !Array.isArray(d.subjects)) throw new Error('format');
        if (!(await ask('Bu cihazdaki veriler yedektekilerle değiştirilecek.', 'Yükle'))) return;
        S = mergeDefaults(d); save(); render(); toast('Yedek yüklendi ✓');
      } catch (e) { toast('Dosya okunamadı — Hedef AGS yedeği mi?'); }
    };
    r.readAsText(file);
  }

  window.addEventListener('hashchange', () => { const h = location.hash.slice(1); current = VIEWS.find((v) => v.id === h) || h === 'more' ? h : 'today'; render(); window.scrollTo(0, 0); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { try { if (localStorage.getItem(KEY)) S = load(); } catch (e) { /* yok */ } render(); checkReminders(); if (isNative) { nativeSync(); takeLaunchTab(); } } });

  // ------------------------------------------------------------------- boot
  if (!isNative && 'serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').then((r) => { swReg = r; }).catch(() => {});
  }
  if (migrated) { migrated = false; save(); setTimeout(() => toast('Sınav tarihi ÖSYM takvimine göre güncellendi: AGS 8 Mayıs 2027', 5000), 400); }
  if (S.profile.onboarded && !S.plan.blocks.length) generatePlan();
  function welcomeGift() { S.awards = S.awards || {}; if (S.awards.welcome) return; S.awards.welcome = 1; award(30, 'Hoş geldin hediyesi'); save(); }
  if (S.profile.onboarded) setTimeout(welcomeGift, 1200);
  if (S.profile.onboarded && !S.firstDay) { S.firstDay = dkey(); save(); }
  setTimeout(() => { const k = pendingSummary(); if (k && k !== dkey() && !$('#modal').open) showDaySummary(k); }, 2200);
  render();
  if (!S.profile.onboarded) onboarding();
  setInterval(() => { renderTimerChip(); if (current === 'study') tickTimer(); else if (S.timer && S.timer.running && !S.timer.alerted && timerElapsed() >= S.timer.target * 60000) tickTimerBackground(); }, 1000);
  function tickTimerBackground() { S.timer.alerted = true; save(); notify('Blok tamamlandı ⏰', `${subjName(S.timer.subjectId)}: ${S.timer.target} dakika doldu.`, 'timer'); beep(); }
  setInterval(checkReminders, 30000); checkReminders();
  // gün değişince yeniden çiz
  let lastDay = dkey(); setInterval(() => { if (dkey() !== lastDay) { lastDay = dkey(); render(); } }, 60000);

  initCloud();
  if (isNative) { scheduleNative(false); nativeSync(); takeLaunchTab(); setTimeout(() => renderWidgetMascots(), 1500); }
  window.__hedef = { showStrictAngry, get state() { return S; }, generatePlan, coachMessages };
})();
