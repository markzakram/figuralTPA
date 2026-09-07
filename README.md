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

Bentuknya dibangkitkan, bukan digambar manual, dari **tujuh keluarga**:

| Keluarga | Cara dibuat | Hasilnya |
|---|---|---|
| poliomino | 3–7 petak yang menempel, tepinya ditelusuri jadi penampang, lalu diekstrusi; sebagian dipangkas satu atau dua sudut | profil L, V, T, U, balok bertakik, bidang miring |
| kisi segitiga (poliamond) | 3–6 segitiga sama sisi yang menempel, lalu diekstrusi | prisma trapesium 60°, jajar genjang, segienam, anak panah |
| templat klasik | rumah, anak panah, layang-layang, perahu, segidelapan, tanda panah, trapesium — dengan getaran ±6–15% dan pencerminan acak | bentuk yang dikenali sekilas |
| penampang cembung | poligon cembung acak 4–6 sisi, lalu diekstrusi | prisma trapesium, segilima/segienam tak beraturan |
| beratap miring | penampang dari tiga keluarga di atas, tutupnya diletakkan pada bidang condong | balok/prisma yang dipotong serong; sisi tegaknya trapesium berbeda tinggi |
| limas terpancung beraturan | alas segi-4/5/6 beraturan, tutup 68–88% alas | limas terpotong, jaringnya kipas |
| limas terpancung cembung | alas cembung acak, tutup diperkecil 68–88% | limas terpotong tak beraturan |

Semua keluarga kecuali dua limas terpancung adalah **prisma berusuk tegak sejajar**,
sehingga jaring pitanya membuka lurus — termasuk yang beratap miring, sebab tutup
yang berbeda luas tidak mengubah arah rusuk tegaknya. Ketujuh keluarga bersama
menghasilkan **527 bangun berbeda dari 395 penampang**, masing-masing dengan ~8
jaring-jaring — sekitar **4.140 pasangan bentuk × jaring**. Jumlah sisinya menyebar
dari 6 sampai 11.

**Semua hasil acak melewati satu penyaring keterbacaan yang sama** sebelum
dipakai; yang gagal diacak ulang (paling banyak delapan kali, lalu jatuh ke profil
L cadangan). Empat ukurannya dihitung dari geometri bangun mentah:

| Ukuran | Batas | Yang dicegah |
|---|---|---|
| luas sisi terkecil : terbesar | ≥ 0,15 | sisi setipis bilah yang tidak terbaca |
| sudut dihedral terkecil antar sisi bertetangga | ≥ 50° | tepi setajam pisau |
| rusuk terpendek : terpanjang | ≥ 0,22 | rusuk sependek titik |
| tebal : lebar kotak pembatas | ≥ 0,36 | bangun gepeng yang terbaca sebagai lempengan |

Diukur pada 400 bentuk: luas sisi terkecil paling rendah 0,19 kali sisi terbesar
(median 0,32–0,62 per keluarga), sudut dihedral terkecil 53°, dan tiap bentuk
memperlihatkan minimal 3 sisi pada pose terpilih.

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

**Jaring dengan pertemuan T dibuang.** Sudut sebuah petak yang jatuh di TENGAH rusuk
petak lain terbaca sebagai dua bidang yang saling menyilang; kalau sodokan itu
menutup mulut cerukan sebuah tutup, celah putih di dalamnya terbaca sebagai lubang
pada jaring. Petak yang bersentuhan sudut-ke-sudut tidak apa-apa — jaring kubus baku
pun begitu. Sebelum disaring, 4,0% jaring bangun tak beraturan punya pertemuan T;
sesudahnya 0%. Tidak ada bentuk yang kehabisan jaring: yang paling sedikit masih
menyisakan 10 dari 21, dan rata-rata per bentuk hanya turun dari 7,9 ke 7,5.

Empat dugaan lain sempat diukur dan ternyata BUKAN penyebabnya, jadi tidak ada aturan
yang ditambahkan untuk itu: tepi jaring yang bukan satu gelang (0 kasus), tindihan
petak pada raster bersama (0), petak yang terkurung selubung cembung petak lain (0),
dan teluk putih bermulut sempit (0).

Tiga batasan menjaga agar bentuknya tetap **terbaca**, karena bentuk acak yang
terlalu bebas menghasilkan gambar yang tidak bisa dibayangkan lipatannya:

| Batasan | Alasan |
|---|---|
| kotak pembatas penampang maksimal 4 petak, minimal 2 petak | penampang yang menjulur panjang membuat sisi tegaknya setipis garis |
| penampang cembung: rusuk terpendek ≥ 0,42 kali terpanjang, kotak pembatas tidak gepeng | penampang gepeng membuat bangunnya tampak seperti kartu tipis |
| pemangkasan sudut tepat satu petak | rusuk miringnya jadi sepanjang akar 2, lebih panjang daripada rusuk terpendek, jadi tidak pernah lahir bilah tipis |
| penampang 6–8 rusuk | penampang berusuk 10+ berbentuk seperti sisir bergigi: di gambar 3D terbaca sebagai tumpukan bilah dan pita jaringnya memanjang jadi belasan kotak sempit |
| tebal ekstrusi 0,40–1,03 kali penampang (0,50–0,95 untuk kisi segitiga dan templat yang penampangnya lebar; badan prisma beratap miring ≥ 0,55) | kalau terlalu tipis, pita jaringnya memanjang seperti penggaris dan kedua tutupnya tampak kecil |

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
Pengenalnya mengukur **kesejajaran rusuk tegak** (rusuk yang dimiliki dua sisi
tegak bertetangga), bukan selisih luas tutup — ukuran luas keliru menggolongkan
prisma beratap miring sebagai melengkung, padahal rusuk tegaknya sejajar dan
pitanya lurus (diukur: 0° untuk 176 prisma tegak dan 38 prisma beratap miring;
38° median untuk 46 limas terpancung).
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

### Pengecoh diturunkan dari bentuk kuncinya

Mengambil pengecoh dari bangun lain di kolam membuat soal bocor. Pada soal prisma
bertutup segidelapan, pengecoh berjumlah sisi sama pun tutupnya bisa berupa blok
bertakik — penjawab mencoretnya dari bentuk tutupnya saja, tanpa membayangkan
lipatan sama sekali.

Karena itu pengecoh kini **diturunkan dari bentuk kuncinya sendiri**: proporsinya
diubah, jenisnya tidak. Caranya penskalaan **afin** pada rangka tutup bangunnya —
dua arah dalam bidang tutup, satu arah sepanjang sumbu prisma. Peta afin membawa
bidang ke bidang, jadi semua sisi tetap datar dan jumlahnya tidak berubah; prisma
tegak tetap tegak, limas terpancung tetap menirus, yang beratap miring tetap miring.
Penskalaan seragam sengaja tidak dipakai — hasilnya sebangun dengan kuncinya dan
setelah digambar sesuai kotaknya akan tampak persis sama.

| | sebelum | sesudah |
|---|---|---|
| pengecoh berjumlah sisi sama dengan kunci | sebagian | **100%** |
| pengecoh bersusunan sisi sama persis | jarang | **91%** |

Bedanya ditahan di **dua sisi**. Batas bawah 20% (nisbah kotak pembatas): di bawah
itu kedua jaring nyaris kembar dan soalnya berubah jadi adu ketelitian mengukur,
bukan adu membayangkan lipatan. Batas atasnya datang dari resep penskalaannya
sendiri — sebarannya berhenti di sekitar 31%, jadi sekilas semuanya tetap
sekeluarga. Bangun yang bukan prisma tidak punya turunan; di situ kolam bentuk lain
tetap dipakai sebagai cadangan.

Karena susunan sisinya kini hampir selalu sama, pembahasan pengecoh tidak lagi bisa
menyebut "susunannya berbeda". Yang dibandingkan sekarang proporsinya — tinggi pita
sisi tegak terhadap lebar tutup, keseragaman rusuk tutup, dan kelonjongan tutupnya —
diukur dari geometri, bukan dari cara pengecohnya dibuat. **99%** pengecoh menyebut
satu beda yang konkret, misalnya "sisi tegaknya lebih pendek dibanding lebar
tutupnya".

**Pengecoh untuk bangun polos** tidak bisa dibuat dengan menukar gambar. Karena itu
tipe B mengambil jaring-jaring milik bangun lain yang **susunan sisinya berbeda**.
Jaminannya bersifat pasti tanpa perlu mencoba melipat: hasil lipatan sebuah
jaring-jaring selalu punya kumpulan sisi yang sama persis dengan jaring itu, jadi
jaring milik bangun dengan kumpulan sisi berbeda mustahil membentuk bangun pada soal.

### Tipe soal tidak boleh berubah sendiri di tengah paket

Bangun tak beraturan dipakai **polos**, jadi tipe A (jaring-jaring → bangun ruang)
tidak punya bahan pengecoh sama sekali untuknya. Dulu pengalihan tipenya ditulis
langsung ke elemen `<select>` dan menempel permanen: satu bentuk tak beraturan di
nomor 7 membuat 93 soal sisanya ikut berbalik arah menjadi bangun ruang →
jaring-jaring. Sekarang:

- tipe ditetapkan **ulang untuk tiap nomor**, tidak diwarisi dari nomor sebelumnya;
- pada tipe A, bentuk polos **tidak ikut diundi** sama sekali;
- kalau pengalihan tetap terjadi (variasi "Acak bentuk" memang selalu memakai bentuk
  polos), jumlahnya **dilaporkan di baris status**, tidak diam-diam;
