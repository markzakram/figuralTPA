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
| **Bangun tak beraturan** | 8–11 | 1–2 | ~10 per bentuk |

Angka jaring-jaring yang ditebalkan cocok dengan hasil baku matematika — daftarnya
**dihitung program**, bukan digambar manual, jadi tidak ada yang terlewat.

Tersedia **32 jenis gambar sisi**: mata dadu 1–6, huruf/angka, wajik, papan catur,
bingkai, segitiga, panah, bintang, hati, bulan sabit, zigzag, segilima, segienam,
dan lainnya — masing-masing dengan 9 pilihan warna gambar dan warna latar.


## Bangun tak beraturan

Selain kesembilan bangun baku, tersedia **bangun tak beraturan** yang dipakai
**polos tanpa pola sisi** — yang diuji adalah bentuknya, bukan gambar pada sisinya.
Cocok untuk tipe B, C, dan D (tipe A butuh gambar sisi untuk membedakan orientasi,
jadi pada paket campuran tipe A otomatis dialihkan).

Bentuknya dibangkitkan, bukan digambar manual, dari **empat keluarga**:

| Keluarga | Cara dibuat | Hasilnya |
|---|---|---|
| poliomino | 3–7 petak yang menempel, tepinya ditelusuri jadi penampang, lalu diekstrusi | profil L, V, T, U, balok bertakik |
| poliomino terpangkas | satu sudut siku dipotong tepat satu petak | bentuk dengan bidang miring |
| penampang cembung | poligon cembung acak 4–6 sisi, lalu diekstrusi | prisma trapesium, segilima/segienam tak beraturan |
| limas terpancung | dua poligon sejajar berbeda ukuran + sisi trapesium | limas terpotong, jaringnya berbentuk kipas |

Keempat keluarga bersama menghasilkan **471 bangun berbeda dari 365 penampang**,
masing-masing dengan ~8 jaring-jaring — sekitar **3.740 pasangan bentuk × jaring**.
Jumlah sisinya menyebar dari 6 sampai 11.

**Garis lipatan digambar putus-putus.** Rusuk yang dimiliki dua sisi adalah garis
lipatan; yang hanya dimiliki satu sisi adalah tepi luar. Karena itu rusuk digambar
pada lapisan tersendiri, bukan per sisi, sehingga keduanya bisa dibedakan seperti
pada gambar jaring-jaring yang lazim.

Pola putusnya **dipaskan pada tiap rusuk**: jumlah strip dibulatkan dari panjang
rusuk, lalu panjang stripnya disesuaikan supaya garis selalu mulai dan berakhir
dengan strip. Dengan satu pola tetap untuk semua rusuk, rusuk pendek hanya kebagian
dua-tiga strip panjang dan di kertas terbaca sebagai garis patah yang tidak rapi.
Panjang stripnya juga dikecilkan dari 0,16 menjadi 0,075 kali skala gambar.

**Bangunnya dijaga rebah, bukan menjulang.** Tebal ekstrusi ditahan di bawah lebar
penampang (median tinggi:lebar 0,68; tidak ada yang melebihi 1,0). Sebelumnya tebal
bisa 1,3 kali penampang dan bangunnya terlihat seperti tiang.

**Tata letak jaringnya bervariasi lewat titik tempel tutupnya.** Kedua tutup bisa
menempel pada sisi tegak mana saja, dan tiap bentuk punya 6–12 tata letak pita utuh
yang berbeda. Tata letak *pita terputus* (jaring L/T) masih dibangkitkan tetapi
selalu dipakai paling akhir — lihat "Jaring tidak melengkung" di bawah. Sudut pandang
3D dipilih acak (berbenih) di antara pose yang sama bagusnya, supaya seratus soal
tidak tampak dari sudut yang sama.

Tiap bentuk punya nomor benih; benih yang sama selalu menghasilkan bentuk yang sama,
dan tombol *Acak bentuk* mengambil benih baru.

Tiga batasan menjaga agar bentuknya tetap **terbaca**, karena bentuk acak yang
terlalu bebas menghasilkan gambar yang tidak bisa dibayangkan lipatannya:

| Batasan | Alasan |
|---|---|
| kotak pembatas penampang maksimal 4 petak, minimal 2 petak | penampang yang menjulur panjang membuat sisi tegaknya setipis garis |
| penampang cembung: rusuk terpendek ≥ 0,42 kali terpanjang, kotak pembatas tidak gepeng | penampang gepeng membuat bangunnya tampak seperti kartu tipis |
| pemangkasan sudut tepat satu petak | rusuk miringnya jadi sepanjang akar 2, lebih panjang daripada rusuk terpendek, jadi tidak pernah lahir bilah tipis |
| penampang 6–8 rusuk | penampang berusuk 10+ berbentuk seperti sisir bergigi: di gambar 3D terbaca sebagai tumpukan bilah dan pita jaringnya memanjang jadi belasan kotak sempit |
| tebal ekstrusi 0,40–1,03 kali penampang | kalau terlalu tipis, pita jaringnya memanjang seperti penggaris dan kedua tutupnya tampak kecil |

