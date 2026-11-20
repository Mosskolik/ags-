/* Rüzgar — Hedef AGS'nin at maskotu.
 * Ruh hâli bugünkü çalışmana göre değişir; havuçlarla aldığın eşyaları giyer.
 * Aynı çizim Android widget'ında da kullanılır. */
(function () {
  'use strict';

  // ------------------------------------------------------------ renkler
  const COATS = {
    kestane: { top: '#C8834F', bottom: '#9C5A30', leg: '#8E512B', ear: '#B8744A', earIn: '#F2B8A2', muzzle: '#E9C2A0', muzzle2: '#DDAF8A' },
    beyaz: { top: '#FFFDF8', bottom: '#E3DBCF', leg: '#D6CCBE', ear: '#F3EEE6', earIn: '#F7C9C2', muzzle: '#FBE3D6', muzzle2: '#F1CFC0' },
    kir: { top: '#B4BCC1', bottom: '#858E94', leg: '#788188', ear: '#A2AAB0', earIn: '#E7C3BE', muzzle: '#DCE0E3', muzzle2: '#C6CBCF' },
    siyah: { top: '#4A403A', bottom: '#2A2320', leg: '#241E1B', ear: '#3E3530', earIn: '#B98C80', muzzle: '#76665C', muzzle2: '#5F5249' },
    altin: { top: '#F2C57A', bottom: '#C99248', leg: '#B98440', ear: '#E2B061', earIn: '#F6C9A8', muzzle: '#F8E2BC', muzzle2: '#EDCF9E' }
  };
  const MANES = {
    koyu: ['#3E2416', '#6B4027', '#8A5A3A'], sari: ['#E9C46A', '#FBE7A8', '#C9A24A'], siyah: ['#141110', '#3A322E', '#5A504A'],
    kizil: ['#9A3412', '#E0702C', '#C2410C'], mor: ['#5B21B6', '#A78BFA', '#7C3AED'], mavi: ['#1E3A8A', '#60A5FA', '#2563EB']
  };
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
  const coatOf = (look) => COATS[(item(look.coat) || {}).coat] || COATS.kestane;
  const maneOf = (look) => MANES[(item(look.mane) || {}).mane] || MANES.koyu;

  // ------------------------------------------------------------ çizim
  const EAR = { happy: -6, ok: 0, worried: 20, sad: 46, sleep: 34 };

  function eye(mood, g) {
    if (mood === 'happy') return `<path d="M150 69 Q158 58 166 69" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M152 63 l-4 -4 M157 60 l-1 -5" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
    if (mood === 'sleep') return `<path d="M150 67 Q158 75 166 67" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/><path d="M151 70 l-4 3 M156 73 l-2 4" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
    let e = `<ellipse cx="158" cy="68" rx="8.5" ry="10.5" fill="#fff"/><circle cx="160" cy="${mood === 'sad' ? 72 : 70}" r="6" fill="#3B2412"/><circle cx="162.5" cy="${mood === 'sad' ? 69 : 67}" r="2" fill="#fff"/><path d="M150 61 l-4 -3" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
    if (mood === 'worried') e += `<path d="M148 55 l19 -6" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    if (mood === 'sad') e += `<path d="M149 62 Q158 56 167 61 L167 65 Q158 60 149 66 Z" fill="url(#${g}c)"/><path d="M148 55 l20 -5" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    return e;
  }
  function mouth(mood) {
    if (mood === 'happy') return `<path d="M174 98 Q184 109 194 97" fill="#7A2E2E" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M180 102 q4 3 8 0" fill="#E77" />`;
    if (mood === 'sad') return `<path d="M176 103 Q184 96 192 102" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    if (mood === 'worried') return `<path d="M177 101 q4 -3 7 0 q4 3 7 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
    if (mood === 'sleep') return `<path d="M178 100 h11" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    return `<path d="M176 99 Q184 105 192 99" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  }
  function extras(mood) {
    if (mood === 'happy') return `<g fill="#E0B24F"><path d="M30 52l4 9 9 4-9 4-4 9-4-9-9-4 9-4z"/><path d="M200 22l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/></g>`;
    if (mood === 'sleep') return `<g fill="${INK}" font-family="Arial, sans-serif" font-weight="700"><text x="172" y="40" font-size="22">Z</text><text x="190" y="24" font-size="15">z</text><text x="202" y="14" font-size="11">z</text></g>`;
    if (mood === 'worried') return `<path d="M188 46 q-6 10 0 14 q6-4 0-14z" fill="#7CC4E8"/>`;
    if (mood === 'sad') return `<path d="M158 82 q-5 9 0 12 q5 -3 0 -12z" fill="#7CC4E8"/>`;
    return '';
  }
  function place(cat, svg) { const [x, y] = ANCHOR[cat]; return `<g transform="translate(${x} ${y})">${svg}</g>`; }

  /** Maskotun SVG çizimi. mood: happy | ok | worried | sad | sleep; look: giyilen eşyaların kimlikleri */
  function svg(mood = 'ok', size = 120, uid = '', look = {}) {
    const c = coatOf(look); const m = maneOf(look); const g = 'r' + String(uid).replace(/[^a-zA-Z0-9]/g, '') + mood;
    const ear = EAR[mood] ?? 0;
    const tilt = mood === 'sad' ? 3 : mood === 'happy' ? -3 : 0;
    const bgItem = look.bg && item(look.bg);
    const bg = bgItem ? bgItem.bg.replace(/id="gbg"/g, `id="${g}bg"`).replace(/url\(#gbg\)/g, `url(#${g}bg)`) : '';
    const wear = (cat) => (look[cat] && item(look[cat]) && item(look[cat]).svg ? place(cat, item(look[cat]).svg) : '');
    const earG = (px, py, d, din) => `<g transform="rotate(${ear} ${px} ${py})"><path d="${d}" fill="${c.ear}" stroke="${c.leg}" stroke-width="2" stroke-linejoin="round"/><path d="${din}" fill="${c.earIn}"/></g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 200" width="${size}" height="${Math.round(size * 200 / 220)}" role="img" aria-label="Rüzgar">
  <defs>
    <linearGradient id="${g}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.top}"/><stop offset="1" stop-color="${c.bottom}"/></linearGradient>
    <linearGradient id="${g}m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${m[0]}"/><stop offset="1" stop-color="${m[1]}"/></linearGradient>
  </defs>
  ${bg}
  <ellipse cx="104" cy="191" rx="72" ry="7" fill="#000" opacity=".15"/>
  <g transform="rotate(${tilt} 110 150)">
    <path d="M46 116 C18 112 8 140 14 160 C18 172 28 180 24 190 C40 182 40 166 34 154 C46 162 52 150 44 140 C54 140 54 128 46 124 Z" fill="url(#${g}m)"/>
    <path d="M22 150 q8 -16 22 -20" stroke="${m[2]}" stroke-width="2" fill="none"/>
    <rect x="58" y="146" width="12" height="40" rx="5" fill="${c.leg}"/><rect x="74" y="148" width="12" height="38" rx="5" fill="url(#${g}c)"/>
    <rect x="112" y="148" width="12" height="38" rx="5" fill="${c.leg}"/><rect x="128" y="146" width="12" height="40" rx="5" fill="url(#${g}c)"/>
    <g fill="#FFF7EE"><rect x="74" y="168" width="12" height="14" rx="4"/><rect x="128" y="168" width="12" height="14" rx="4"/></g>
    <g fill="#3A2A22"><rect x="57" y="180" width="14" height="8" rx="3"/><rect x="73" y="180" width="14" height="8" rx="3"/><rect x="111" y="180" width="14" height="8" rx="3"/><rect x="127" y="180" width="14" height="8" rx="3"/></g>
    <ellipse cx="96" cy="132" rx="54" ry="33" fill="url(#${g}c)"/>
    <path d="M60 120 q30 -18 70 -6" stroke="#fff" stroke-opacity=".25" stroke-width="5" fill="none" stroke-linecap="round"/>
    ${wear('body')}
    <path d="M106 122 C112 98 126 80 142 74 L164 96 C150 108 140 124 134 146 Z" fill="url(#${g}c)"/>
    ${earG(142, 48, 'M136 50 L132 22 L150 44 Z', 'M138 44 L136 30 L145 42 Z')}
    <path d="M146 42 C122 44 110 62 100 86 C96 98 92 112 98 124 C92 108 106 100 104 92 C110 104 116 94 118 86 C122 96 128 86 128 80 C134 86 138 74 138 68 C144 72 148 60 150 54 Z" fill="url(#${g}m)"/>
    <path d="M104 92 q8 -16 22 -30 M114 88 q6 -12 18 -24" stroke="${m[2]}" stroke-width="2" fill="none"/>
    <ellipse cx="154" cy="72" rx="31" ry="27" transform="rotate(14 154 72)" fill="url(#${g}c)"/>
    ${earG(158, 46, 'M152 48 L158 18 L168 46 Z', 'M156 44 L158 28 L164 44 Z')}
    <path d="M144 42 q2 -14 14 -10 q-2 8 8 6 q-2 12 -16 14 q-10 0 -6 -10z" fill="url(#${g}m)"/>
    <path d="M150 48 l2.4 5 5 .8 -3.6 3.2 .8 5 -4.6 -2.4 -4.6 2.4 .8 -5 -3.6 -3.2 5 -.8z" fill="#FFF7EE"/>
    <ellipse cx="180" cy="92" rx="22" ry="16" transform="rotate(10 180 92)" fill="${c.muzzle}"/>
    <ellipse cx="186" cy="96" rx="12" ry="6" transform="rotate(10 180 92)" fill="${c.muzzle2}"/>
    <ellipse cx="191" cy="88" rx="2.6" ry="3.6" fill="${INK}"/>
    ${mouth(mood)}
    ${eye(mood, g)}
    <ellipse cx="160" cy="84" rx="7" ry="4.5" fill="#F28B82" opacity="${mood === 'happy' || mood === 'ok' ? '.55' : '.25'}"/>
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

  window.Mascot = { svg, mood, line, png, LINES, ITEMS, CATS, item, COATS, MANES, MOODS: ['happy', 'ok', 'worried', 'sad', 'sleep'] };
})();
