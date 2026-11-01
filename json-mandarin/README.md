# JSON Mandarin dari gambar

Hasil konversi 23 gambar pada `img/1` sampai `img/13`: **13 file JSON, total 236 kartu**.

Setiap file merupakan array kartu dengan format:

```json
[
  {
    "front": "便宜",
    "hint": "Murah",
    "back": "piányí"
  }
]
```

- `front`: hanzi dari kolom 中文.
- `hint`: arti dari kolom Indonesia / Bahasa Indonesia.
- `back`: pinyin dari kolom Pinyin / Hanyu Pinyin.

Nama file memakai dua digit agar tetap terurut 01–13. Semua gambar dalam satu folder digabung ke satu file JSON, berdasarkan urutan nama file; baris tiap gambar dibaca dari atas ke bawah.

Hanzi dan isi kosakata dipertahankan sesuai sumber. Kapitalisasi pinyin dinormalkan menjadi huruf kecil, dan spasi/tanda kurung dirapikan. Tanda nada tetap dipertahankan; materi tidak dikoreksi atau diterjemahkan ulang. Entri 高興 muncul dua kali dalam gambar folder 9 dan keduanya tetap disertakan.

| Folder sumber | File hasil | Gambar | Kartu |
| --- | --- | ---: | ---: |
| `img/1` | [01.json](01.json) | 2 | 23 |
| `img/2` | [02.json](02.json) | 1 | 8 |
| `img/3` | [03.json](03.json) | 2 | 24 |
| `img/4` | [04.json](04.json) | 2 | 24 |
| `img/5` | [05.json](05.json) | 1 | 10 |
| `img/6` | [06.json](06.json) | 2 | 16 |
| `img/7` | [07.json](07.json) | 2 | 19 |
| `img/8` | [08.json](08.json) | 2 | 22 |
| `img/9` | [09.json](09.json) | 2 | 15 |
| `img/10` | [10.json](10.json) | 2 | 24 |
| `img/11` | [11.json](11.json) | 2 | 15 |
| `img/12` | [12.json](12.json) | 1 | 12 |
| `img/13` | [13.json](13.json) | 2 | 24 |
| **Total** | **13 file** | **23** | **236** |

## Memakai di website

Semua file sudah dimuat otomatis sebagai deck bawaan **Mandarin — Materi 01–13**, dengan part bernomor 01 sampai 13. Tidak perlu upload ulang. Setelah deploy ke Vercel, materi ini tersedia di semua perangkat; progres belajar tetap tersimpan di browser masing-masing.

Untuk mengubah materi bawaan bagi semua pengunjung, edit file JSON yang sesuai, lalu build/deploy ulang website. Untuk membuat salinan pribadi, buka deck pribadi, pilih **Tambah part**, beri nama part, lalu unggah file JSON sesuai nomor. Salinan pribadi hanya tersimpan di browser yang digunakan.
