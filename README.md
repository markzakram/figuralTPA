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

## Empat tipe soal

| Tipe | Soal | Pilihan A–E |
|---|---|---|
| **A** | jaring-jaring | bangun ruang 3D dengan susunan sisi berbeda |
| **B** | bangun ruang 3D | jaring-jaring (kebalikan dari tipe A) |
| **C** | jaring-jaring | bentuk bangun ruang yang berbeda-beda |
| **D** | bangun ruang 3D | bangun datar penyusunnya, mis. "3 persegi panjang + 2 segitiga" |

Tingkat kesulitan (mudah/sedang/sulit) berlaku untuk tipe A.

## Bangun ruang yang didukung

| Bangun | Sisi | Orientasi sah | Jaring-jaring |
|---|---|---|---|
| Kubus | 6 | 24 | **11** |
| Balok (ukuran bisa diatur) | 6 | 4 | 54 |
| Prisma segitiga | 5 | 6 | **9** |
| Prisma segilima | 7 | 10 | 99 |
| Prisma segienam | 8 | 12 | 200+ |
| Limas segiempat | 5 | 4 | **8** |
| Limas segilima | 6 | 5 | 15 |
| Limas segienam | 7 | 6 | 33 |
| Limas segitiga (bidang empat) | 4 | 12 | **2** |

Angka jaring-jaring yang ditebalkan cocok dengan hasil baku matematika — daftarnya
**dihitung program**, bukan digambar manual, jadi tidak ada yang terlewat.

Tersedia **32 jenis gambar sisi**: mata dadu 1–6, huruf/angka, wajik, papan catur,
bingkai, segitiga, panah, bintang, hati, bulan sabit, zigzag, segilima, segienam,
dan lainnya — masing-masing dengan 9 pilihan warna gambar dan warna latar.

## Alur pemakaian

1. **Pilih bangun ruang.** Untuk balok, panjang/lebar/tinggi bisa diubah; jaring-jaring
   dan grup simetrinya langsung dihitung ulang.
2. **Pilih jaring-jaring** dari galeri, atau tekan *Acak jaring*. Khusus kubus dan
   balok tersedia mode **Papan** untuk menyusun jaring-jaring sendiri (program
   memberi tahu apakah susunan itu benar-benar bisa dilipat).
3. **Isi sisi.** Klik sebuah sisi pada gambar jaring-jaring (atau pada deretan sisi),
   lalu atur jenis gambar, warna, dan arah putarannya. *Isi angka* mengisi
   otomatis — untuk kubus/balok memakai aturan sisi berhadapan berjumlah 7.
4. **Periksa pratinjau.** Bangun 3D bisa diseret untuk diputar bebas 360° ke segala
   arah (atas, bawah, kiri, kanan) tanpa batas.
5. **Buat soal.** Pilih tipe soal (dan tingkat kesulitan untuk tipe A) lalu tekan
   *Buat soal*. Tombol A–E di bawah lembar soal bisa diklik untuk mengecek jawaban
   beserta alasannya.
6. **Buat sepaket dan unduh PDF.** Isi *Jumlah* soal, pilih variasinya, tekan
   **Generate**, lalu **Unduh PDF**.

Pilihan terakhir tersimpan otomatis di peramban.

## Membuat banyak soal sekaligus

Panel *Buat banyak soal & unduh PDF* menerima jumlah soal (1–200) dengan dua pilihan
variasi:

| Pilihan | Arti |
|---|---|
| Variasi: *Acak gambar sisi* | tiap soal memakai gambar sisi baru, bangun ruangnya tetap |
| Variasi: *Acak gambar + bangun ruang* | bangun ruang ikut berganti-ganti antar soal |
| Variasi: *Ikuti isian sekarang* | semua soal memakai isian yang sedang tampil |
| Tipe: *Ikuti pilihan di atas* | satu tipe soal untuk seluruh paket |
| Tipe: *Campuran semua tipe* | keempat tipe soal dipakai bergantian |

Bentuk jaring-jaring juga diacak dari daftar jaring bangun tersebut, sehingga soal
yang berdekatan tidak memakai bentuk yang sama. Tombol *Acak* pada editor punya
centang **Warna tetap**: gambar tiap sisi diacak tetapi warna gambar dan warna
latarnya dipertahankan.

## Format PDF

Mengikuti format PDF generator *diagrammatical*: halaman **1440 × 810 pt**
(20 × 11,25 inci, 16:9) dan **empat halaman per soal**:

1. **Judul** — nomor soal, tipe soal, dan tingkat kesulitan (berwarna).
2. **Gambar soal** — jaring-jaring atau bangun ruang, tergantung tipe.
3. **Pilihan A–E**.
4. **Kunci & pembahasan** — jawaban benar, alasannya, dan satu baris untuk tiap
   pilihan yang salah.

PDF disusun langsung tanpa pustaka luar: gambar disisipkan sebagai XObject
`DeviceGray` bila hitam-putih (datanya sepertiga) atau `DeviceRGB` bila berwarna,
dipadatkan dengan `CompressionStream` bawaan peramban, dan teksnya memakai Helvetica
bawaan pembaca PDF sehingga tidak perlu disematkan. 30 soal ≈ 120 halaman ≈ 0,9 MB,
selesai dalam ~1,2 detik.

Tombol *Cetak* tetap ada untuk mencetak bank soal sebagai lembar A4 biasa (kunci
jawaban di halaman terakhir).

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

**Pilihan jawaban (tipe A).** Kunci diambil dari salah satu orientasi sah. Setiap calon
pengecoh dibandingkan terhadap **seluruh** orientasi sah; jika tampilannya cocok dengan
salah satunya, calon itu dibuang karena sebenarnya benar. Antar pilihan juga tidak boleh
kembar. Jenis pengecoh:

| Jenis | Kesalahan yang ditampilkan |
|---|---|
| `hidden` | sisi yang seharusnya tersembunyi ikut tampak |
| `duplicate` | satu gambar muncul di dua sisi |
| `swap` | dua sisi tertukar posisinya |
| `spin` | arah gambar pada satu sisi diputar keliru |

Tingkat kesulitan hanya mengubah urutan prioritas keempat strategi di atas.

**Pilihan jawaban (tipe B).** Sebuah jaring-jaring dinyatakan benar bila hasil lipatannya
**dapat diputar** sehingga tampak persis seperti gambar pada soal. Penilaian memakai sisi
yang terlihat saja — sisi tersembunyi memang tidak bisa dinilai oleh penjawab, jadi
menyalahkannya tidak adil. Pengecoh dibuat dengan menukar, menggandakan, atau memutar
gambar antar sisi, lalu diuji: kalau ternyata masih bisa dilipat menjadi gambar soal,
calon itu dibuang.

**Pilihan jawaban (tipe C & D).** Pengecoh diambil dari bangun ruang lain, tetapi yang
sidik bentuknya (tipe C) atau susunan bangun datarnya (tipe D) sama dengan kunci akan
dibuang — misalnya balok berukuran 1:1:1 tidak akan dijadikan pengecoh untuk soal kubus.

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
js/render.js        penggambar SVG (bangun ruang 3D, jaring-jaring, bangun datar)
js/quiz.js          pembuat pilihan A–E keempat tipe + pemeriksa mandiri
js/raster.js        SVG → piksel (untuk PDF) dan penyimpan berkas
js/pdf.js           penyusun PDF 1440×810, 4 halaman per soal, tanpa pustaka luar
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