**Jaring-jaringnya memakai tata letak pita.** Sisi tegak dibuka lurus menjadi satu
pita mendatar, lalu kedua tutup ditempelkan pada sisi tegak yang dipilih — bentuk
jaring prisma yang lazim di buku pelajaran. Pohon rentang acak (yang dipakai bangun
lain) menghasilkan jaring yang menjalar menyerong dan sangat sulit dibayangkan
lipatannya. Bangun baku tetap dicacah lengkap agar jumlah jaring bakunya tidak
berkurang. Sudut pandang 3D-nya juga mengutamakan sisi terbesar — yaitu penampangnya —
supaya profilnya langsung terbaca.

### Jaring tidak melengkung kalau bangunnya tidak menirus

Pita sisi tegak boleh melengkung **hanya** kalau bangunnya memang menirus. Tiga hal
yang dulu membuat jaring bangun bersudut siku pun terbaca membelok:

| Penyebab | Ukurannya | Tindakan |
|---|---|---|
| tata letak **pita terputus** (jaring L/T) | pita berbelok 15–25° | pita utuh selalu didahulukan; setiap bentuk punya minimal 6 tata letak pita utuh, cukup untuk lima pilihan |
| **prisma miring** (sisi tegaknya jajar genjang) | pita menyerong 9–28° | kemiringan dihapus — tiap sisi tegak mendapat sudut serong yang berbeda sehingga pitanya berkelok |
| **limas terpancung** | kipas 60° (maks 89°) | ketirusan dirapatkan ke 0,68–0,88 sehingga kipasnya tinggal 41° (maks 73°) |

Kelengkungan yang tersisa hanya milik limas terpancung, dan di situ memang tidak
terhindarkan: selimut limas terpancung sungguh-sungguh membuka menjadi kipas.
Karena itu **jaring melengkung tidak pernah dicampur dengan jaring lurus dalam satu
soal** — bangun kotak yang berpengecoh jaring kipas bisa dicoret tanpa membayangkan
lipatannya sama sekali, dan sebaliknya. Diperiksa `campur.js`: dari 360 soal polos,
0% yang tercampur.

Tiga bagian mesin harus diperbaiki agar bangun **cekung** tertangani benar:

| Bagian | Cara lama (hanya sah untuk bangun cembung) | Cara sekarang |
|---|---|---|
| Arah normal sisi | "normal menjauhi pusat bangun" | urutan simpul diseragamkan lewat rusuk bersama, arah keluar ditentukan tanda volume |
| Tumpang tindih saat membuka jaring | SAT (sumbu pemisah) | perpotongan rusuk + uji titik-dalam-poligon |
| Titik dalam sisi (kotak gambar) | uji tanda hasil kali silang | pancaran sinar, plus penyisiran kisi bila pusat kotak jatuh di luar sisi |

Penggambaran juga berubah: sisi yang tampak kini **diurutkan menurut kedalaman**,
karena pada bangun bertakik dua sisi yang sama-sama menghadap penonton bisa saling
menutupi. Pencacahan jaring-jaring beralih ke **pengambilan pohon rentang acak**
(berbenih tetap, jadi tetap dapat diulang) ketika ruang kombinasinya melewati 2×10⁵ —
tanpa itu satu bentuk bersisi 11 butuh 2,6 detik; sekarang 18 milidetik.

**Pengecoh untuk bangun polos** tidak bisa dibuat dengan menukar gambar. Karena itu
tipe B mengambil jaring-jaring milik bangun lain yang **susunan sisinya berbeda**.
Jaminannya bersifat pasti tanpa perlu mencoba melipat: hasil lipatan sebuah
jaring-jaring selalu punya kumpulan sisi yang sama persis dengan jaring itu, jadi
jaring milik bangun dengan kumpulan sisi berbeda mustahil membentuk bangun pada soal.

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
| Variasi: *Acak bentuk tak beraturan* | tiap soal memakai bentuk tak beraturan yang baru — sama seperti menekan *Acak bentuk* untuk setiap nomor |
| Variasi: *Acak gambar + bangun ruang* | bangun ruang ikut berganti-ganti antar soal |
| Variasi: *Ikuti isian sekarang* | semua soal memakai isian yang sedang tampil |
| Tipe: *Ikuti pilihan di atas* | satu tipe soal untuk seluruh paket |
| Tipe: *Campuran semua tipe* | keempat tipe soal dipakai bergantian |

Bentuk jaring-jaring juga diacak dari daftar jaring bangun tersebut, sehingga soal
yang berdekatan tidak memakai bentuk yang sama. Untuk paket 100 soal dengan variasi
*Acak bentuk tak beraturan*, sekitar 50 bentuk kunci yang berbeda akan muncul. Tombol *Acak* pada editor punya
centang **Warna tetap**: gambar tiap sisi diacak tetapi warna gambar dan warna
latarnya dipertahankan.

## Format PDF

