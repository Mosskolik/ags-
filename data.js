/* Varsayılan ders ve konu verileri.
 * Soru sayıları (weight) tahminidir; Ayarlar > Dersler bölümünden
 * ÖSYM'nin güncel kılavuzuna göre düzenlenebilir. */
window.DEFAULT_SUBJECTS = [
  // ---- AGS (80 soru, 6 alt test) ----
  {
    id: 'sozel', group: 'ags', name: 'Sözel Yetenek', short: 'Sözel', weight: 15, color: '#c2410c',
    topics: ['Sözcükte anlam', 'Cümlede anlam', 'Paragrafta ana düşünce / yardımcı düşünce',
      'Paragraf oluşturma ve tamamlama', 'Anlatım biçimleri ve düşünceyi geliştirme yolları',
      'Sözel mantık ve akıl yürütme', 'Yazım ve noktalama']
  },
  {
    id: 'sayisal', group: 'ags', name: 'Sayısal Yetenek', short: 'Sayısal', weight: 15, color: '#1d4ed8',
    topics: ['Temel kavramlar ve sayılar', 'Bölme - bölünebilme, EBOB-EKOK', 'Rasyonel ve ondalık sayılar',
      'Üslü ve köklü sayılar', 'Oran - orantı', 'Sayı, kesir ve yaş problemleri',
      'Yüzde, kâr-zarar, faiz problemleri', 'İşçi, hız ve karışım problemleri', 'Kümeler ve fonksiyonlar',
      'Permütasyon, kombinasyon, olasılık', 'Sayısal mantık', 'Tablo ve grafik yorumlama', 'Temel geometri']
  },
  {
    id: 'tarih', group: 'ags', name: 'Tarih', short: 'Tarih', weight: 10, color: '#a16207',
    topics: ['İslamiyet öncesi Türk tarihi', 'İlk Türk-İslam devletleri', 'Osmanlı kuruluş ve yükselme',
      'Osmanlı kültür ve medeniyeti', 'Osmanlı duraklama, gerileme, dağılma', 'XX. yüzyıl başlarında Osmanlı',
      'Kurtuluş Savaşı hazırlık ve cepheler', 'Atatürk ilke ve inkılapları',
      'Atatürk dönemi iç ve dış politika', 'Çağdaş Türk ve dünya tarihi']
  },
  {
    id: 'cografya', group: 'ags', name: 'Türkiye Coğrafyası', short: 'Coğrafya', weight: 8, color: '#15803d',
    topics: ['Coğrafi konum', 'Yer şekilleri', 'İklim ve bitki örtüsü', 'Nüfus ve yerleşme',
      'Tarım ve hayvancılık', 'Madenler ve enerji kaynakları', 'Sanayi, ulaşım, ticaret, turizm',
      'Bölgeler ve doğal afetler']
  },
  {
    id: 'egitim', group: 'ags', name: 'Eğitimin Temelleri ve Türk Millî Eğitim Sistemi', short: 'Eğitim', weight: 24, color: '#7c3aed',
    topics: ['Eğitimin felsefi ve sosyolojik temelleri', 'Gelişim psikolojisi', 'Öğrenme psikolojisi',
      'Öğretim ilke ve yöntemleri', 'Öğretim programları ve program geliştirme', 'Ölçme ve değerlendirme',
      'Rehberlik ve psikolojik danışma', 'Özel eğitim ve kaynaştırma', 'Sınıf yönetimi',
      'Öğretim teknolojileri', 'Türk eğitim tarihi', 'Türk Millî Eğitim Sistemi: amaçlar, ilkeler, yapı']
  },
  {
    id: 'mevzuat', group: 'ags', name: 'Mevzuat', short: 'Mevzuat', weight: 8, color: '#be123c',
    topics: ['T.C. Anayasası: genel esaslar ve temel haklar', '1739 Millî Eğitim Temel Kanunu',
      '222 İlköğretim ve Eğitim Kanunu', '657 Devlet Memurları Kanunu', '7528 Öğretmenlik Meslek Kanunu',
      'MEB teşkilat ve görevleri', 'Okul öncesi / ilköğretim kurumları yönetmeliği',
      'Ortaöğretim kurumları yönetmeliği', 'Çocuk hakları ve insan hakları belgeleri']
  },
  // ---- ÖABT Din Kültürü ve Ahlak Bilgisi (50 soru) ----
  {
    id: 'tib', group: 'oabt', name: 'Temel İslam Bilimleri', short: 'TİB', weight: 26, color: '#0f766e',
    topics: ['Kur’an-ı Kerim okuma ve tecvit', 'Tefsir ve Kur’an ilimleri', 'Hadis ve hadis usulü',
      'Fıkıh ve fıkıh usulü', 'Kelam ve akaid', 'İslam mezhepleri tarihi', 'Siyer',
      'İslam tarihi ve medeniyeti', 'Tasavvuf']
  },
  {
    id: 'felsefe', group: 'oabt', name: 'Felsefe ve Din Bilimleri', short: 'Din Bil.', weight: 14, color: '#4338ca',
    topics: ['İslam felsefesi', 'Din felsefesi', 'Dinler tarihi', 'Din psikolojisi', 'Din sosyolojisi',
      'İslam ahlakı ve ahlak felsefesi']
  },
  {
    id: 'alanegitimi', group: 'oabt', name: 'Alan Eğitimi (DKAB Öğretimi)', short: 'Alan Eğt.', weight: 10, color: '#9333ea',
    topics: ['Din eğitimi: temel kavramlar ve tarih', 'DKAB öğretim programları',
      'DKAB’de öğretim yöntem ve teknikleri', 'Değerler eğitimi', 'Ölçme-değerlendirme (DKAB)',
      'Din öğretiminde materyal ve teknoloji']
  },
  // ---- Yüksek lisans ----
  {
    id: 'tez', group: 'yl', name: 'Tez Çalışması', short: 'Tez', weight: 0, color: '#334155',
    topics: ['Konu ve problem cümlesi', 'Literatür taraması', 'Tez önerisi', 'Etik kurul başvurusu',
      'Veri toplama aracı', 'Veri toplama', 'Veri analizi', 'Bulgular ve yorum', 'Tartışma ve sonuç',
      'Biçimsel kontrol ve teslim']
  },
  {
    id: 'yldersler', group: 'yl', name: 'Yüksek Lisans Dersleri', short: 'YL Ders', weight: 0, color: '#64748b',
    topics: ['Haftalık okumalar', 'Ödevler', 'Sunumlar', 'Ara sınav / final hazırlığı']
  }
];

