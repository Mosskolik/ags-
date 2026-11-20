/* Rüzgar — Hedef AGS'nin at maskotu.
 * Ruh hâli bugünkü çalışmana göre değişir; havuçlarla aldığın eşyaları giyer.
 * Aynı çizim Android widget'ında da kullanılır. */
(function () {
  'use strict';

  // ------------------------------------------------------------ renkler
  const COATS = {
    kestane: { body: '#B8744A', shade: '#9C5F3A', muzzle: '#EAC7A1' },
    beyaz: { body: '#F1ECE4', shade: '#D9D1C4', muzzle: '#FBE3D6' },
    kir: { body: '#9AA3A8', shade: '#7F888D', muzzle: '#D9DDE0' },
    siyah: { body: '#3A332F', shade: '#2A2420', muzzle: '#6E6158' },
    altin: { body: '#E2B061', shade: '#C9944A', muzzle: '#F6DDB4' }
  };
  const MANES = { koyu: '#4A2C1D', sari: '#F4D58D', siyah: '#1E1A18', kizil: '#C2410C', mor: '#7C3AED', mavi: '#2563EB' };
  const INK = '#2B211C';

  // ------------------------------------------------------------ eşyalar
  // Her eşya kendi bağlantı noktasına göre (0,0) merkezli çizilir.
  const ANCHOR = { head: [150, 40], face: [157, 66], neck: [126, 114], body: [88, 104] };
  const ITEMS = [
    // şapkalar
    { id: 'kep', cat: 'head', name: 'Mezuniyet kepi', price: 120, svg: '<path d="M-32 -4 L0 -17 L32 -4 L0 9 Z" fill="#1f1f1f"/><path d="M-15 0 v10 q15 7 30 0 v-10" fill="#2b2b2b"/><path d="M0 -4 L24 2 L26 18" stroke="#E0B24F" stroke-width="2.5" fill="none"/><circle cx="26" cy="20" r="4" fill="#E0B24F"/>' },
    { id: 'fes', cat: 'head', name: 'Fes', price: 90, svg: '<path d="M-15 6 L-12 -22 L12 -22 L15 6 Z" fill="#B91C1C"/><ellipse cx="0" cy="-22" rx="12" ry="3" fill="#991B1B"/><path d="M0 -22 q10 6 9 20" stroke="#1f1f1f" stroke-width="2.5" fill="none"/>' },
    { id: 'bere', cat: 'head', name: 'Kışlık bere', price: 60, svg: '<path d="M-21 6 Q-21 -24 0 -24 Q21 -24 21 6 Z" fill="#2563EB"/><path d="M-10 -20 v24 M0 -24 v28 M10 -20 v24" stroke="#1D4ED8" stroke-width="2"/><rect x="-22" y="0" width="44" height="9" rx="4.5" fill="#1E40AF"/><circle cy="-27" r="7" fill="#fff"/>' },
    { id: 'hasir', cat: 'head', name: 'Hasır şapka', price: 80, svg: '<ellipse cx="0" cy="4" rx="34" ry="8" fill="#E7C27A"/><path d="M-17 4 Q-17 -22 0 -22 Q17 -22 17 4 Z" fill="#EBCB8B"/><rect x="-17" y="-4" width="34" height="6" fill="#B91C1C"/>' },
    { id: 'cicek', cat: 'head', name: 'Çiçek tacı', price: 150, svg: '<path d="M-24 6 Q0 -6 24 6" stroke="#4D7C0F" stroke-width="4" fill="none"/><g><circle cx="-20" cy="2" r="6" fill="#F472B6"/><circle cx="-8" cy="-2" r="6" fill="#FDE047"/><circle cx="4" cy="-3" r="6" fill="#F472B6"/><circle cx="16" cy="0" r="6" fill="#A78BFA"/><circle cx="-20" cy="2" r="2" fill="#fff"/><circle cx="-8" cy="-2" r="2" fill="#fff"/><circle cx="4" cy="-3" r="2" fill="#fff"/><circle cx="16" cy="0" r="2" fill="#fff"/></g>' },
    { id: 'tac', cat: 'head', name: 'Altın taç', price: 500, svg: '<path d="M-20 6 L-20 -15 L-10 -4 L0 -20 L10 -4 L20 -15 L20 6 Z" fill="#E0B24F" stroke="#B7862B" stroke-width="1.5" stroke-linejoin="round"/><circle cx="0" cy="-2" r="3.5" fill="#DC2626"/><circle cx="-12" cy="0" r="2.5" fill="#2563EB"/><circle cx="12" cy="0" r="2.5" fill="#16A34A"/>' },
    // gözlükler
    { id: 'gozluk', cat: 'face', name: 'Okuma gözlüğü', price: 50, svg: '<circle r="11" fill="#fff" fill-opacity=".25" stroke="#3B2F2A" stroke-width="3"/><path d="M11 -1 h10 M-11 -2 L-22 -6" stroke="#3B2F2A" stroke-width="3" stroke-linecap="round"/>' },
    { id: 'gunes', cat: 'face', name: 'Güneş gözlüğü', price: 90, svg: '<rect x="-12" y="-9" width="24" height="17" rx="7" fill="#111827"/><path d="M-6 -5 l6 0" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" stroke-linecap="round"/><path d="M12 -2 h10 M-12 -3 L-23 -7" stroke="#111827" stroke-width="3" stroke-linecap="round"/>' },
    { id: 'yildizg', cat: 'face', name: 'Parti gözlüğü', price: 120, svg: '<path d="M0 -14 L4 -5 L14 -4 L6 3 L9 13 L0 7 L-9 13 L-6 3 L-14 -4 L-4 -5 Z" fill="#EC4899" stroke="#BE185D" stroke-width="1.5"/><circle r="5" fill="#fff" fill-opacity=".35"/><path d="M14 -3 h9" stroke="#BE185D" stroke-width="3" stroke-linecap="round"/>' },
    // boyun
    { id: 'atki', cat: 'neck', name: 'Çizgili atkı', price: 70, svg: '<path d="M-20 -8 Q2 6 22 -10 L24 0 Q2 16 -20 4 Z" fill="#DC2626"/><path d="M-8 2 L-14 30 L-2 32 L2 6 Z" fill="#DC2626"/><path d="M-12 14 h10 M-13 22 h10" stroke="#fff" stroke-width="3"/><path d="M-6 -1 l2 8 M6 -2 l2 8" stroke="#fff" stroke-width="3"/>' },
    { id: 'papyon', cat: 'neck', name: 'Papyon', price: 60, svg: '<path d="M0 0 L-16 -9 L-16 9 Z M0 0 L16 -9 L16 9 Z" fill="#7C3AED"/><circle r="4.5" fill="#5B21B6"/>' },
    { id: 'madalya', cat: 'neck', name: 'Başarı madalyası', price: 200, svg: '<path d="M-14 -10 L-4 14 M14 -10 L4 14" stroke="#DC2626" stroke-width="6"/><circle cx="0" cy="22" r="11" fill="#E0B24F" stroke="#B7862B" stroke-width="2"/><path d="M0 15 l2 5 h5 l-4 3 l2 5 l-5 -3 l-5 3 l2 -5 l-4 -3 h5 Z" fill="#fff"/>' },
    // sırt
    { id: 'eyer', cat: 'body', name: 'Kırmızı eyer örtüsü', price: 150, svg: '<path d="M-34 -6 Q0 -16 34 -6 L30 26 Q0 34 -30 26 Z" fill="#B91C1C"/><path d="M-30 24 Q0 32 30 24" stroke="#E0B24F" stroke-width="4" fill="none"/><path d="M-33 -4 Q0 -14 33 -4" stroke="#E0B24F" stroke-width="3" fill="none"/>' },
    { id: 'kilim', cat: 'body', name: 'Kilim desenli örtü', price: 250, svg: '<path d="M-34 -6 Q0 -16 34 -6 L30 26 Q0 34 -30 26 Z" fill="#9A3412"/><path d="M-26 6 l6 -8 l6 8 l6 -8 l6 8 l6 -8 l6 8 l6 -8 l6 8" stroke="#FDE68A" stroke-width="3" fill="none"/><path d="M-24 18 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6" stroke="#1E3A8A" stroke-width="3" fill="none"/><path d="M-30 24 Q0 32 30 24" stroke="#FDE68A" stroke-width="3" fill="none"/>' },
    { id: 'yildizo', cat: 'body', name: 'Yıldızlı örtü', price: 180, svg: '<path d="M-34 -6 Q0 -16 34 -6 L30 26 Q0 34 -30 26 Z" fill="#1E3A8A"/><g fill="#FDE047"><path d="M-14 4 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1z"/><path d="M10 0 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1z"/><path d="M0 14 l1.5 3 3 .7 -2 2 .7 3 -3 -1.5 -3 1.5 .7 -3 -2 -2 3 -.7z"/></g>' },
    // yele rengi
    { id: 'yele-sari', cat: 'mane', name: 'Sarı yele', price: 80, mane: 'sari' },
    { id: 'yele-kizil', cat: 'mane', name: 'Kızıl yele', price: 80, mane: 'kizil' },
    { id: 'yele-siyah', cat: 'mane', name: 'Siyah yele', price: 80, mane: 'siyah' },
    { id: 'yele-mor', cat: 'mane', name: 'Mor yele', price: 140, mane: 'mor' },
    { id: 'yele-mavi', cat: 'mane', name: 'Mavi yele', price: 140, mane: 'mavi' },
    // tüy rengi
    { id: 'tuy-beyaz', cat: 'coat', name: 'Beyaz at', price: 200, coat: 'beyaz' },
    { id: 'tuy-kir', cat: 'coat', name: 'Kır at', price: 200, coat: 'kir' },
    { id: 'tuy-siyah', cat: 'coat', name: 'Yağız (siyah) at', price: 250, coat: 'siyah' },
    { id: 'tuy-altin', cat: 'coat', name: 'Altın at', price: 400, coat: 'altin' },
    // arka plan
    { id: 'bg-cayir', cat: 'bg', name: 'Yeşil çayır', price: 100, bg: '<rect width="220" height="200" rx="26" fill="#BFE3F5"/><circle cx="40" cy="38" r="16" fill="#FDE68A"/><path d="M0 150 Q60 120 120 145 T220 140 V200 H0 Z" fill="#86C66B"/><path d="M0 170 Q80 150 220 172 V200 H0 Z" fill="#5FAE4E"/>' },
    { id: 'bg-gece', cat: 'bg', name: 'Yıldızlı gece', price: 150, bg: '<rect width="220" height="200" rx="26" fill="#1E2A4A"/><circle cx="182" cy="34" r="14" fill="#F8F1C8"/><circle cx="188" cy="30" r="12" fill="#1E2A4A"/><g fill="#fff"><circle cx="30" cy="30" r="1.8"/><circle cx="70" cy="18" r="1.4"/><circle cx="110" cy="40" r="1.6"/><circle cx="140" cy="16" r="1.2"/><circle cx="20" cy="80" r="1.3"/><circle cx="200" cy="90" r="1.5"/></g><path d="M0 170 Q110 150 220 170 V200 H0 Z" fill="#2E3E66"/>' },
    { id: 'bg-kutuphane', cat: 'bg', name: 'Kütüphane', price: 200, bg: '<rect width="220" height="200" rx="26" fill="#6B4A33"/><g><rect x="10" y="16" width="200" height="6" fill="#4A3222"/><rect x="10" y="74" width="200" height="6" fill="#4A3222"/><rect x="10" y="132" width="200" height="6" fill="#4A3222"/></g><g><rect x="16" y="34" width="10" height="40" fill="#B91C1C"/><rect x="28" y="40" width="9" height="34" fill="#1D4ED8"/><rect x="39" y="30" width="11" height="44" fill="#15803D"/><rect x="52" y="38" width="8" height="36" fill="#E0B24F"/><rect x="150" y="36" width="10" height="38" fill="#7C3AED"/><rect x="162" y="30" width="12" height="44" fill="#B91C1C"/><rect x="176" y="40" width="9" height="34" fill="#0F766E"/><rect x="187" y="34" width="11" height="40" fill="#1D4ED8"/><rect x="16" y="94" width="11" height="38" fill="#0F766E"/><rect x="29" y="100" width="9" height="32" fill="#E0B24F"/><rect x="180" y="96" width="12" height="36" fill="#15803D"/><rect x="194" y="102" width="9" height="30" fill="#B91C1C"/></g><rect y="160" width="220" height="40" rx="0" fill="#8B5E3C"/>' },
    { id: 'bg-gunbatimi', cat: 'bg', name: 'Gün batımı', price: 160, bg: '<defs><linearGradient id="gbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F59E0B"/><stop offset="1" stop-color="#DB2777"/></linearGradient></defs><rect width="220" height="200" rx="26" fill="url(#gbg)"/><circle cx="110" cy="150" r="40" fill="#FDE68A" opacity=".8"/><path d="M0 165 Q110 150 220 165 V200 H0 Z" fill="#7C2D12" opacity=".7"/>' }
  ];
  const CATS = { head: 'Şapkalar', face: 'Gözlükler', neck: 'Boyun', body: 'Eyer örtüleri', mane: 'Yele rengi', coat: 'Tüy rengi', bg: 'Arka plan' };
  const item = (id) => ITEMS.find((x) => x.id === id);

  // ------------------------------------------------------------ çizim
  const EAR = { happy: -8, ok: 0, worried: 22, sad: 58, sleep: 38 };

  function eye(mood) {
    const x = 157, y = 66;
    if (mood === 'happy') return `<path d="M${x - 8} ${y + 3} Q${x} ${y - 8} ${x + 8} ${y + 3}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
    if (mood === 'sleep') return `<path d="M${x - 8} ${y} Q${x} ${y + 7} ${x + 8} ${y}" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
    let s = `<ellipse cx="${x}" cy="${y}" rx="8.5" ry="10" fill="#fff"/><circle cx="${x + 2}" cy="${y + (mood === 'sad' ? 3 : 1)}" r="5.5" fill="${INK}"/><circle cx="${x + 4}" cy="${y - 1}" r="1.8" fill="#fff"/>`;
    if (mood === 'worried' || mood === 'sad') s += `<path d="M${x - 10} ${y - 11} L${x + 8} ${y - 17}" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`;
    if (mood === 'sad') s += `<path d="M${x - 9} ${y - 6} Q${x} ${y - 12} ${x + 9} ${y - 6} L${x + 9} ${y - 2} Q${x} ${y - 7} ${x - 9} ${y - 2} Z" fill="var(--coat)"/>`;
    return s;
  }
  function mouth(mood) {
    if (mood === 'happy') return `<path d="M174 98 Q184 108 194 97" fill="#7A2E2E" stroke="${INK}" stroke-width="2.5" stroke-linecap="round"/>`;
    if (mood === 'sad') return `<path d="M176 103 Q184 96 192 102" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    if (mood === 'worried') return `<path d="M177 100 Q184 98 191 101" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    if (mood === 'sleep') return `<path d="M178 100 h11" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    return `<path d="M176 99 Q184 105 192 99" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  }
  function extras(mood) {
    if (mood === 'happy') return `<g fill="#E0B24F"><path d="M30 52l4 9 9 4-9 4-4 9-4-9-9-4 9-4z"/><path d="M196 26l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/></g>`;
    if (mood === 'sleep') return `<g fill="${INK}" font-family="Arial, sans-serif" font-weight="700"><text x="172" y="40" font-size="22">Z</text><text x="190" y="24" font-size="15">z</text><text x="202" y="14" font-size="11">z</text></g>`;
    if (mood === 'worried') return `<path d="M186 48 q-6 10 0 14 q6-4 0-14z" fill="#7CC4E8"/>`;
    if (mood === 'sad') return `<path d="M156 80 q-5 9 0 12 q5-3 0-12z" fill="#7CC4E8"/>`;
    return '';
  }
  function place(cat, svg) { const [x, y] = ANCHOR[cat]; return `<g transform="translate(${x} ${y})">${svg}</g>`; }

  /** Maskotun SVG çizimi. mood: happy | ok | worried | sad | sleep; look: giyilen eşyalar */
  function svg(mood = 'ok', size = 120, uid = '', look = {}) {
    const coat = COATS[look.coat] || COATS.kestane;
    const mane = MANES[look.mane] || MANES.koyu;
    const ear = EAR[mood] ?? 0;
    const tilt = mood === 'sad' ? 3 : mood === 'happy' ? -3 : 0;
    const bg = look.bg && item(look.bg) ? item(look.bg).bg.replace(/id="gbg"/g, `id="gbg${uid}"`).replace(/url\(#gbg\)/g, `url(#gbg${uid})`) : '';
    const wear = (cat) => (look[cat] && item(look[cat]) ? place(cat, item(look[cat]).svg) : '');
    const earShape = (px, py, d) => `<g transform="rotate(${ear} ${px} ${py})"><path d="${d}" fill="${coat.body}" stroke="${coat.shade}" stroke-width="2" stroke-linejoin="round"/></g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 200" width="${size}" height="${Math.round(size * 200 / 220)}" role="img" aria-label="Rüzgar" style="--coat:${coat.body}">
  ${bg}
  <ellipse cx="104" cy="190" rx="70" ry="7" fill="#000" opacity=".14"/>
  <g transform="rotate(${tilt} 110 150)">
    <path d="M44 118 C20 116 10 146 20 174 C26 156 32 144 48 136 Z" fill="${mane}"/>
    <rect x="58" y="146" width="12" height="40" rx="5" fill="${coat.shade}"/><rect x="74" y="148" width="12" height="38" rx="5" fill="${coat.body}"/>
    <rect x="112" y="148" width="12" height="38" rx="5" fill="${coat.shade}"/><rect x="128" y="146" width="12" height="40" rx="5" fill="${coat.body}"/>
    <g fill="${INK}"><rect x="57" y="180" width="14" height="8" rx="3"/><rect x="73" y="180" width="14" height="8" rx="3"/><rect x="111" y="180" width="14" height="8" rx="3"/><rect x="127" y="180" width="14" height="8" rx="3"/></g>
    <ellipse cx="96" cy="132" rx="54" ry="33" fill="${coat.body}"/>
    ${wear('body')}
    <path d="M106 122 C112 98 126 80 142 74 L164 96 C150 108 140 124 134 146 Z" fill="${coat.body}"/>
    ${earShape(142, 48, 'M136 50 L132 22 L150 44 Z')}
    <path d="M144 44 C124 48 112 68 104 90 C100 100 100 112 106 122 C112 106 118 94 128 82 C134 72 140 62 150 54 Z" fill="${mane}"/>
    <ellipse cx="154" cy="72" rx="31" ry="27" transform="rotate(14 154 72)" fill="${coat.body}"/>
    ${earShape(158, 46, 'M152 48 L158 18 L168 46 Z')}
    <path d="M146 40 q4 -10 12 -6 q-2 6 6 4 q-4 10 -12 12 z" fill="${mane}"/>
    <path d="M158 48 Q166 62 176 78 L170 82 Q160 66 152 52 Z" fill="#fff" opacity=".9"/>
    <ellipse cx="180" cy="92" rx="22" ry="16" transform="rotate(10 180 92)" fill="${coat.muzzle}"/>
    <ellipse cx="191" cy="88" rx="2.6" ry="3.6" fill="${INK}"/>
    ${mouth(mood)}
    ${eye(mood)}
    ${mood === 'happy' || mood === 'ok' ? '<ellipse cx="160" cy="84" rx="7" ry="4.5" fill="#F28B82" opacity=".5"/>' : ''}
    ${wear('face')}
    ${wear('neck')}
    ${wear('head')}
  </g>
  ${extras(mood)}
</svg>`;
  }

  const LINES = {
    happy: ['Hedef tamam! Kişneyerek kutluyorum!', 'Harika iş! Havuçları hak ettin.', 'Bugün dört nala koştuk!'],
    ok: ['İyi gidiyoruz, bir blok daha?', 'Başladık bile, şimdi bırakma!', 'Hadi, bugün de birlikte koşalım.'],
    worried: ['Bugün daha hiç koşmadık…', 'Seni bekliyorum, 25 dakika yeter.', 'Öğleden sonra oldu, başlayalım mı?'],
    sad: ['Bugün beni ahırda unuttun mu?', 'Seri bozulmak üzere… 1 blok kurtarır.', 'Havuçlarım bitti, hadi çalışalım.'],
    sleep: ['Dinlenmek de çalışmanın parçası.', 'İyi uykular, yarın erken koşarız.', 'Zzz… yarın görüşürüz.']
  };

  /** Ruh hâli: bugünkü dakika, hedef ve saate göre. Android widget'ı da aynı kuralı kullanır. */
  function mood({ todayMin = 0, goal = 0, yesterdayMin = 0, hour = new Date().getHours() } = {}) {
    if (hour < 7) return 'sleep';
    if (goal <= 0) return todayMin > 0 ? 'happy' : 'sleep';
    if (todayMin >= goal) return 'happy';
    if (todayMin > 0) return 'ok';
    if (hour >= 20 || (yesterdayMin === 0 && hour >= 12)) return 'sad';
    if (hour >= 14) return 'worried';
    return 'ok';
  }
  function line(m, dayIndex = new Date().getDate()) { const L = LINES[m] || LINES.ok; return L[dayIndex % L.length]; }

  /** Çizimi PNG'ye çevirir (Android widget'ı için). */
  function png(moodName, look, size = 240) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement('canvas'); c.width = size; c.height = Math.round(size * 200 / 220);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/png').split(',')[1]);
        } catch (e) { reject(e); }
      };
      img.onerror = reject;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg(moodName, size, 'png', look));
    });
  }

  window.Mascot = { svg, mood, line, png, LINES, ITEMS, CATS, item, MOODS: ['happy', 'ok', 'worried', 'sad', 'sleep'] };
})();