- tipe tiap soal ikut tertulis di daftar bank soal, sehingga penyimpangan langsung terlihat.

Bangun polos juga tidak lagi mewarisi corak bangun sebelumnya: berpindah dari kubus
bercorak ke bangun tak beraturan bersisi enam dulu membawa serta mata dadunya.

Diperiksa dari 16 kombinasi variasi × tipe (masing-masing 9 soal) dan sekali paket
100 soal penuh: 100/100 halaman judul PDF menyebut tipe yang benar, 100/100 halaman
pembahasan memakai arah kalimat yang sesuai.

## Tidak ada soal yang benar-benar kembar

Saat membuat banyak soal sekaligus, tiap soal disidik dari **pertanyaannya DAN
kumpulan pilihannya**. Sidik pilihan diurutkan lebih dulu, jadi dua soal yang isinya
sama dan hanya berbeda urutan huruf tetap dikenali kembar. Yang kembar dibuat ulang
(paling banyak 12 kali); pertanyaan yang sama dengan kumpulan pilihan berbeda tetap
diterima, karena itu memang soal lain.

Diuji pada kasus paling rawan — tipe D dengan bangun dan corak yang sama sekali tidak
diacak, sehingga ruang kemungkinannya sempit: dari 60 soal, 8 kembar dibuat ulang dan
hasil akhirnya 60 lembar soal yang seluruhnya berbeda. Pemeriksaannya mandiri:
membandingkan SVG lembar soal setelah id-nya dinormalkan, bukan memakai sidik yang
sama dengan penjaganya.

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
6. **Buat sepaket dan unduh.** Isi *Jumlah* soal, pilih variasinya, tekan
   **Generate**, lalu **Unduh PDF** (siap cetak) atau **Unduh Word** (siap sunting).

Pilihan terakhir tersimpan otomatis di peramban.

## Membuat banyak soal sekaligus

Panel *Buat banyak soal & unduh* menerima jumlah soal (1–200) dengan dua pilihan
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
4. **Kunci & pembahasan** — gambar bernomor di kiri, uraian di kanan. Berkas Word
   memakai susunan yang sama.

### Mengapa kuncinya benar, bukan hanya mengapa yang lain salah