window.GROUPS = {
  ags: { name: 'AGS', desc: 'Akademi Giriş Sınavı' },
  oabt: { name: 'ÖABT', desc: 'Din Kültürü ve Ahlak Bilgisi alan bilgisi' },
  yl: { name: 'Yüksek Lisans', desc: 'İlahiyat — Din Eğitimi' }
};

window.TOPIC_STATUS = [
  { id: 0, label: 'Başlanmadı', short: '—' },
  { id: 1, label: 'Çalışılıyor', short: '◐' },
  { id: 2, label: 'Bitti', short: '✓' },
  { id: 3, label: 'Tekrar edildi', short: '★' }
];

window.DEFAULT_YL_TASKS = [
  { title: 'Tez konusu için danışmanla görüşme', type: 'tez' },
  { title: 'Literatür taraması: 20 kaynak oku ve not al', type: 'tez' },
  { title: 'Tez önerisi taslağı', type: 'tez' }
];

window.QUOTES = [
  '“Rabbim, ilmimi artır.” (Tâhâ, 114)',
  'Az ama her gün çalışmak, çok ama ara sıra çalışmaktan iyidir.',
  'Bugün yaptığın tek bir blok bile seriyi korur.',
  '“İnsan için ancak çalıştığının karşılığı vardır.” (Necm, 39)',
  'Yanlışlarını sev — en çok onlardan öğrenirsin.',
  'Deneme sınavı bir yargı değil, bir haritadır.',
  'Önce zor dersi, sonra kolay olanı çalış.',
  'Mola da çalışmanın bir parçasıdır.'
];
