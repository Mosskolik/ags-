/* Hüdhüd — Hedef AGS'nin maskotu (ibibik kuşu).
 * Ruh hâli, bugünkü çalışmana göre değişir. Aynı çizim Android widget'ında da kullanılır. */
(function () {
  'use strict';

  const C = { body: '#E9A25B', belly: '#F7D7AA', dark: '#2E2723', white: '#FFF8EE', beak: '#3B302B', blush: '#F28B82', leg: '#C9773A', tip: '#2E2723' };

  // tepelik tüyleri: [açı, uzunluk] — ruh hâline göre açılır ya da yatar
  const CREST = {
    happy: { base: -95, spread: 22, len: 1.0 },
    ok: { base: -110, spread: 18, len: 0.92 },
    worried: { base: -125, spread: 12, len: 0.85 },
    sad: { base: -160, spread: 8, len: 0.8 },
    sleep: { base: -170, spread: 6, len: 0.78 }
  };

  function crest(mood) {
    const c = CREST[mood] || CREST.ok; const ox = 124, oy = 58; let out = '';
    for (let i = -2; i <= 2; i++) {
      const a = c.base + i * c.spread; const L = (46 - Math.abs(i) * 4) * c.len;
      out += `<g transform="translate(${ox} ${oy}) rotate(${a})">
        <ellipse cx="${L / 2}" cy="0" rx="${L / 2 + 2}" ry="6.5" fill="${C.body}"/>
        <ellipse cx="${L - 3}" cy="0" rx="4.5" ry="5" fill="${C.white}"/>
        <ellipse cx="${L + 1}" cy="0" rx="4" ry="4.6" fill="${C.tip}"/></g>`;
    }
    return out;
  }

  function eye(mood) {
    const x = 141, y = 74;
    if (mood === 'happy') return `<path d="M${x - 8} ${y + 3} Q${x} ${y - 9} ${x + 8} ${y + 3}" fill="none" stroke="${C.dark}" stroke-width="4" stroke-linecap="round"/>`;
    if (mood === 'sleep') return `<path d="M${x - 8} ${y} Q${x} ${y + 7} ${x + 8} ${y}" fill="none" stroke="${C.dark}" stroke-width="3.5" stroke-linecap="round"/>`;
    let s = `<circle cx="${x}" cy="${y}" r="10" fill="${C.white}"/><circle cx="${x + 2}" cy="${y + (mood === 'sad' ? 3 : 1)}" r="5.5" fill="${C.dark}"/><circle cx="${x + 4}" cy="${y - 1}" r="1.8" fill="#fff"/>`;
    if (mood === 'worried') s += ` <path d="M${x - 10} ${y - 12} L${x + 9} ${y - 18}" stroke="${C.dark}" stroke-width="3.5" stroke-linecap="round"/>`;
    if (mood === 'sad') s += `<path d="M${x - 11} ${y - 5} Q${x} ${y - 13} ${x + 11} ${y - 5} L${x + 11} ${y - 1} Q${x} ${y - 7} ${x - 11} ${y - 1} Z" fill="${C.body}"/><path d="M${x - 9} ${y - 13} L${x + 9} ${y - 17}" stroke="${C.dark}" stroke-width="3.5" stroke-linecap="round"/>`;
    return s;
  }

  function extras(mood) {
    if (mood === 'happy') return `<g fill="#E0B24F"><path d="M40 52l4 9 9 4-9 4-4 9-4-9-9-4 9-4z"/><path d="M178 40l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/><path d="M170 130l2.5 5 5 2.5-5 2.5-2.5 5-2.5-5-5-2.5 5-2.5z"/></g>`;
    if (mood === 'sleep') return `<g fill="${C.dark}" font-family="Arial, sans-serif" font-weight="700"><text x="160" y="52" font-size="22">Z</text><text x="178" y="34" font-size="15">z</text><text x="190" y="22" font-size="11">z</text></g>`;
    if (mood === 'worried') return `<path d="M168 60 q-6 10 0 14 q6-4 0-14z" fill="#7CC4E8"/>`;
    if (mood === 'sad') return `<path d="M140 88 q-5 9 0 12 q5-3 0-12z" fill="#7CC4E8"/>`;
    return '';
  }

  /** Maskotun SVG çizimi. mood: happy | ok | worried | sad | sleep */
  function svg(mood = 'ok', size = 120, uid = '') {
    const id = 'hw' + mood + uid;
    const tilt = mood === 'sad' ? 4 : mood === 'happy' ? -3 : 0;
    const beak = mood === 'sad' || mood === 'sleep'
      ? 'M155 84 Q176 92 188 112'
      : mood === 'happy' ? 'M155 82 Q178 78 194 90' : 'M155 83 Q178 84 192 100';
    const beakLow = mood === 'happy' ? `<path d="M155 87 Q172 92 184 100" fill="none" stroke="${C.beak}" stroke-width="4" stroke-linecap="round"/>` : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 200" width="${size}" height="${size}" role="img" aria-label="Hüdhüd">
  <defs><clipPath id="${id}"><ellipse cx="78" cy="128" rx="38" ry="28" transform="rotate(-12 78 128)"/></clipPath></defs>
  <ellipse cx="102" cy="188" rx="58" ry="7" fill="#000" opacity=".12"/>
  <g transform="rotate(${tilt} 100 130)">
    <path d="M44 146 L14 168 L22 174 L52 156 Z" fill="${C.dark}"/><path d="M30 158 L20 165" stroke="${C.white}" stroke-width="4"/>
    <path d="M86 168 L82 186 M110 168 L112 186" stroke="${C.leg}" stroke-width="5" stroke-linecap="round"/>
    <path d="M76 186 h12 M106 186 h13" stroke="${C.leg}" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="98" cy="128" rx="56" ry="46" fill="${C.body}"/>
    <ellipse cx="114" cy="142" rx="32" ry="28" fill="${C.belly}"/>
    <g clip-path="url(#${id})">
      <rect x="30" y="90" width="100" height="80" fill="${C.dark}"/>
      <g stroke="${C.white}" stroke-width="7" transform="rotate(28 78 128)"><path d="M40 108 h80 M40 124 h80 M40 140 h80 M40 156 h80"/></g>
    </g>
    ${crest(mood)}
    <circle cx="132" cy="80" r="31" fill="${C.body}"/>
    <path d="${beak}" fill="none" stroke="${C.beak}" stroke-width="5.5" stroke-linecap="round"/>${beakLow}
    ${eye(mood)}
    ${mood === 'happy' || mood === 'ok' ? `<ellipse cx="134" cy="94" rx="7" ry="4.5" fill="${C.blush}" opacity=".55"/>` : ''}
  </g>
  ${extras(mood)}
</svg>`;
  }

  const LINES = {
    happy: ['Bugünkü hedef tamam! Seninle gurur duyuyorum.', 'Harika iş! Yarın da böyle devam.', 'Hedef tamam, seri büyüyor!'],
    ok: ['İyi gidiyorsun, bir blok daha?', 'Başladın bile, şimdi bırakma!', 'Hadi, bugün de birlikte çalışalım.'],
    worried: ['Bugün daha hiç çalışmadık…', 'Seni bekliyorum, 25 dakika yeter.', 'Öğleden sonra oldu, hadi başlayalım mı?'],
    sad: ['Bugün beni unuttun mu? 😢', 'Seri bozulmak üzere… 1 blok kurtarır.', 'Hedefimiz bizi bekliyor, gel hadi.'],
    sleep: ['Dinlenmek de çalışmanın parçası.', 'İyi uykular, yarın erken başlarız.', 'Zzz… yarın görüşürüz.']
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

  window.Mascot = { svg, mood, line, LINES, MOODS: ['happy', 'ok', 'worried', 'sad', 'sleep'] };
})();