Mengikuti format PDF generator *diagrammatical*: halaman **1440 × 810 pt**
(20 × 11,25 inci, 16:9) dan **empat halaman per soal**:

1. **Judul** — nomor soal, tipe soal, dan tingkat kesulitan (berwarna).
2. **Gambar soal** — jaring-jaring atau bangun ruang, tergantung tipe.
3. **Pilihan A–E**.
4. **Kunci & pembahasan** — gambar bernomor di kiri, uraian di kanan.

### Pembahasan bernomor

Halaman keempat menampilkan ulang **gambar soal dan opsi jawaban yang benar**,
lengkap dengan **nomor sisi** yang sama pada keduanya. Nomor 1..k diberikan pada
sisi yang terlihat di gambar soal, urut dari kiri ke kanan; sisi yang tersembunyi
menyusul. Uraiannya lalu menunjuk nomor itu, misalnya:

> Pada opsi D, posisi sisi 2 (bintang) dan sisi 3 (wajik) tertukar. Ketika
> jaring-jaring dilipat, kedua sisi tersebut tidak akan berada pada posisi yang
> sama dengan bangun ruang pada soal.

Bulatan nomor selalu diletakkan **di luar** sisinya dengan garis penunjuk pendek
yang berujung di dalam sisi tersebut. Ditaruh di dalam, bulatan sebesar itu pasti
menutupi corak pada sisi yang kecil — padahal corak itulah yang harus dibaca.
Penempatnya menguji jarak bulatan ke setiap sisi, jadi tidak ada nomor yang
menimpa gambar atau menimpa nomor lain.

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

**Pengecoh dipilih yang paling MIRIP dengan kunci.** Pengecoh berupa limas untuk soal
prisma langsung tercoret penjawab tanpa perlu berpikir, jadi soalnya jadi terlalu mudah.
Kandidat kini diurutkan menurut jarak kemiripan — selisih jumlah sisi, selisih daftar
luas sisi, selisih daftar bentuk sisi, dan kesamaan susunan bangun datar — lalu diambil
secara acak dari sekumpulan yang paling dekat. Hasilnya untuk bangun tak beraturan:
**100% pengecoh berjumlah sisi sama dengan kunci**, dan jarak kemiripan rata-rata turun
dari 17,8 (bentuk sembarang) menjadi 0,94. Untuk soal kubus, kolam pembanding memuat
beberapa balok berperbandingan berbeda agar pengecohnya tetap berdekatan.

Kedua sidik bentuk itu disimpan pada objek bangunnya karena pemilih pengecoh
memanggilnya ratusan kali per soal.

**Simetri gambar.** Perbandingan memakai `Art.visualKey()` yang memperhitungkan simetri
putar tiap gambar: orde 0 (sama dari segala arah — lingkaran, cincin, mata dadu 1),
4 (tiap 90°), 2 (tiap 180°), 1 (tak simetri). Ini penting sejak ada sisi segitiga,
karena di sana simetri bangun menghasilkan putaran 120° — tanpa penanganan itu,
lingkaran yang diputar 120° akan dikira gambar yang berbeda dan bisa melahirkan
"pengecoh" yang sebenarnya identik dengan kunci.

**Sudut pandang otomatis.** Untuk prisma dan limas, program memindai ratusan sudut lalu
memilih yang memperlihatkan sisi terbanyak dengan luas paling seimbang, sehingga tidak
ada sisi yang tampak setipis garis. Dua penjaga tambahan mencegah bangunnya tampak
gepeng: imbalan jumlah sisi **dijenuhkan di lima**, dan sudut pandang yang membuat
siluetnya memanjang lebih dari 2,1 kali kena denda. Tanpa keduanya, bangun bertakik
zigzag terpilih dari sudut yang memamerkan tujuh sisi sekaligus — semuanya menjadi
bilah tipis berderet dan bentuk ruangnya justru hilang. Setelah diperbaiki, tidak ada
satu pun dari 200 bentuk acak yang siluetnya melewati rasio 2,1 (median 1,24).

**Ambang keterbacaan.** Sebuah sisi baru dihitung "terlihat" kalau luas bayangannya
minimal **0,30 kali** sisi terlebar (`AMBANG_TAMPAK` di `solids.js`). Angka ini
menentukan sisi mana yang dipakai menilai benar-salahnya pilihan, jadi ia harus
sejalan dengan apa yang benar-benar bisa dibaca orang. Ketika ambangnya masih 0,22,
sisi samping balok jatuh di 0,23 — cukup tipis sehingga dua pilihan yang berbeda
datanya bisa tampak sama persis di kertas, dan soalnya jadi berkunci ganda.
Proporsi balok pun diubah (lebar 0,8 → 1,1) supaya sisi sampingnya kembali ke 0,31.
Diuji dengan `pembaca.js`: memodelkan pembaca yang hanya sanggup membaca sisi
≥ 0,30, 6.000 soal (termasuk bentuk acak) tidak ada satu pun yang berkunci ganda.

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
