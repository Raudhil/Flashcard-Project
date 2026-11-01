# Kartu — Flashcard

Website flashcard berbahasa Indonesia menggunakan **JavaScript, React, Vite, dan Tailwind CSS v4**. Tampilan cream dengan kartu pastel, garis tegas, serta mode terang/gelap mengikuti referensi.

## Materi bawaan untuk semua perangkat

Website menyertakan deck **Mandarin — Materi 01–13**, berisi **13 part dan 236 kartu** dari file `json-mandarin/01.json` sampai `13.json`. Format materi ini: **front = hanzi, hint = arti Indonesia, back = pinyin**. Urutan part mengikuti nomor file; pertanyaan dalam sesi belajar tetap diacak.

Materi diimpor langsung saat build, sehingga tersedia pada semua perangkat yang membuka hasil deployment Vercel tanpa perlu mengunggah ulang. Deck bawaan tersedia juga pada browser yang sudah memiliki data lama, tanpa menghapus deck pribadi maupun progresnya. **Tambah part dan upload JSON tetap tersedia di dalam deck bawaan.** Part yang ditambahkan disimpan di browser, dapat diedit/dihapus, dan tetap ada setelah refresh. Tiga belas part bawaan tetap tersedia untuk belajar dan tidak ditimpa oleh upload tambahan.

Untuk memperbarui materi bagi semua pengunjung, edit file di `json-mandarin`, push perubahan ke repository, lalu deploy ulang di Vercel. ID kartu bawaan ditentukan dari isi kartu agar progres tetap terkait dengan kartu yang sama jika urutannya berubah; kartu yang isinya berubah diperlakukan sebagai kartu baru.

**Upload atau pembuatan deck melalui website tetap bersifat lokal**, termasuk part tambahan di dalam deck bawaan. Perubahan tersebut hanya tersedia pada browser yang dipakai, dan tidak mengubah materi bawaan yang dibagikan ke perangkat lain. Ekspor deck bawaan akan menyertakan seluruh part bawaan beserta part tambahan untuk cadangan atau pemindahan manual.

## Menjalankan

Butuh Node.js 20.19+ atau 22.12+.

```bash
npm install
npm run dev
```

Di Windows PowerShell dengan execution policy terbatas, gunakan `npm.cmd` sebagai pengganti `npm`.

## Alur

1. Halaman utama menampilkan semua deck, pencarian, pengurutan, dan ringkasan progres.
2. Buat deck, pilih warna, lalu buka deck tersebut.
3. Tambahkan part: beri nama, tempel JSON atau unggah file `.json` (maksimal 5 MB).
4. Mulai belajar: urutan kartu langsung diacak, tanpa mengikuti urutan JSON. Kartu yang sudah dipahami tidak masuk antrean.
5. Klik kartu untuk melihat jawaban, lalu pilih **Paham** atau **Tidak paham** untuk maju. Tombol penilaian aktif setelah jawaban pernah dibuka.
6. **Paham** mengeluarkan kartu dari antrean dan menyimpan progres. **Tidak paham** menyisipkan kartu kembali pada posisi acak setelah setidaknya satu kartu lain. Jika hanya tersisa satu kartu, kartu itu langsung diulang.
7. Sesi selesai saat semua kartu dipahami. Tidak ada tombol atau pintasan sebelumnya/berikutnya untuk melewati kartu. Tab **Semua kartu** hanya menjadi daftar referensi, tanpa mengubah antrean atau progres.
8. Progres dipertahankan saat part dibuka lagi atau halaman dimuat ulang; kartu yang belum dipahami diacak kembali. Gunakan **Reset progres** untuk mengulang seluruh part.

Deck dan part dapat diedit atau dihapus. Penghapusan memerlukan konfirmasi. Mengedit JSON mempertahankan progres kartu yang front, hint, dan back-nya tidak berubah.

## Format JSON kartu

```json
[
  { "front": "你好", "hint": "nǐ hǎo", "back": "Halo" },
  { "front": "谢谢", "hint": "xiè xie", "back": "Terima kasih" },
  { "front": "Apa kepanjangan HTML?", "back": "HyperText Markup Language" }
]
```

`front` dan `back` wajib berupa teks. `hint` opsional. Alias `hanzi`, `pinyin`, dan `answer` juga diterima. Bisa menggunakan `{ "cards": [...] }`. Maksimal 2.000 kartu per part, 2.000 karakter per pertanyaan/jawaban.

## Ekspor dan impor deck

Tombol unduh dalam deck mengekspor seluruh part dan kartu. Tombol **Impor deck** di halaman utama membaca format berikut:

```json
{
  "name": "Mandarin sehari-hari",
  "description": "Kosakata dasar",
  "color": "pink",
  "parts": [
    {
      "name": "Salam",
      "cards": [{ "front": "你好", "hint": "nǐ hǎo", "back": "Halo" }]
    }
  ]
}
```

Warna: `pink`, `mint`, `purple`, `yellow`, `blue`. Maksimal 100 part per impor deck. Impor membuat deck baru, tanpa menimpa deck yang ada. Ekspor berisi konten, tanpa progres belajar.

## Penyimpanan

Materi bawaan dibaca dari paket website yang sama di semua perangkat. Deck pribadi, kartu yang diunggah melalui website, dan progres belajar disimpan di `localStorage` browser, tanpa login atau backend. Data pribadi bertahan setelah refresh, tetapi **tidak tersinkron antarperangkat/browser** dan dapat hilang jika data situs dihapus. Ekspor JSON untuk cadangan. Mode gelap mengikuti perangkat saat pertama kali digunakan dan menyimpan pilihan selanjutnya. Font Google memiliki fallback lokal jika tidak terhubung ke internet.

## Pintasan belajar

- `Space`: balik kartu
- `H`: tampilkan/sembunyikan hint
- `1`: Tidak paham, ulangi secara acak
- `2`: Paham, keluarkan dari antrean

Pintasan dinonaktifkan saat dialog terbuka atau fokus berada di kolom input. Penilaian dengan keyboard juga membutuhkan jawaban dibuka terlebih dahulu. Ketika fokus berada pada tombol, `Space` mengaktifkan tombol tersebut sesuai perilaku keyboard standar.

## Build dan verifikasi

```bash
npm test
npm run build
npm run preview
```

## Deploy ke Vercel

1. Upload proyek ini ke repository GitHub.
2. Di Vercel, pilih **Add New → Project**, lalu impor repository tersebut.
3. Framework: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Klik **Deploy**. Tidak membutuhkan environment variable, database, atau server tambahan.

Alternatif lewat Vercel CLI: jalankan `npx vercel` dari direktori proyek, lalu `npx vercel --prod` untuk produksi. Semua navigasi dikelola aplikasi pada `/`, sehingga tidak membutuhkan rewrite SPA.

Proyek sudah disiapkan untuk Vercel; deployment dilakukan melalui akun Vercel Anda.
