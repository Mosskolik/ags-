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
    benekli: { top: '#FFFDF8', bottom: '#E3DBCF', leg: '#D6CCBE', ear: '#F3EEE6', earIn: '#F7C9C2', muzzle: '#FBE3D6', muzzle2: '#F1CFC0', spots: '#6B4A33' },
    altin: { top: '#F2C57A', bottom: '#C99248', leg: '#B98440', ear: '#E2B061', earIn: '#F6C9A8', muzzle: '#F8E2BC', muzzle2: '#EDCF9E' }
  };
  const MANES = {
    koyu: ['#3E2416', '#6B4027', '#8A5A3A'], sari: ['#E9C46A', '#FBE7A8', '#C9A24A'], siyah: ['#141110', '#3A322E', '#5A504A'],
    kizil: ['#9A3412', '#E0702C', '#C2410C'], pembe: ['#BE185D', '#F9A8D4', '#DB2777'], yesil: ['#166534', '#86EFAC', '#15803D'], gumus: ['#6B7280', '#E5E7EB', '#9CA3AF'], mor: ['#5B21B6', '#A78BFA', '#7C3AED'], mavi: ['#1E3A8A', '#60A5FA', '#2563EB']
  };
  const INK = '#2B211C';

  // ------------------------------------------------------------ eşyalar
  // Her eşya kendi bağlantı noktasına göre (0,0) merkezli çizilir.
  const ANCHOR = { head: [150, 40], face: [157, 66], neck: [126, 114], body: [88, 104], prop: [180, 190] };
  const ITEMS = [
    // şapkalar
    { id: 'kep', cat: 'head', name: 'Mezuniyet kepi', price: 60, svg: '<path d="M-32 -4 L0 -17 L32 -4 L0 9 Z" fill="#1f1f1f"/><path d="M-15 0 v10 q15 7 30 0 v-10" fill="#2b2b2b"/><path d="M0 -4 L24 2 L26 18" stroke="#E0B24F" stroke-width="2.5" fill="none"/><circle cx="26" cy="20" r="4" fill="#E0B24F"/>' },
    { id: 'fes', cat: 'head', name: 'Fes', price: 40, svg: '<path d="M-15 6 L-12 -22 L12 -22 L15 6 Z" fill="#B91C1C"/><ellipse cx="0" cy="-22" rx="12" ry="3" fill="#991B1B"/><path d="M0 -22 q10 6 9 20" stroke="#1f1f1f" stroke-width="2.5" fill="none"/>' },
    { id: 'bere', cat: 'head', name: 'Kışlık bere', price: 15, svg: '<path d="M-21 6 Q-21 -24 0 -24 Q21 -24 21 6 Z" fill="#2563EB"/><path d="M-10 -20 v24 M0 -24 v28 M10 -20 v24" stroke="#1D4ED8" stroke-width="2"/><rect x="-22" y="0" width="44" height="9" rx="4.5" fill="#1E40AF"/><circle cy="-27" r="7" fill="#fff"/>' },
    { id: 'hasir', cat: 'head', name: 'Hasır şapka', price: 30, svg: '<ellipse cx="0" cy="4" rx="34" ry="8" fill="#E7C27A"/><path d="M-17 4 Q-17 -22 0 -22 Q17 -22 17 4 Z" fill="#EBCB8B"/><rect x="-17" y="-4" width="34" height="6" fill="#B91C1C"/>' },
    { id: 'cicek', cat: 'head', name: 'Çiçek tacı', price: 70, svg: '<path d="M-24 6 Q0 -6 24 6" stroke="#4D7C0F" stroke-width="4" fill="none"/><g><circle cx="-20" cy="2" r="6" fill="#F472B6"/><circle cx="-8" cy="-2" r="6" fill="#FDE047"/><circle cx="4" cy="-3" r="6" fill="#F472B6"/><circle cx="16" cy="0" r="6" fill="#A78BFA"/><circle cx="-20" cy="2" r="2" fill="#fff"/><circle cx="-8" cy="-2" r="2" fill="#fff"/><circle cx="4" cy="-3" r="2" fill="#fff"/><circle cx="16" cy="0" r="2" fill="#fff"/></g>' },
    { id: 'tac', cat: 'head', name: 'Altın taç', price: 150, svg: '<path d="M-20 6 L-20 -15 L-10 -4 L0 -20 L10 -4 L20 -15 L20 6 Z" fill="#E0B24F" stroke="#B7862B" stroke-width="1.5" stroke-linejoin="round"/><circle cx="0" cy="-2" r="3.5" fill="#DC2626"/><circle cx="-12" cy="0" r="2.5" fill="#2563EB"/><circle cx="12" cy="0" r="2.5" fill="#16A34A"/>' },
    // gözlükler
    { id: 'gozluk', cat: 'face', name: 'Okuma gözlüğü', price: 15, svg: '<circle r="11" fill="#fff" fill-opacity=".25" stroke="#3B2F2A" stroke-width="3"/><path d="M11 -1 h10 M-11 -2 L-22 -6" stroke="#3B2F2A" stroke-width="3" stroke-linecap="round"/>' },
    { id: 'gunes', cat: 'face', name: 'Güneş gözlüğü', price: 30, svg: '<rect x="-12" y="-9" width="24" height="17" rx="7" fill="#111827"/><path d="M-6 -5 l6 0" stroke="#fff" stroke-opacity=".5" stroke-width="2.5" stroke-linecap="round"/><path d="M12 -2 h10 M-12 -3 L-23 -7" stroke="#111827" stroke-width="3" stroke-linecap="round"/>' },
    { id: 'yildizg', cat: 'face', name: 'Parti gözlüğü', price: 50, svg: '<path d="M0 -14 L4 -5 L14 -4 L6 3 L9 13 L0 7 L-9 13 L-6 3 L-14 -4 L-4 -5 Z" fill="#EC4899" stroke="#BE185D" stroke-width="1.5"/><circle r="5" fill="#fff" fill-opacity=".35"/><path d="M14 -3 h9" stroke="#BE185D" stroke-width="3" stroke-linecap="round"/>' },
    // boyun
    { id: 'atki', cat: 'neck', name: 'Çizgili atkı', price: 25, svg: '<path d="M-20 -8 Q2 6 22 -10 L24 0 Q2 16 -20 4 Z" fill="#DC2626"/><path d="M-8 2 L-14 30 L-2 32 L2 6 Z" fill="#DC2626"/><path d="M-12 14 h10 M-13 22 h10" stroke="#fff" stroke-width="3"/><path d="M-6 -1 l2 8 M6 -2 l2 8" stroke="#fff" stroke-width="3"/>' },
    { id: 'papyon', cat: 'neck', name: 'Papyon', price: 10, svg: '<path d="M0 0 L-16 -9 L-16 9 Z M0 0 L16 -9 L16 9 Z" fill="#7C3AED"/><circle r="4.5" fill="#5B21B6"/>' },
    { id: 'madalya', cat: 'neck', name: 'Başarı madalyası', price: 80, svg: '<path d="M-14 -10 L-4 14 M14 -10 L4 14" stroke="#DC2626" stroke-width="6"/><circle cx="0" cy="22" r="11" fill="#E0B24F" stroke="#B7862B" stroke-width="2"/><path d="M0 15 l2 5 h5 l-4 3 l2 5 l-5 -3 l-5 3 l2 -5 l-4 -3 h5 Z" fill="#fff"/>' },
    // sırt
    { id: 'eyer', cat: 'body', name: 'Kırmızı eyer örtüsü', price: 45, svg: '<path d="M-34 -6 Q0 -16 34 -6 L30 26 Q0 34 -30 26 Z" fill="#B91C1C"/><path d="M-30 24 Q0 32 30 24" stroke="#E0B24F" stroke-width="4" fill="none"/><path d="M-33 -4 Q0 -14 33 -4" stroke="#E0B24F" stroke-width="3" fill="none"/>' },
    { id: 'kilim', cat: 'body', name: 'Kilim desenli örtü', price: 100, svg: '<path d="M-34 -6 Q0 -16 34 -6 L30 26 Q0 34 -30 26 Z" fill="#9A3412"/><path d="M-26 6 l6 -8 l6 8 l6 -8 l6 8 l6 -8 l6 8 l6 -8 l6 8" stroke="#FDE68A" stroke-width="3" fill="none"/><path d="M-24 18 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6" stroke="#1E3A8A" stroke-width="3" fill="none"/><path d="M-30 24 Q0 32 30 24" stroke="#FDE68A" stroke-width="3" fill="none"/>' },
    { id: 'yildizo', cat: 'body', name: 'Yıldızlı örtü', price: 70, svg: '<path d="M-34 -6 Q0 -16 34 -6 L30 26 Q0 34 -30 26 Z" fill="#1E3A8A"/><g fill="#FDE047"><path d="M-14 4 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1z"/><path d="M10 0 l2 4 4 1 -3 3 1 4 -4 -2 -4 2 1 -4 -3 -3 4 -1z"/><path d="M0 14 l1.5 3 3 .7 -2 2 .7 3 -3 -1.5 -3 1.5 .7 -3 -2 -2 3 -.7z"/></g>' },
    // yele rengi
    { id: 'yele-sari', cat: 'mane', name: 'Sarı yele', price: 20, mane: 'sari' },
    { id: 'yele-kizil', cat: 'mane', name: 'Kızıl yele', price: 20, mane: 'kizil' },
    { id: 'yele-siyah', cat: 'mane', name: 'Siyah yele', price: 20, mane: 'siyah' },
    { id: 'yele-mor', cat: 'mane', name: 'Mor yele', price: 40, mane: 'mor' },
    { id: 'yele-mavi', cat: 'mane', name: 'Mavi yele', price: 40, mane: 'mavi' },
    // tüy rengi
    { id: 'tuy-beyaz', cat: 'coat', name: 'Beyaz at', price: 60, coat: 'beyaz' },
    { id: 'tuy-kir', cat: 'coat', name: 'Kır at', price: 60, coat: 'kir' },
    { id: 'tuy-siyah', cat: 'coat', name: 'Yağız (siyah) at', price: 80, coat: 'siyah' },
    { id: 'tuy-altin', cat: 'coat', name: 'Altın at', price: 140, coat: 'altin' },
    // arka plan
    { id: 'bg-cayir', cat: 'bg', name: 'Yeşil çayır', price: 30, bg: '<rect width="220" height="200" rx="26" fill="#BFE3F5"/><circle cx="40" cy="38" r="16" fill="#FDE68A"/><path d="M0 150 Q60 120 120 145 T220 140 V200 H0 Z" fill="#86C66B"/><path d="M0 170 Q80 150 220 172 V200 H0 Z" fill="#5FAE4E"/>' },
    { id: 'bg-gece', cat: 'bg', name: 'Yıldızlı gece', price: 50, bg: '<rect width="220" height="200" rx="26" fill="#1E2A4A"/><circle cx="182" cy="34" r="14" fill="#F8F1C8"/><circle cx="188" cy="30" r="12" fill="#1E2A4A"/><g fill="#fff"><circle cx="30" cy="30" r="1.8"/><circle cx="70" cy="18" r="1.4"/><circle cx="110" cy="40" r="1.6"/><circle cx="140" cy="16" r="1.2"/><circle cx="20" cy="80" r="1.3"/><circle cx="200" cy="90" r="1.5"/></g><path d="M0 170 Q110 150 220 170 V200 H0 Z" fill="#2E3E66"/>' },
    { id: 'bg-kutuphane', cat: 'bg', name: 'Kütüphane', price: 70, bg: '<rect width="220" height="200" rx="26" fill="#6B4A33"/><g><rect x="10" y="16" width="200" height="6" fill="#4A3222"/><rect x="10" y="74" width="200" height="6" fill="#4A3222"/><rect x="10" y="132" width="200" height="6" fill="#4A3222"/></g><g><rect x="16" y="34" width="10" height="40" fill="#B91C1C"/><rect x="28" y="40" width="9" height="34" fill="#1D4ED8"/><rect x="39" y="30" width="11" height="44" fill="#15803D"/><rect x="52" y="38" width="8" height="36" fill="#E0B24F"/><rect x="150" y="36" width="10" height="38" fill="#7C3AED"/><rect x="162" y="30" width="12" height="44" fill="#B91C1C"/><rect x="176" y="40" width="9" height="34" fill="#0F766E"/><rect x="187" y="34" width="11" height="40" fill="#1D4ED8"/><rect x="16" y="94" width="11" height="38" fill="#0F766E"/><rect x="29" y="100" width="9" height="32" fill="#E0B24F"/><rect x="180" y="96" width="12" height="36" fill="#15803D"/><rect x="194" y="102" width="9" height="30" fill="#B91C1C"/></g><rect y="160" width="220" height="40" rx="0" fill="#8B5E3C"/>' },
    { id: 'bg-gunbatimi', cat: 'bg', name: 'Gün batımı', price: 55, bg: '<defs><linearGradient id="gbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F59E0B"/><stop offset="1" stop-color="#DB2777"/></linearGradient></defs><rect width="220" height="200" rx="26" fill="url(#gbg)"/><circle cx="110" cy="150" r="40" fill="#FDE68A" opacity=".8"/><path d="M0 165 Q110 150 220 165 V200 H0 Z" fill="#7C2D12" opacity=".7"/>' },
    // --- yeni şapkalar
    { id: 'fiyonk', cat: 'head', name: 'Pembe fiyonk', price: 10, svg: '<path d="M0 0 C-10 -14 -26 -10 -22 2 C-20 10 -8 6 0 0 Z M0 0 C10 -14 26 -10 22 2 C20 10 8 6 0 0 Z" fill="#F472B6" stroke="#DB2777" stroke-width="1.5"/><circle r="5" fill="#DB2777"/>' },
    { id: 'takke', cat: 'head', name: 'Beyaz takke', price: 25, svg: '<path d="M-17 6 Q-17 -15 0 -15 Q17 -15 17 6 Z" fill="#FAFAF5" stroke="#D6D3C4" stroke-width="2"/><path d="M-13 -2 h26 M-10 -8 h20" stroke="#E2DFCF" stroke-width="2"/>' },
    { id: 'kulaklik', cat: 'head', name: 'Ders kulaklığı', price: 35, svg: '<path d="M-24 14 C-26 -18 26 -18 24 14" fill="none" stroke="#1F2937" stroke-width="6" stroke-linecap="round"/><rect x="-32" y="6" width="14" height="20" rx="6" fill="#EF4444"/><rect x="18" y="6" width="14" height="20" rx="6" fill="#EF4444"/>' },
    { id: 'kovboy', cat: 'head', name: 'Kovboy şapkası', price: 50, svg: '<path d="M-36 6 Q-30 -2 -18 2 L18 2 Q30 -2 36 6 Q20 14 0 12 Q-20 14 -36 6 Z" fill="#92400E"/><path d="M-16 4 Q-18 -22 -6 -20 Q0 -14 6 -20 Q18 -22 16 4 Z" fill="#B45309"/><rect x="-16" y="-3" width="32" height="5" fill="#451A03"/>' },
    // --- yeni gözlükler
    { id: 'kalpg', cat: 'face', name: 'Kalp gözlük', price: 25, svg: '<path d="M0 11 C-15 0 -13 -12 -5 -12 C-2 -12 0 -9 0 -7 C0 -9 2 -12 5 -12 C13 -12 15 0 0 11 Z" fill="#EF4444" fill-opacity=".9"/><path d="M12 -2 h10 M-12 -4 L-22 -7" stroke="#B91C1C" stroke-width="3" stroke-linecap="round"/>' },
    { id: 'monokl', cat: 'face', name: 'Monokl', price: 40, svg: '<circle r="11" fill="#fff" fill-opacity=".2" stroke="#B7862B" stroke-width="3"/><path d="M-6 10 q-6 14 4 24 q6 6 2 14" fill="none" stroke="#B7862B" stroke-width="1.6"/>' },
    // --- yeni boyun eşyaları
    { id: 'kravat', cat: 'neck', name: 'Mavi kravat', price: 20, svg: '<path d="M-6 -4 h12 l-2 8 h-8 z" fill="#1D4ED8"/><path d="M-4 4 h8 l5 26 l-9 8 l-9 -8 z" fill="#2563EB"/><path d="M-3 12 l7 7 M-5 21 l9 9" stroke="#93C5FD" stroke-width="2"/>' },
    { id: 'kolye', cat: 'neck', name: 'Çiçek kolye', price: 30, svg: '<path d="M-20 -8 Q0 14 22 -10" fill="none" stroke="#4D7C0F" stroke-width="2.5"/><g><circle cx="-16" cy="-1" r="5" fill="#FDE047"/><circle cx="-6" cy="5" r="5" fill="#F472B6"/><circle cx="5" cy="5" r="5" fill="#FDE047"/><circle cx="15" cy="-1" r="5" fill="#A78BFA"/><circle cx="-16" cy="-1" r="1.8" fill="#fff"/><circle cx="-6" cy="5" r="1.8" fill="#fff"/><circle cx="5" cy="5" r="1.8" fill="#fff"/><circle cx="15" cy="-1" r="1.8" fill="#fff"/></g>' },
    { id: 'can', cat: 'neck', name: 'Altın çan', price: 35, svg: '<path d="M-20 -8 Q0 8 22 -10" fill="none" stroke="#B91C1C" stroke-width="5" stroke-linecap="round"/><path d="M-8 6 Q-8 -4 0 -4 Q8 -4 8 6 L10 14 L-10 14 Z" fill="#E0B24F" stroke="#B7862B" stroke-width="1.5"/><circle cy="16" r="3" fill="#B7862B"/>' },
    // --- yeni sırt eşyaları
    { id: 'battaniye', cat: 'body', name: 'Ekose örtü', price: 30, svg: '<path d="M-34 -6 Q0 -16 34 -6 L30 26 Q0 34 -30 26 Z" fill="#15803D"/><path d="M-20 -10 L-18 30 M0 -12 L0 32 M20 -10 L18 30 M-33 6 Q0 -2 33 6 M-31 18 Q0 26 31 18" stroke="#FDE047" stroke-width="3" fill="none" opacity=".8"/>' },
    { id: 'canta', cat: 'body', name: 'Sırt çantası', price: 50, svg: '<rect x="-20" y="-26" width="40" height="38" rx="10" fill="#0F766E"/><rect x="-14" y="-6" width="28" height="14" rx="5" fill="#115E59"/><path d="M-8 -26 q8 -10 16 0" stroke="#134E4A" stroke-width="4" fill="none"/><path d="M16 -14 L34 4" stroke="#134E4A" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="-14" r="3" fill="#FDE047"/>' },
    { id: 'heybe', cat: 'body', name: 'Kitap heybesi', price: 60, svg: '<path d="M-34 -6 Q0 -16 34 -6 L32 2 Q0 -6 -32 2 Z" fill="#7C2D12"/><rect x="-6" y="-14" width="7" height="22" rx="1.5" fill="#1D4ED8" transform="rotate(-8)"/><rect x="2" y="-12" width="7" height="20" rx="1.5" fill="#B91C1C" transform="rotate(6)"/><rect x="-14" y="-10" width="6" height="18" rx="1.5" fill="#15803D"/><path d="M-22 0 h44 v20 q0 10 -10 10 h-24 q-10 0 -10 -10 z" fill="#A16207"/><path d="M-22 8 h44" stroke="#713F12" stroke-width="3"/><circle cx="0" cy="12" r="3" fill="#FDE68A"/>' },
    { id: 'pelerin', cat: 'body', name: 'Kahraman pelerini', price: 80, svg: '<path d="M38 -16 C12 -22 -28 -10 -46 22 C-34 32 -14 28 -2 36 C10 26 26 22 36 10 Z" fill="#DC2626"/><path d="M38 -16 C20 -12 -6 0 -22 26" stroke="#991B1B" stroke-width="2" fill="none"/><circle cx="36" cy="-14" r="5" fill="#E0B24F"/>' },
    // --- yanında duran eşyalar
    { id: 'kalem', cat: 'prop', name: 'Kurşun kalem', price: 10, svg: '<g transform="rotate(-12)"><rect x="-22" y="-7" width="36" height="7" rx="1" fill="#FACC15"/><path d="M14 -7 L24 -3.5 L14 0 Z" fill="#F5D0A9"/><path d="M21 -4.5 L24 -3.5 L21 -2.5 Z" fill="#1F2937"/><rect x="-26" y="-7" width="5" height="7" rx="1.5" fill="#F472B6"/></g>' },
    { id: 'kahve', cat: 'prop', name: 'Sıcak kahve', price: 15, svg: '<path d="M-10 -18 h20 l-2 18 h-16 z" fill="#F5F5F4" stroke="#A8A29E" stroke-width="1.5"/><path d="M10 -14 q8 0 6 7 q-2 4 -7 3" fill="none" stroke="#A8A29E" stroke-width="2.5"/><path d="M-4 -24 q-3 -5 0 -9 M3 -24 q-3 -5 0 -9" stroke="#A8A29E" stroke-width="2" fill="none" stroke-linecap="round"/><rect x="-10" y="-13" width="20" height="4" fill="#92400E" opacity=".6"/>' },
    { id: 'saksi', cat: 'prop', name: 'Saksı çiçeği', price: 20, svg: '<path d="M-10 -14 h20 l-3 14 h-14 z" fill="#C2410C"/><rect x="-12" y="-17" width="24" height="5" rx="2" fill="#9A3412"/><path d="M0 -17 v-14" stroke="#15803D" stroke-width="2.5"/><ellipse cx="-6" cy="-24" rx="6" ry="3" fill="#22C55E" transform="rotate(-30 -6 -24)"/><ellipse cx="6" cy="-28" rx="6" ry="3" fill="#22C55E" transform="rotate(30 6 -28)"/><circle cx="0" cy="-35" r="5" fill="#F472B6"/><circle cx="0" cy="-35" r="2" fill="#FDE047"/>' },
    { id: 'kitaplar', cat: 'prop', name: 'Kitap yığını', price: 25, svg: '<rect x="-18" y="-8" width="36" height="8" rx="1.5" fill="#1D4ED8"/><rect x="-15" y="-16" width="32" height="8" rx="1.5" fill="#B91C1C"/><rect x="-17" y="-24" width="30" height="8" rx="1.5" fill="#15803D"/><path d="M-14 -4 h28 M-11 -12 h24 M-13 -20 h22" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>' },
    { id: 'lamba', cat: 'prop', name: 'Masa lambası', price: 35, svg: '<ellipse cx="0" cy="-2" rx="12" ry="3.5" fill="#374151"/><path d="M0 -3 L-6 -26 L6 -38" stroke="#4B5563" stroke-width="3" fill="none" stroke-linejoin="round"/><path d="M2 -44 L18 -36 L8 -26 Z" fill="#0F766E"/><path d="M12 -30 L22 -14 L4 -24 Z" fill="#FDE68A" opacity=".45"/>' },
    { id: 'rahle', cat: 'prop', name: 'Rahle ve kitap', price: 60, svg: '<path d="M-16 0 L10 -26 M16 0 L-10 -26" stroke="#7C4A21" stroke-width="5" stroke-linecap="round"/><path d="M-14 -24 Q0 -32 0 -26 Q0 -32 14 -24 L14 -20 Q0 -28 0 -22 Q0 -28 -14 -20 Z" fill="#FDF6E3" stroke="#7C4A21" stroke-width="1.5"/><path d="M-10 -24 h7 M3 -24 h7" stroke="#A8A29E" stroke-width="1.2"/>' },
    // --- yeni yele renkleri
    { id: 'yele-pembe', cat: 'mane', name: 'Pembe yele', price: 30, mane: 'pembe' },
    { id: 'yele-yesil', cat: 'mane', name: 'Yeşil yele', price: 30, mane: 'yesil' },
    { id: 'yele-gumus', cat: 'mane', name: 'Gümüş yele', price: 60, mane: 'gumus' },
    // --- yeni tüy rengi
    { id: 'tuy-benekli', cat: 'coat', name: 'Benekli at', price: 90, coat: 'benekli' },
    // --- yeni arka planlar
    { id: 'bg-deniz', cat: 'bg', name: 'Deniz kenarı', price: 40, bg: '<rect width="220" height="200" rx="26" fill="#BAE6FD"/><circle cx="180" cy="36" r="15" fill="#FDE68A"/><path d="M0 120 H220 V160 H0 Z" fill="#38BDF8"/><path d="M0 128 q20 -6 40 0 t40 0 t40 0 t40 0 t40 0 t40 0" stroke="#E0F2FE" stroke-width="3" fill="none"/><path d="M0 160 Q110 146 220 160 V200 H0 Z" fill="#FDE68A"/>' },
    { id: 'bg-kis', cat: 'bg', name: 'Karlı kış', price: 45, bg: '<rect width="220" height="200" rx="26" fill="#CBD5E1"/><g fill="#fff"><circle cx="24" cy="30" r="3"/><circle cx="70" cy="56" r="2.5"/><circle cx="120" cy="22" r="3"/><circle cx="196" cy="48" r="2.5"/><circle cx="160" cy="80" r="2"/><circle cx="40" cy="96" r="2.5"/><circle cx="96" cy="100" r="2"/></g><path d="M0 162 Q110 140 220 162 V200 H0 Z" fill="#F8FAFC"/>' },
    { id: 'bg-sinif', cat: 'bg', name: 'Sınıf tahtası', price: 60, bg: '<rect width="220" height="200" rx="26" fill="#FEF3C7"/><rect x="18" y="16" width="184" height="96" rx="6" fill="#14532D" stroke="#92400E" stroke-width="6"/><text x="28" y="48" font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="#F8FAFC">AGS 2027</text><text x="28" y="70" font-family="Arial, sans-serif" font-size="12" fill="#D9F99D">Hedef: 80 net</text><path d="M28 80 h46" stroke="#F8FAFC" stroke-width="2" opacity=".6"/><rect y="164" width="220" height="36" fill="#B45309"/>' },
    { id: 'bg-istanbul', cat: 'bg', name: 'İstanbul akşamı', price: 90, bg: '<defs><linearGradient id="gbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#312E81"/><stop offset=".6" stop-color="#F97316"/><stop offset="1" stop-color="#FDBA74"/></linearGradient></defs><rect width="220" height="200" rx="26" fill="url(#gbg)"/><g fill="#1E1B4B" opacity=".85"><path d="M20 150 h180 v50 H20 z"/><path d="M70 150 q40 -46 80 0 z"/><rect x="58" y="96" width="5" height="54"/><path d="M58 96 l2.5 -12 l2.5 12 z"/><rect x="157" y="96" width="5" height="54"/><path d="M157 96 l2.5 -12 l2.5 12 z"/><path d="M40 150 q12 -18 24 0 z M156 150 q12 -18 24 0 z"/><rect x="108" y="96" width="4" height="10"/></g>' }
  ];
  const CATS = { head: 'Şapkalar', face: 'Gözlükler', neck: 'Boyun', body: 'Sırt', prop: 'Yanında', mane: 'Yele rengi', coat: 'Tüy rengi', bg: 'Arka plan' };
  const item = (id) => ITEMS.find((x) => x.id === id);
  const coatOf = (look) => COATS[(item(look.coat) || {}).coat] || COATS.kestane;
  const maneOf = (look) => MANES[(item(look.mane) || {}).mane] || MANES.koyu;

  // ------------------------------------------------------------ çizim
  const EAR = { happy: -6, ok: 0, worried: 20, sad: 46, sleep: 34, angry: -34 };

  function eye(mood, g) {
    if (mood === 'happy') return `<path d="M150 69 Q158 58 166 69" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M152 63 l-4 -4 M157 60 l-1 -5" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
    if (mood === 'sleep') return `<path d="M150 67 Q158 75 166 67" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/><path d="M151 70 l-4 3 M156 73 l-2 4" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
    let e = `<ellipse cx="158" cy="68" rx="8.5" ry="10.5" fill="#fff"/><circle cx="160" cy="${mood === 'sad' ? 72 : 70}" r="6" fill="#3B2412"/><circle cx="162.5" cy="${mood === 'sad' ? 69 : 67}" r="2" fill="#fff"/><path d="M150 61 l-4 -3" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
    if (mood === 'worried') e += `<path d="M148 55 l19 -6" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    if (mood === 'angry') e += `<path d="M146 50 l22 10" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/><path d="M149 60 L167 66 L167 58 Q158 54 149 56 Z" fill="url(#${g}c)"/>`;
    if (mood === 'sad') e += `<path d="M149 62 Q158 56 167 61 L167 65 Q158 60 149 66 Z" fill="url(#${g}c)"/><path d="M148 55 l20 -5" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    return e;
  }
  function mouth(mood) {
    if (mood === 'happy') return `<path d="M174 98 Q184 109 194 97" fill="#7A2E2E" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M180 102 q4 3 8 0" fill="#E77" />`;
    if (mood === 'sad') return `<path d="M176 103 Q184 96 192 102" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    if (mood === 'worried') return `<path d="M177 101 q4 -3 7 0 q4 3 7 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
 if (mood === 'angry') return `<rect x="173" y="96" width="20" height="8" rx="3" fill="#fff" stroke="${INK}" stroke-width="2.5"/><path d="M178 96 v8 M183 96 v8 M188 96 v8" stroke="${INK}" stroke-width="1.5"/>`;
    if (mood === 'sleep') return `<path d="M178 100 h11" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
    return `<path d="M176 99 Q184 105 192 99" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;
  }
  function extras(mood) {
    if (mood === 'happy') return `<g fill="#E0B24F"><path d="M30 52l4 9 9 4-9 4-4 9-4-9-9-4 9-4z"/><path d="M200 22l3 6 6 3-6 3-3 6-3-6-6-3 6-3z"/></g>`;
    if (mood === 'sleep') return `<g fill="${INK}" font-family="Arial, sans-serif" font-weight="700"><text x="172" y="40" font-size="22">Z</text><text x="190" y="24" font-size="15">z</text><text x="202" y="14" font-size="11">z</text></g>`;
    if (mood === 'worried') return `<path d="M188 46 q-6 10 0 14 q6-4 0-14z" fill="#7CC4E8"/>`;
    if (mood === 'sad') return `<path d="M158 82 q-5 9 0 12 q5 -3 0 -12z" fill="#7CC4E8"/>`;
    if (mood === 'angry') return `<g fill="none" stroke="#DC2626" stroke-width="4" stroke-linecap="round"><path d="M186 30 q6 6 0 12 M196 30 q-6 6 0 12 M185 36 h12" /></g><g fill="#E5E7EB" opacity=".9"><circle cx="204" cy="84" r="6"/><circle cx="212" cy="76" r="4.5"/><circle cx="216" cy="66" r="3"/></g>`;
    return '';
  }
  function place(cat, svg) { const [x, y] = ANCHOR[cat]; return `<g transform="translate(${x} ${y})${cat === 'prop' ? ' scale(1.45)' : ''}">${svg}</g>`; }

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
    ${c.spots ? `<g fill="${c.spots}" opacity=".85"><circle cx="62" cy="122" r="6"/><circle cx="76" cy="138" r="4.5"/><circle cx="56" cy="142" r="4"/><circle cx="86" cy="120" r="3.5"/><circle cx="70" cy="110" r="3"/><circle cx="92" cy="146" r="3"/></g>` : ''}
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
    ${mood === 'angry' ? '<ellipse cx="154" cy="72" rx="31" ry="27" transform="rotate(14 154 72)" fill="#DC2626" opacity=".18"/>' : ''}
    ${wear('face')}
    ${wear('neck')}
    ${wear('head')}
  </g>
  ${wear('prop')}
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