Pembahasan dibuka dengan alasan pilihan yang BENAR, baru menyusul alasan tiap
pengecoh. Kalimatnya bukan pernyataan kosong ("opsi C dapat dilipat menjadi bangun
pada soal") melainkan bukti yang bisa ditelusuri sendiri di gambar, dan seluruhnya
dihitung dari geometri bangunnya:

| Soal | Bukti yang disebut |
|---|---|
| bercorak | sisi terlihat mana yang bertemu di satu titik sudut (diperiksa lewat simpul bersama), pasangan mana yang bersebelahan, dan sisi mana yang melipat ke bagian tersembunyi beserta lawan seberangnya |
| polos | susunan sisinya, jumlah sisi tegak yang berderet dalam satu pita, dan cara kedua tutup bertemu saat pita dilipat melingkar |

Klaim "bertemu di satu titik sudut" hanya ditulis kalau memang ada simpul yang
dimiliki semua sisi itu; kalau tidak, yang ditulis rantai "sisi 1 bersebelahan
dengan sisi 2" saja.

### Warna sisi untuk bangun polos

Bangun tak beraturan dipakai tanpa corak, jadi pada gambar pembahasannya tidak ada
apa pun yang bisa ditelusuri mata dari jaring-jaring ke bangun ruangnya. Karena itu
**sisinya diwarnai**: warna yang sama menandai sisi yang sama pada kedua gambar,
berpasangan dengan nomor yang sama. Satu warna cukup ditelusuri untuk melihat ke
mana sebuah petak jaring-jaring melipat. Nadanya sengaja muda supaya garis hitam dan
bulatan nomor tetap terbaca di atasnya. Gambar soal dan gambar pilihan tetap polos —
yang diwarnai hanya gambar pembahasan.

### Pembahasan selalu muat pada halamannya

Sejak pembahasan memuat alasan kunci DAN alasan tiap pengecoh, panjangnya hampir
dua kali lipat: pada ukuran tetap 20 pt bagian akhirnya terpotong di tepi bawah.
Ukuran huruf badan kini **dicoba dari 20 pt turun ke 13 pt** dan yang dipakai adalah
yang terbesar yang masih muat; kalau satu kolom tetap kurang, teksnya dipecah
menjadi **dua kolom** (halaman ini lebar 1440 pt, jadi dua kolom masih lega).
Berkas Word memakai ukuran yang sama lewat , supaya kedua
berkas terbaca serupa.

Diperiksa dari PDF jadinya — koordinat tiap baris teks dibaca kembali dari perintah
`Tm` pada aliran halaman, bukan dari penghitung yang menyusunnya:

| | sebelum | sesudah |
|---|---|---|
| halaman pembahasan yang teksnya keluar halaman | 9 dari 9 | **0 dari 48** |
| baris terjauh di bawah tepi | 90 pt | — |
| ukuran huruf badan | 20 pt tetap | 16-20 pt menyesuaikan |

Kasus terberat (prisma segienam, delapan sisi, pembahasan terpanjang) muat pada
16 pt dalam satu kolom. Di Word, 0 dari 12 sel pembahasan melewati tepi bawah.

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
menimpa gambar atau menimpa nomor lain: nomor ditempatkan berurutan, dan setiap
bulatan yang sudah terpasang ikut menjadi rintangan bagi nomor berikutnya — tanpa
itu dua nomor bisa memperebutkan celah yang sama pada jaring yang rapat.

PDF disusun langsung tanpa pustaka luar: gambar disisipkan sebagai XObject
`DeviceGray` bila hitam-putih (datanya sepertiga) atau `DeviceRGB` bila berwarna,
dipadatkan dengan `CompressionStream` bawaan peramban, dan teksnya memakai Helvetica
bawaan pembaca PDF sehingga tidak perlu disematkan. 30 soal ≈ 120 halaman ≈ 0,9 MB,
selesai dalam ~1,2 detik.

Tombol *Cetak* tetap ada untuk mencetak bank soal sebagai lembar A4 biasa (kunci
jawaban di halaman terakhir).

## Format Word (.docx)

Tombol **Unduh Word** menghasilkan berkas yang bisa langsung disunting: kalimatnya
diubah, gambarnya dipindahkan, atau nomornya disusun ulang. Susunannya **mengikuti
PDF** — halaman **1440 × 810 pt** (28800 × 16200 twip, 16:9) dan **empat halaman per
soal** — sehingga berkas Word dan PDF dari bank soal yang sama terbaca serupa.
Halaman pembahasannya memakai tabel dua kolom tanpa garis: gambar bernomor di kiri,
uraian di kanan, sama seperti PDF.

### Kerangka dokumen

Judulnya memakai **gaya judul sungguhan**, bukan sekadar teks tebal, sehingga Google
Docs dan Word menampilkan daftar isi/kerangka dokumen di panel samping:

| Teks | Gaya | Tingkat kerangka |
|---|---|---|
| `No. 1` | Heading 1 | 0 |
| `Jawaban: B` | Heading 2 | 1 |
| `Pembahasan:` | Heading 3 | 2 |

Yang membuatnya dikenali bukan ukuran hurufnya, melainkan `word/styles.xml` yang
mendefinisikan gaya dengan nama baku (`heading 1`, …) dan `w:outlineLvl`. Ukuran
hurufnya disamakan dengan PDF: 45 pt, 30 pt, dan 22 pt.

### Penyusunnya ditulis sendiri, tanpa pustaka luar

Sebuah `.docx` adalah arsip ZIP berisi XML, jadi `js/docx.js` bekerja dua lapis:
penulis ZIP di bawah (header lokal, direktori pusat, EOCD, CRC-32, deflate mentah
lewat `CompressionStream`) dan penyusun WordprocessingML di atasnya. Gambar
disematkan sebagai **PNG** — format gambar yang dipahami Word — dan ukuran tampilnya
ditetapkan dalam EMU agar muat pada halaman tanpa bergantung pada dugaan dpi.

Berbeda dari PDF yang teksnya harus Latin-1, Word menyimpan teks sebagai **UTF-8**
sehingga tanda panah pada "Jaring-jaring → bangun ruang" tetap tertulis sebagaimana
adanya, bukan diganti "->".

### Yang diperiksa

Diuji dengan membuka hasilnya di **Microsoft Word 16.0**:

| Yang diperiksa | Hasil |
|---|---|
| Word membuka berkas | tanpa dialog perbaikan |
| halaman | 24 dari 6 soal (empat per soal) |
| gambar tersemat | 18 (tiga per soal), 6 tabel pembahasan |
| ukuran halaman | 1440 × 810 pt, sama persis dengan PDF |
| gambar keluar area cetak | 0 dari 18 |
| kerangka dokumen | `No. N` → `Jawaban: X` → `Pembahasan:` bertingkat 1-2-3 |
| tata letak pembahasan | gambar berakhir di 664 px, kolom teks mulai 687 px — benar-benar bersebelahan |
| teks UTF-8 | panah "→" utuh |

Keabsahan arsipnya juga diperiksa terpisah oleh pembaca ZIP .NET, bukan oleh penulis
ZIP yang sama.

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
