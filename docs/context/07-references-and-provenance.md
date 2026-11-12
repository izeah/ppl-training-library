# Referensi dan Provenance

## Referensi yang pernah muncul di sesi
- SteelFit: artikel PPL yang pengguna jadikan referensi awal.
- StrengthLog: panduan rutinitas Push, Pull, dan Legs.
- Barbell Medicine: referensi pemrograman latihan dan latihan kaki.
- Gym Track: contoh rutinitas Push/Pull/Legs.
- BodySpec: panduan latihan kaki.
- NASM: pustaka demonstrasi gerakan, termasuk incline push-up.
- Legion Athletics: artikel latihan Push.
- Symmetric Strength: contoh Push A/Push B.
- Foundational Rehab: contoh PPL A/B.
- RAMM, SpoliaMag, ElevareFit, Acibadem: referensi tambahan yang muncul di hasil pencarian terdahulu.

Percakapan tidak menyimpan URL lengkap semua artikel tersebut. Jangan menebak URL artikel. Citation ID dari hasil web sebelumnya bukan URL permanen dan perlu dicari ulang sebelum kutipan formal.

## Video yang disebut eksplisit
- Jeff Nippard, “Best Push Workout (Chest, Shoulders & Triceps)”: https://www.youtube.com/watch?v=bvwg4D9UWGI (disebut terbit 27 Nov 2024 dalam sesi sebelumnya; verifikasi ulang sebelum embed).
- Jeremy Ethier, “The Best Science-Based PUSH Workout For Growth”: https://www.youtube.com/watch?v=FWDXsqHo14A
- Jeff Nippard, “The Ultimate PULL Workout For Muscle Growth”: https://www.youtube.com/watch?v=spKGN0XzErU (judul/ID perlu diverifikasi ulang sebelum embed).

## Sumber otoritatif untuk verifikasi lanjutan
- ACSM: https://www.acsm.org/
- NSCA: https://www.nsca.com/
- NASM: https://www.nasm.org/
- PubMed: https://pubmed.ncbi.nlm.nih.gov/
- Stronger by Science: https://www.strongerbyscience.com/

Jangan mengatribusikan klaim spesifik ke organisasi tersebut tanpa menemukan dokumen yang mendukung.

## Status tutorial latihan
Sebagian besar tautan pada katalog adalah pencarian YouTube berbasis nama gerakan, bukan video tunggal yang telah diperiksa. Gambar referensi dari percakapan adalah ilustrasi hasil pencarian gambar, bukan foto instruksi teknik tervalidasi. Untuk produksi, pilih video dari sumber instruktur yang kredibel, periksa kecocokan gerakan, lalu simpan ID video dan tanggal pemeriksaan.

## Batas provenance
- Referensi artikel tidak semuanya memiliki URL lengkap dalam konteks yang tersedia.
- Citation ID web dari percakapan sebelumnya tidak bisa dipakai sebagai sitasi lintas proyek.
- URL pencarian YouTube bukan embed video.
- Periksa ulang sumber dan tanggal sebelum mempublikasikan.

## Media detail latihan (diperbarui 12 November 2026)
- Foto posisi awal/akhir: free-exercise-db (github.com/yuhonas/free-exercise-db, lisensi Unlicense/domain publik), dikompres ke WebP di `public/exercises/<imageId>/`. Field `imageSource` mencatat nama latihan sumber; sebagian adalah gerakan serupa, bukan alat yang persis sama (mis. Machine Lateral Raise memakai foto Seated Side Lateral Raise).
- Video tutorial: satu video per latihan di `tutorialVideoId`. Setiap ID diverifikasi ke endpoint oEmbed YouTube (ada dan bisa di-embed) pada tanggal di `tutorialVideoChecked`; judul dan kanal disalin dari oEmbed. Kecocokan gerakan dinilai dari judul, kanal, dan durasi, bukan dari menonton tiap video penuh.
- Diagram otot: `react-body-highlighter` (MIT). Nama otot di `exercises.json` dipetakan ke slug diagram di `src/media.tsx`; supraspinatus, rotator cuff, dan stabilizer tidak bisa digambar dan hanya tampil sebagai label.
