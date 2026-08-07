# Generator Soal Bangun Ruang (Jaring-jaring → Bangun Ruang)

Aplikasi web untuk membuat soal penalaran figural bertipe *"bangun ruang yang dapat
dibentuk dari jaring-jaring berikut adalah …"*. Pengguna memilih bangun ruang dan
jaring-jaringnya, mengisi gambar tiap sisi, lalu program otomatis menghasilkan:

- gambar bangun ruang 3D hasil pelipatan,
- pilihan jawaban **A–E** (1 benar, 4 pengecoh yang dijamin mustahil),
- **kunci jawaban** beserta penjelasan singkat tiap pengecoh.

## Menjalankan

Tidak perlu instalasi, server, atau koneksi internet. Cukup buka **`index.html`**
dengan peramban (Chrome, Edge, atau Firefox). Seluruh tampilan dirancang muat dalam
satu layar tanpa perlu digulir (diuji pada 1366×768 dan 1440×960).

## Bangun ruang yang didukung

| Bangun | Sisi | Orientasi sah | Jaring-jaring |
|---|---|---|---|
| Kubus | 6 | 24 | **11** |
| Balok (ukuran bisa diatur) | 6 | 4 | 54 |
| Prisma segitiga | 5 | 6 | **9** |
| Prisma segienam | 8 | 12 | 60+ |
| Limas segiempat | 5 | 4 | **8** |
| Limas segitiga (bidang empat) | 4 | 12 | **2** |

Angka jaring-jaring yang ditebalkan cocok dengan hasil baku matematika — daftarnya
**dihitung program**, bukan digambar manual, jadi tidak ada yang terlewat.

## Alur pemakaian

1. **Pilih bangun ruang.** Untuk balok, panjang/lebar/tinggi bisa diubah; jaring-jaring
   dan grup simetrinya langsung dihitung ulang.
2. **Pilih jaring-jaring** dari galeri, atau tekan *Acak jaring*. Khusus kubus dan
   balok tersedia mode **Papan** untuk menyusun jaring-jaring sendiri (program
   memberi tahu apakah susunan itu benar-benar bisa dilipat).
3. **Isi sisi.** Klik sebuah sisi pada gambar jaring-jaring (atau pada deretan sisi),
   lalu atur jenis gambar, warna, dan arah putarannya. *Isi bernomor* mengisi
   otomatis — untuk kubus/balok memakai aturan sisi berhadapan berjumlah 7.
4. **Periksa pratinjau.** Bangun 3D bisa diseret untuk diputar bebas 360° ke segala
   arah (atas, bawah, kiri, kanan) tanpa batas.
5. **Buat soal.** Pilih tingkat kesulitan lalu tekan *Buat soal*. Tombol A–E di bawah
   lembar soal bisa diklik untuk mengecek jawaban beserta alasannya.
6. **Simpan.** Unduh PNG/SVG, atau kumpulkan beberapa soal ke bank soal lalu
   *Cetak / simpan PDF* (halaman terakhir berisi kunci jawaban).

Pilihan terakhir tersimpan otomatis di peramban.

## Cara kerja & jaminan kebenaran

**Jaring-jaring dihitung, bukan digambar.** Program mencacah semua pohon rentang dari
graf ketetanggaan sisi, lalu "membuka" bangun ruang sepanjang pohon itu: tiap sisi
diputar rata ke bidang gambar terhadap rusuk yang dipakai bersama. Hasil yang saling
tumpang tindih dibuang, dan yang sebenarnya sama (hanya beda putaran/pencerminan)
digabungkan lewat grup simetri penuh bangun tersebut. Karena pembukaan itu isometri,
posisi **dan arah gambar** pada tiap sisi ikut terbawa dengan benar.

**Grup simetri dihitung sendiri.** Untuk setiap pasangan (sisi tujuan, rusuk), program
menyusun matriks rotasi/pencerminan lalu menguji apakah seluruh titik sudut kembali
menempati posisi titik sudut. Hasilnya persis seperti teori: kubus 24 rotasi (48 dengan
pencerminan), prisma segitiga 6 (12), limas segitiga beraturan 12 (24), dan seterusnya.

**Pilihan jawaban.** Kunci diambil dari salah satu orientasi sah. Setiap calon pengecoh
dibandingkan terhadap **seluruh** orientasi sah; jika tampilannya cocok dengan salah
satunya, calon itu dibuang karena sebenarnya benar. Antar pilihan juga tidak boleh
kembar. Jenis pengecoh:

| Jenis | Kesalahan yang ditampilkan |
|---|---|
| `hidden` | sisi yang seharusnya tersembunyi ikut tampak |
| `duplicate` | satu gambar muncul di dua sisi |
| `swap` | dua sisi tertukar posisinya |
| `spin` | arah gambar pada satu sisi diputar keliru |

Tingkat kesulitan hanya mengubah urutan prioritas keempat strategi di atas.

**Simetri gambar.** Perbandingan memakai `Art.visualKey()` yang memperhitungkan simetri
putar tiap gambar: orde 0 (sama dari segala arah — lingkaran, cincin, mata dadu 1),
4 (tiap 90°), 2 (tiap 180°), 1 (tak simetri). Ini penting sejak ada sisi segitiga,
karena di sana simetri bangun menghasilkan putaran 120° — tanpa penanganan itu,
lingkaran yang diputar 120° akan dikira gambar yang berbeda dan bisa melahirkan
"pengecoh" yang sebenarnya identik dengan kunci.

**Sudut pandang otomatis.** Untuk prisma dan limas, program memindai ratusan sudut lalu
memilih yang memperlihatkan sisi terbanyak dengan luas paling seimbang, sehingga tidak
ada sisi yang tampak setipis garis.

Setiap soal juga melewati `Quiz.audit()` sebelum ditampilkan; kalau sampai ada lebih
dari satu pilihan yang sah, peringatan muncul di atas lembar soal.

## Struktur berkas

```
index.html          antarmuka (tata letak 3 kolom, satu layar)
css/style.css       tampilan + aturan cetak
js/solids.js        definisi bangun ruang, grup simetri, pembukaan & pencacahan jaring
js/geometry.js      pelipatan jaring-jaring papan (mode susun sendiri, kubus/balok)
js/art.js           pustaka gambar sisi + aturan simetri
js/render.js        penggambar SVG (bangun ruang 3D & jaring-jaring)
js/quiz.js          pembuat pilihan A–E + pemeriksa mandiri
js/app.js           perekat antarmuka
```

Berkas `solids.js`, `geometry.js`, `art.js`, `render.js`, dan `quiz.js` bisa dipakai
ulang di Node.js (`require`) untuk membuat soal secara massal tanpa antarmuka.

## Catatan

- Jika semua sisi digambar sama, pengecoh tidak mungkin dibuat — program memberi
  peringatan dan mengurangi jumlah pilihan, bukan menampilkan soal yang ambigu.
- Ekspor PNG dibuat pada resolusi 2×. Bila peramban memblokirnya, program otomatis
  beralih ke SVG.
- Tabung, kerucut, dan bola belum didukung: sisinya melengkung sehingga tidak punya
  grup rotasi berhingga, dan soal "sisi mana yang tampak bersamaan" tidak berlaku.
