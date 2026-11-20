# Hedef AGS — Kişisel Çalışma Koçu

AGS (Akademi Giriş Sınavı) + ÖABT Din Kültürü ve Ahlak Bilgisi sınavına hazırlanırken
aynı zamanda İlahiyat / Din Eğitimi yüksek lisansı yapanlar için hazırlanmış çalışma koçu.
**Telefonda ve bilgisayarda** çalışır, ana ekrana uygulama gibi kurulur, **internetsiz** de açılır.

## Neler yapar?

| Bölüm | Ne işe yarar |
|---|---|
| **Bugün** | Koç mesajları (kaç gün kaldı, dünkü performans, odak ders, ihmal edilen ders, teslim tarihleri), bugünün blokları, bugünkü tekrarlar |
| **Program** | Haftalık programı otomatik oluşturur: ders ağırlığı × zayıflık (konu ilerlemesi + doğru oranı + deneme netleri). Dönem bazlı: Temel kurulum → Pekiştirme → Son düzlük. Bloklar düzenlenebilir, takvime (.ics) aktarılabilir |
| **Çalış** | Pomodoro sayacı (arka planda sayar), bitince doğru/yanlış girişi, elle kayıt |
| **Konular** | AGS + ÖABT + tez adımları; her konu için durum. Biten konular **aralıklı tekrara** (1-3-7-14-30 gün) girer |
| **Denemeler** | AGS / ÖABT netleri (D − Y/4), test bazında gelişim grafiği. Her deneme programı yeniden ayarlar |
| **Yüksek Lisans** | Tez yol haritası, ders/ödev/makale görevleri ve teslim tarihleri |
| **Analiz** | 14 günlük çalışma/hedef grafiği, ders bazında süre payı vs. ideal pay, doğru oranları, haftalık rapor ve **haftalık değerlendirme** (cevaplarına göre programı hafifletir/artırır) |
| **Rehber** | Çalışma yöntemleri, AGS ve ÖABT stratejisi, tez önerileri, motivasyon |
| **Ayarlar** | Sınav tarihi, günlük saatler, yüksek lisans payı, hatırlatıcılar, ders ağırlıkları, yedekleme |

## Hatırlatıcılar
- **Bildirimler:** sabah planı, akşam kontrolü, her blok başlangıcı (uygulama açıkken/arka plandayken).
- **Kesin alarm için:** Program → *Takvime aktar*. İnen `.ics` dosyasını telefonun takvimine ekle;
  her blok için 10 dk önce ve her akşam alarm çalar — uygulama kapalı olsa bile.

## Telefona / bilgisayara kurulum
1. GitHub'da depo → **Settings → Pages → Source: GitHub Actions** seç (bir kez).
2. `main` dalına birleştirince (ya da Actions sekmesinden çalıştırınca) site yayınlanır:
   `https://mosskolik.github.io/ags-/`
3. **Android / Chrome:** menü → *Ana ekrana ekle / Uygulamayı yükle*.
   **iPhone / Safari:** Paylaş → *Ana Ekrana Ekle* (bildirimler için gerekli).
   **Bilgisayar (Chrome/Edge):** adres çubuğundaki *Yükle* simgesi.

## Veriler
Tüm veriler cihazında (tarayıcıda) tutulur; hesap/sunucu yok. Telefon ↔ bilgisayar arasında
taşımak için Ayarlar → *Yedeği indir* / *Yedeği yükle*.

> Tarihler ÖSYM 2027 takviminden: AGS 8 Mayıs 2027, ÖABT 9 Mayıs 2027, başvuru 19-29 Mart 2027 (geç başvuru 6 Nisan), sonuç 11 Haziran 2027.
> Soru dağılımları tahminidir; ÖSYM'nin güncel AGS/ÖABT kılavuzuna göre Ayarlar'dan düzenleyin.

## Geliştirme
Derleme gerekmez — düz HTML/CSS/JS. Yerelde: `python3 -m http.server` ve `http://localhost:8000`.
