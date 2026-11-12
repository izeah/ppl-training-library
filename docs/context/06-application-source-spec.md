# PPL Training Library — Application Source Specification

## Tujuan produk
Aplikasi web mobile-first untuk membuka tab Push/Pull/Legs, memilih gerakan, lalu membaca panduan lengkap saat berada di gym.

## Navigasi
Tiga tab utama: Push, Pull, Legs. Tiap tab menampilkan ringkasan otot, jumlah gerakan, pencarian, filter target otot/peralatan/pola gerak, serta daftar gerakan.

## Schema data
```ts
type Exercise = {
  id: string;
  name: string;
  split: "Push" | "Pull" | "Legs";
  primaryMuscles: string[];
  secondaryMuscles: string[];
  sets: number | string;
  reps: string;
  restSeconds: number | string;
  equipment: string[];
  setupAndExecution: string[];
  techniqueCues: string[];
  safetyNotes: string[];
  alternatives: string[];
  imageQuery?: string;
  tutorialUrl: string;
  tutorialVideoId?: string; // hanya ID video yang telah diverifikasi
  tags?: string[];
};
```

## Detail UI wajib
- Nama gerakan dan gambar alat/posisi.
- Target otot utama dan pendukung.
- Set, reps, rest per set.
- Alat yang digunakan dan setup mesin.
- Langkah pelaksanaan gerakan.
- Cue teknik, kesalahan umum, keselamatan.
- Alternatif jika alat dipakai/tidak tersedia.
- Tutorial video atau link pencarian YouTube.
- Checklist set; tampilkan status selesai.

## Video
Embed iframe hanya jika satu video spesifik telah diverifikasi relevansi dan ID-nya. Untuk link pencarian, tampilkan tombol “Cari tutorial di YouTube”; jangan pura-pura embed video. Fallback ke URL biasa jika embed tidak didukung.

## Fitur lanjutan
- Log beban kg dan reps aktual per set.
- RIR per set dan catatan teknik.
- Timer rest otomatis.
- Riwayat sesi dan grafik progressive overload.
- Template program A/B.
- Penyimpanan persisten hanya jika backend/storage benar-benar diimplementasikan dan status penyimpanannya dijelaskan.

## UX dan keamanan
Mobile-first, tombol besar, kontras baik, informasi set/reps/rest terlihat tanpa scroll panjang, instruksi pendek bertahap. Beri label utama/alternatif/aksesori. Jangan menyatakan aplikasi menggantikan asesmen personal trainer. Jangan mengarang video ID, data beban, atau spesifikasi mesin yang tidak diketahui.

## Status source
Antarmuka sebelumnya adalah prototipe interaktif di ChatGPT, bukan source project React/HTML siap deploy. Dokumen ini menjadi spesifikasi dan basis konten untuk implementasi ulang pada framework pilihan. Implementasi production memerlukan keputusan framework, penyimpanan, hosting, dan pengaturan embed.
