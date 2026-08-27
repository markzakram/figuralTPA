/*
 * solids.js — mesin bangun ruang umum (bukan hanya kubus).
 *
 * Isi:
 *   1. Definisi bangun ruang (titik sudut + sisi), otomatis dipusatkan dan
 *      arah putarannya dibetulkan agar normal menghadap keluar.
 *   2. Bingkai gambar (art frame) per sisi: kotak persegi tempat gambar dilukis.
 *   3. Grup simetri: semua rotasi (dan pencerminan, untuk keperluan penomoran
 *      jaring-jaring) yang memetakan bangun ke dirinya sendiri.
 *   4. Pembukaan (unfolding): mengubah pohon rentang dari graf ketetanggaan sisi
 *      menjadi jaring-jaring 2D lengkap dengan posisi gambarnya.
 *   5. Pencacahan jaring-jaring: satu jaring per orbit simetri, yang tumpang
 *      tindih dibuang. Untuk kubus hasilnya tepat 11 jaring-jaring baku.
 *
 * Sudut putar gambar (`rot`) diukur dalam derajat SEARAH JARUM JAM pada bidang
 * sisi dilihat dari luar. Nilainya tidak harus kelipatan 90 — pada sisi segitiga
 * simetri bangun menghasilkan kelipatan 120.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Solids = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var EPS = 1e-6;
  var DEG = 180 / Math.PI;

  // ---------------------------------------------------------------- vektor
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function mul(a, s) { return [a[0] * s, a[1] * s, a[2] * s]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function neg(a) { return [-a[0], -a[1], -a[2]]; }
  function cross(a, b) {
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  }
  function length(a) { return Math.sqrt(dot(a, a)); }
  function unit(a) { var l = length(a); return l < EPS ? [0, 0, 0] : mul(a, 1 / l); }
  function vkey(a) {
    return a.map(function (x) { return (Math.round(x * 1e4) / 1e4).toFixed(4); }).join('|');
  }
  function matVec(M, v) {
    return [
      M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
      M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
      M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]
    ];
  }
  function matMul(A, B) {
    var o = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], i, j, k;
    for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) for (k = 0; k < 3; k++) o[i][j] += A[i][k] * B[k][j];
    return o;
  }
  function matT(M) {
    return [[M[0][0], M[1][0], M[2][0]], [M[0][1], M[1][1], M[2][1]], [M[0][2], M[1][2], M[2][2]]];
  }
  /** matriks dengan kolom t, b, n */
  function frameMat(t, b, n) {
    return [[t[0], b[0], n[0]], [t[1], b[1], n[1]], [t[2], b[2], n[2]]];
  }
  function det(M) {
    return M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1])
      - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0])
      + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  }
  function norm360(a) { return ((a % 360) + 360) % 360; }

  /**
   * Rapikan matriks rotasi (Gram-Schmidt). Pratinjau menumpuk ribuan rotasi kecil
   * saat diseret; tanpa ini galat pecahan lama-lama membuat bangun tampak miring.
   */
  function orthonormalize(M) {
    var c0 = unit([M[0][0], M[1][0], M[2][0]]);
    var c1 = [M[0][1], M[1][1], M[2][1]];
    c1 = unit(sub(c1, mul(c0, dot(c0, c1))));
    var c2 = cross(c0, c1);
    return [[c0[0], c1[0], c2[0]], [c0[1], c1[1], c2[1]], [c0[2], c1[2], c2[2]]];
  }

  function centroid(vs) {
    var c = [0, 0, 0];
    vs.forEach(function (v) { c = add(c, v); });
    return mul(c, 1 / vs.length);
  }
  /** normal poligon (metode Newell) */
  function polyNormal(vs) {
    var n = [0, 0, 0];
    for (var i = 0; i < vs.length; i++) {
      var a = vs[i], b = vs[(i + 1) % vs.length];
      n[0] += (a[1] - b[1]) * (a[2] + b[2]);
      n[1] += (a[2] - b[2]) * (a[0] + b[0]);
      n[2] += (a[0] - b[0]) * (a[1] + b[1]);
    }
    return unit(n);
  }
  /**
   * Volume bertanda sebuah polihedron tertutup (teorema divergensi).
   * Positif bila urutan simpul tiap sisi menghadap keluar.
   */
  function signedVolume(verts, faces) {
    var v = 0;
    faces.forEach(function (f) {
      var p = f.v.map(function (k) { return verts[k]; });
      for (var i = 1; i < p.length - 1; i++) {
        v += dot(p[0], cross(sub(p[i], p[0]), sub(p[i + 1], p[0]))) / 6;
      }
    });
    return v;
  }

  /**
   * Seragamkan urutan simpul seluruh sisi lalu hadapkan keluar.
   *
   * Dua sisi bertetangga disebut seragam bila rusuk bersamanya ditelusuri ke arah
   * BERLAWANAN oleh keduanya. Penyeragaman disebar lewat graf ketetanggaan, baru
   * setelah itu tanda volume menentukan apakah seluruhnya perlu dibalik.
   * Cara ini sah untuk bangun cekung — patokan lama ("normal menjauhi pusat")
   * hanya benar untuk bangun cembung.
   */
  function orientasiSeragam(verts, faces) {
    var idx = faces.map(function (f) { return f.v.slice(); });
    var jml = idx.length, i, j;

    function arah(list, u, v) {
      for (var k = 0; k < list.length; k++) {
        var a = list[k], b = list[(k + 1) % list.length];
        if (a === u && b === v) return 1;
        if (a === v && b === u) return -1;
      }
      return 0;
    }

    var tetangga = [];
    for (i = 0; i < jml; i++) tetangga.push([]);
    for (i = 0; i < jml; i++) {
      for (j = i + 1; j < jml; j++) {
        var sama = idx[i].filter(function (k) { return idx[j].indexOf(k) >= 0; });
        if (sama.length !== 2) continue;
        // dua simpul bersama belum tentu rusuk pada kedua sisi
        if (!arah(idx[i], sama[0], sama[1]) || !arah(idx[j], sama[0], sama[1])) continue;
        tetangga[i].push({ ke: j, u: sama[0], v: sama[1] });
        tetangga[j].push({ ke: i, u: sama[0], v: sama[1] });
      }
    }

    var lihat = [], antre = [0];
    lihat[0] = true;
    while (antre.length) {
      var a = antre.shift();
      for (var t = 0; t < tetangga[a].length; t++) {
        var e = tetangga[a][t];
        if (lihat[e.ke]) continue;
        lihat[e.ke] = true;
        if (arah(idx[a], e.u, e.v) === arah(idx[e.ke], e.u, e.v)) idx[e.ke].reverse();
        antre.push(e.ke);
      }
    }

    var bungkus = idx.map(function (v) { return { v: v }; });
    if (signedVolume(verts, bungkus) < 0) idx.forEach(function (v) { v.reverse(); });
    return idx;
  }

  function polyArea(vs, n) {
    var s = 0;
    for (var i = 1; i < vs.length - 1; i++) {
      s += dot(n, cross(sub(vs[i], vs[0]), sub(vs[i + 1], vs[0]))) / 2;
    }
    return Math.abs(s);
  }

  // ---------------------------------------------------------------- bentuk dasar

  function boxSolid(p, l, t) {
    var x = p / 2, y = t / 2, z = l / 2;
    return {
      verts: [
        [-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z],
        [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]
      ],
      // urutan sisi sengaja sama dengan geometry.js: +X, -X, +Y, -Y, +Z, -Z
      faces: [
        { v: [1, 2, 6, 5], name: 'Kanan' },
        { v: [0, 4, 7, 3], name: 'Kiri' },
        { v: [3, 7, 6, 2], name: 'Atas' },
        { v: [0, 1, 5, 4], name: 'Bawah' },
        { v: [4, 5, 6, 7], name: 'Depan' },
        { v: [1, 0, 3, 2], name: 'Belakang' }
      ],
      // bingkai gambar dipaksa sama dengan geometry.js agar editor papan tetap cocok
      frames: [
        { right: [0, 0, -1], up: [0, 1, 0] },
        { right: [0, 0, 1], up: [0, 1, 0] },
        { right: [1, 0, 0], up: [0, 0, -1] },
        { right: [1, 0, 0], up: [0, 0, 1] },
        { right: [1, 0, 0], up: [0, 1, 0] },
        { right: [-1, 0, 0], up: [0, 1, 0] }
      ]
    };
  }

  /** poligon beraturan pada bidang XZ, radius r, ketinggian y */
  function ring(n, r, y) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var a = (i + 0.5) * 2 * Math.PI / n;
      out.push([r * Math.sin(a), y, r * Math.cos(a)]);
    }
    return out;
  }

  function prismSolid(n, r, h) {
    var bottom = ring(n, r, -h / 2), top = ring(n, r, h / 2);
    var verts = bottom.concat(top);
    var faces = [
      { v: bottom.map(function (_, i) { return i; }), name: 'Alas' },
      { v: top.map(function (_, i) { return n + i; }), name: 'Tutup' }
    ];
    for (var i = 0; i < n; i++) {
      var j = (i + 1) % n;
      faces.push({ v: [i, j, n + j, n + i], name: 'Sisi ' + (i + 1) });
    }
    return { verts: verts, faces: faces };
  }

  function pyramidSolid(n, r, h) {
    var base = ring(n, r, -h / 3);
    var verts = base.concat([[0, h * 2 / 3, 0]]);
    var faces = [{ v: base.map(function (_, i) { return i; }), name: 'Alas' }];
    for (var i = 0; i < n; i++) {
      faces.push({ v: [i, (i + 1) % n, n], name: 'Sisi ' + (i + 1) });
    }
    return { verts: verts, faces: faces };
  }

  // ---------------------------------------------------------------- bentuk tak beraturan

  /** PRNG deterministik: bentuk yang sama selalu lahir dari benih yang sama. */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /** Kumpulan petak yang saling menempel sisi (poliomino). */
  function poliomino(rnd, jumlah) {
    var ada = { '0,0': true }, daftar = [[0, 0]];
    var aman = 0;
    while (daftar.length < jumlah && aman++ < 500) {
      var dasar = daftar[Math.floor(rnd() * daftar.length)];
      var arah = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(rnd() * 4)];
      var x = dasar[0] + arah[0], y = dasar[1] + arah[1], k = x + ',' + y;
      if (ada[k]) continue;
      ada[k] = true;
      daftar.push([x, y]);
    }
    return daftar;
  }

  /**
   * Telusuri tepi luar poliomino menjadi satu gelang poligon.
   * Rusuk dalam muncul dua kali dengan arah berlawanan sehingga saling meniadakan;
   * sisanya adalah tepi luar. Mengembalikan null bila tepinya bukan satu gelang
   * tunggal (ada lubang atau titik jepit), supaya bentuk yang tak bisa dilipat
   * langsung dibuang alih-alih menghasilkan jaring-jaring rusak.
   */
  function gelangTepi(petak) {
    var rusuk = {}, i;
    petak.forEach(function (p) {
      var x = p[0], y = p[1];
      var sisi = [
        [[x, y], [x + 1, y]], [[x + 1, y], [x + 1, y + 1]],
        [[x + 1, y + 1], [x, y + 1]], [[x, y + 1], [x, y]]
      ];
      sisi.forEach(function (r) {
        var maju = r[0] + '>' + r[1], mundur = r[1] + '>' + r[0];
        if (rusuk[mundur]) delete rusuk[mundur];
        else rusuk[maju] = r;
      });
    });

    var kunci = Object.keys(rusuk);
    if (!kunci.length) return null;

    var dari = {}, jepit = false;
    kunci.forEach(function (k) {
      var r = rusuk[k], a = r[0].join(',');
      if (dari[a]) jepit = true;          // dua rusuk keluar dari titik sama = titik jepit
      dari[a] = r;
    });
    if (jepit) return null;

    var mulai = rusuk[kunci[0]][0], titik = [mulai], kini = mulai, aman = 0;
    while (aman++ < 400) {
      var r = dari[kini.join(',')];
      if (!r) return null;
      kini = r[1];
      if (kini[0] === mulai[0] && kini[1] === mulai[1]) break;
      titik.push(kini);
    }
    if (titik.length !== kunci.length) return null;   // bukan satu gelang tunggal
    return titik;
  }

  /** Gabungkan rusuk yang segaris agar poligonnya ringkas. */
  function gabungSegaris(pts) {
    var out = [];
    for (var i = 0; i < pts.length; i++) {
      var a = pts[(i - 1 + pts.length) % pts.length], b = pts[i], c = pts[(i + 1) % pts.length];
      var silang = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      if (Math.abs(silang) > 1e-9) out.push(b);
    }
    return out;
  }

  /** Poligon sederhana: tidak ada rusuk tak bertetangga yang berpotongan. */
  function poligonSederhana(pts) {
    function arah(a, b, c) {
      var v = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      return Math.abs(v) < 1e-9 ? 0 : (v > 0 ? 1 : -1);
    }
    function potong(p1, p2, p3, p4) {
      var d1 = arah(p3, p4, p1), d2 = arah(p3, p4, p2);
      var d3 = arah(p1, p2, p3), d4 = arah(p1, p2, p4);
      return d1 !== d2 && d3 !== d4;
    }
    var n = pts.length;
    for (var i = 0; i < n; i++) {
      for (var j = i + 1; j < n; j++) {
        if ((i + 1) % n === j || (j + 1) % n === i) continue;
        if (potong(pts[i], pts[(i + 1) % n], pts[j], pts[(j + 1) % n])) return false;
      }
    }
    return true;
  }

  /** Pangkas satu sudut menjadi bidang miring — memberi kesan bentuk "terpotong". */
  function pangkasSudut(pts, rnd) {
    var urut = pts.map(function (_, i) { return i; });
    for (var t = urut.length - 1; t > 0; t--) {
      var r = Math.floor(rnd() * (t + 1)), tmp = urut[t]; urut[t] = urut[r]; urut[r] = tmp;
    }
    for (var q = 0; q < urut.length; q++) {
      var i = urut[q], n = pts.length;
      var a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
      var pa = Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
      var pc = Math.sqrt(Math.pow(c[0] - b[0], 2) + Math.pow(c[1] - b[1], 2));
      if (pa < 0.9 || pc < 0.9) continue;
      var f = 0.34 + rnd() * 0.22;
      var baru = pts.slice(0, i).concat([
        [b[0] + (a[0] - b[0]) * f, b[1] + (a[1] - b[1]) * f],
        [b[0] + (c[0] - b[0]) * f, b[1] + (c[1] - b[1]) * f]
      ], pts.slice(i + 1));
      if (poligonSederhana(baru)) return baru;
    }
    return pts;
  }

  /**
   * Bangun tak beraturan: penampang poliomino acak (profil L, T, U, S, tangga,
   * balok bertakik) yang diekstrusi, kadang dengan satu sudut dipangkas miring.
   * Sisi datarnya tetap poligon sederhana sehingga seluruh mesin — orientasi,
   * simetri, pembukaan, penggambaran — tetap berlaku.
   */
  function irregularSolid(benih, opsi) {
    opsi = opsi || {};
    var rnd = mulberry32((benih | 0) || 1);
    var pts = null;
    var petak = 3 + Math.floor(rnd() * 5);              // 3..7 petak

    for (var coba = 0; coba < 120 && !pts; coba++) {
      var petakAcak = poliomino(rnd, petak);
      // Kotak pembatas dibatasi 4 petak, dan bentuk selebar 1 petak ditolak.
      // Penampang yang menjulur panjang menghasilkan petak yang sangat kecil
      // setelah dinormalkan, dan pada jaring-jaring sisi tegaknya menjadi bilah
      // setipis garis yang tidak terbaca lagi sebagai bangun datar.
      var bx = petakAcak.map(function (q) { return q[0]; });
      var by = petakAcak.map(function (q) { return q[1]; });
      var lebarPetak = Math.max.apply(null, bx) - Math.min.apply(null, bx) + 1;
      var tinggiPetak = Math.max.apply(null, by) - Math.min.apply(null, by) + 1;
      if (Math.max(lebarPetak, tinggiPetak) > 4) continue;
      if (Math.min(lebarPetak, tinggiPetak) < 2) continue;

      var gelang = gelangTepi(petakAcak);
      if (!gelang) continue;
      var p = gabungSegaris(gelang);
      // 6-8 rusuk saja. Penampang berusuk 10+ berbentuk seperti sisir bergigi:
      // di gambar 3D terbaca sebagai tumpukan bilah, dan pita jaringnya memanjang
      // menjadi belasan kotak sempit. Profil L, V, T, U, dan balok bertakik semuanya
      // masuk dalam batas ini.
      if (p.length < 6 || p.length > 8) continue;
      if (!poligonSederhana(p)) continue;
      // Sudut tidak dipangkas miring: rusuk pendek menghasilkan sisi tegak setipis
      // garis, dan pada jaring-jaring bentuk itu tidak terbaca lagi sebagai bangun
      // datar. Semua rusuk penampang tetap kelipatan satu petak.
      pts = p;
    }
    if (!pts) pts = [[0, 0], [2, 0], [2, 1], [1, 1], [1, 2], [0, 2]];   // profil L cadangan

    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
    var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    var k = 1 / Math.max(x1 - x0, y1 - y0);
    var datar = pts.map(function (p) {
      return [(p[0] - (x0 + x1) / 2) * k, (p[1] - (y0 + y1) / 2) * k];
    });

    // Tebal dijaga sebanding dengan penampang (yang sudah dinormalkan ke 1).
    // Kalau terlalu tipis, pita jaring memanjang seperti penggaris dan kedua
    // tutupnya tampak kecil sehingga bentuknya sulit dibayangkan.
    var tebal = opsi.tebal || (0.7 + Math.floor(rnd() * 4) * 0.2);
    var n = datar.length, verts = [], faces = [], i;
    for (i = 0; i < n; i++) verts.push([datar[i][0], -tebal / 2, datar[i][1]]);
    for (i = 0; i < n; i++) verts.push([datar[i][0], tebal / 2, datar[i][1]]);

    faces.push({ v: datar.map(function (_, j) { return j; }), name: 'Alas' });
    faces.push({ v: datar.map(function (_, j) { return n + j; }), name: 'Tutup' });
    for (i = 0; i < n; i++) {
      var j2 = (i + 1) % n;
      faces.push({ v: [i, j2, n + j2, n + i], name: 'Sisi ' + (i + 1) });
    }
    return { verts: verts, faces: faces };
  }

  var CATALOG = {
    kubus: {
      name: 'Kubus', short: 'Kubus', faceCount: 6, pose: null, projection: 'oblique',
      build: function () { return boxSolid(1, 1, 1); }
    },
    balok: {
      name: 'Balok', short: 'Balok', faceCount: 6, pose: null, projection: 'oblique',
      params: { p: 1.35, l: 0.8, t: 1 },
      paramInfo: [
        { key: 'p', label: 'Panjang' }, { key: 'l', label: 'Lebar' }, { key: 't', label: 'Tinggi' }
      ],
      build: function (q) {
        var m = Math.max(q.p, q.l, q.t);
        return boxSolid(q.p / m, q.l / m, q.t / m);
      }
    },
    // pose 'auto' = sudut pandang dicari otomatis oleh choosePose()
    prisma3: {
      name: 'Prisma segitiga', short: 'Prisma 3', faceCount: 5, pose: 'auto', projection: 'ortho',
      build: function () { return prismSolid(3, 0.62, 0.95); }
    },
    prisma5: {
      name: 'Prisma segilima', short: 'Prisma 5', faceCount: 7, pose: 'auto', projection: 'ortho',
      build: function () { return prismSolid(5, 0.56, 0.92); }
    },
    prisma6: {
      name: 'Prisma segienam', short: 'Prisma 6', faceCount: 8, pose: 'auto', projection: 'ortho',
      build: function () { return prismSolid(6, 0.52, 0.9); }
    },
    limas4: {
      name: 'Limas segiempat', short: 'Limas 4', faceCount: 5, pose: 'auto', projection: 'ortho',
      build: function () { return pyramidSolid(4, 0.72, 1.05); }
    },
    limas5: {
      name: 'Limas segilima', short: 'Limas 5', faceCount: 6, pose: 'auto', projection: 'ortho',
      build: function () { return pyramidSolid(5, 0.66, 1.0); }
    },
    limas6: {
      name: 'Limas segienam', short: 'Limas 6', faceCount: 7, pose: 'auto', projection: 'ortho',
      build: function () { return pyramidSolid(6, 0.62, 0.98); }
    },
    acak: {
      name: 'Bangun tak beraturan', short: 'Tak beraturan', pose: 'auto', projection: 'ortho',
      polos: true,                       // dipakai tanpa gambar sisi
      pita: true,                        // jaring-jaring disusun sebagai pita agar terbaca
      params: { benih: 1 },
      paramInfo: [{ key: 'benih', label: 'Bentuk ke-', min: 1, max: 99999, step: 1, bulat: true }],
      build: function (q) { return irregularSolid(q.benih); }
    },
    limas3: {
      // bidang empat beraturan: tinggi = r*akar(2) membuat keempat sisinya kongruen,
      // sehingga grup rotasinya 12 (bukan 3) dan soal jadi jauh lebih bervariasi
      name: 'Limas segitiga', short: 'Limas 3', faceCount: 4, pose: 'auto', projection: 'ortho',
      build: function () { return pyramidSolid(3, 0.68, 0.68 * Math.SQRT2); }
    }
  };

  // ---------------------------------------------------------------- menyusun solid

  /**
   * Apakah titik (a,b) berada di dalam poligon 2D. Memakai pancaran sinar
   * (ray casting) supaya tetap benar untuk sisi CEKUNG — bangun tak beraturan
   * seperti profil L atau balok bertakik punya sisi semacam itu.
   */
  function insidePoly(poly2, a, b) {
    var di = false;
    for (var i = 0, j = poly2.length - 1; i < poly2.length; j = i++) {
      var xi = poly2[i][0], yi = poly2[i][1], xj = poly2[j][0], yj = poly2[j][1];
      if ((yi > b) !== (yj > b) && a < (xj - xi) * (b - yi) / (yj - yi) + xi) di = !di;
    }
    return di;
  }

  /**
   * Kotak persegi tempat gambar dilukis pada sebuah sisi.
   * Ukurannya dicari otomatis: sebesar mungkin tetapi keempat sudutnya tetap di
   * dalam sisi, sehingga gambar pada segitiga/segienam tidak pernah terpotong.
   */
  function artBox(vs, right, up) {
    var ctr = centroid(vs);
    var poly2 = vs.map(function (v) { return [dot(sub(v, ctr), right), dot(sub(v, ctr), up)]; });
    var a = poly2.map(function (p) { return p[0]; }), b = poly2.map(function (p) { return p[1]; });
    var amin = Math.min.apply(null, a), amax = Math.max.apply(null, a);
    var bmin = Math.min.apply(null, b), bmax = Math.max.apply(null, b);
    // segitiga dipusatkan di titik berat, sisi lain di tengah kotak pembatasnya
    var ca = vs.length === 3 ? 0 : (amin + amax) / 2;
    var cb = vs.length === 3 ? 0 : (bmin + bmax) / 2;
    var full = Math.min(amax - amin, bmax - bmin);

    function muat(pa, pb, s) {
      var h = s / 2;
      return [[pa - h, pb - h], [pa + h, pb - h], [pa + h, pb + h], [pa - h, pb + h]]
        .every(function (p) { return insidePoly(poly2, p[0], p[1]); });
    }
    function terbesar(pa, pb) {
      if (muat(pa, pb, full)) return full;
      var lo = 0, hi = full;
      for (var k = 0; k < 22; k++) {
        var mid = (lo + hi) / 2;
        if (muat(pa, pb, mid)) lo = mid; else hi = mid;
      }
      return lo * 0.985;      // sisakan sedikit ruang dari rusuk
    }

    var s = terbesar(ca, cb);
    // Pada sisi CEKUNG (mis. penampang profil L) titik tengah kotak pembatas bisa
    // berada di LUAR bangun, sehingga tidak ada kotak yang muat sama sekali.
    // Kalau begitu, cari titik pusat lain lewat penyisiran kisi.
    if (s < full * 0.12) {
      var langkah = 12;
      for (var i = 1; i < langkah; i++) {
        for (var j = 1; j < langkah; j++) {
          var pa = amin + (amax - amin) * i / langkah;
          var pb = bmin + (bmax - bmin) * j / langkah;
          if (!insidePoly(poly2, pa, pb)) continue;
          var t = terbesar(pa, pb);
          if (t > s) { s = t; ca = pa; cb = pb; }
        }
      }
    }

    var o = add(ctr, add(mul(right, ca - s / 2), mul(up, cb + s / 2)));
    return { o: o, U: mul(right, s), V: mul(up, -s), size: s };
  }

  function build(id, params) {
    var def = CATALOG[id];
    if (!def) throw new Error('bangun ruang tidak dikenal: ' + id);
    var q = {};
    Object.keys(def.params || {}).forEach(function (k) { q[k] = (params && params[k]) || def.params[k]; });
    var raw = def.build(q);

    var c = centroid(raw.verts);
    var verts = raw.verts.map(function (v) { return sub(v, c); });

    var urut = orientasiSeragam(verts, raw.faces);

    var faces = raw.faces.map(function (f, i) {
      var idx = urut[i];
      var vs = idx.map(function (k) { return verts[k]; });
      var n = polyNormal(vs);
      var fr = (raw.frames && raw.frames[i]) || null;
      var right = fr ? unit(fr.right) : unit(sub(vs[1], vs[0]));
      var up = fr ? unit(fr.up) : unit(cross(n, right));
      return {
        index: i, name: f.name, v: idx, poly: vs, normal: n,
        center: centroid(vs), area: polyArea(vs, n), sides: vs.length,
        right: right, up: up, box: artBox(vs, right, up)
      };
    });

    var solid = {
      id: id, name: def.name, short: def.short || def.name, verts: verts, faces: faces,
      polos: !!def.polos,                // bangun yang memang dipakai tanpa gambar sisi
      pita: !!def.pita,
      params: q, paramInfo: def.paramInfo || null,
      pose: def.pose, projection: def.projection
    };
    if (solid.pose === 'auto') solid.pose = choosePose(solid);
    solid.edges = buildEdges(solid);
    solid.rotations = symmetries(solid, false);
    solid.fullSymmetry = symmetries(solid, true);
    solid.untouching = untouchingPairs(solid);
    // Sisi yang tampak pada gambar pilihan jawaban. Karena setiap rotasi memetakan
    // bangun ke dirinya sendiri, kumpulan posisi yang terlihat selalu sama —
    // yang berubah hanya gambar yang menempati posisi itu.
    solid.viewVec = solid.projection === 'oblique' ? [0.38, 0.38, 1] : [0, 0, 1];
    solid.visible = visibleFaces(solid, poseMatrix(solid), solid.viewVec);
    return solid;
  }

  // ---------------------------------------------------------------- ketetanggaan

  function buildEdges(solid) {
    var out = [];
    for (var i = 0; i < solid.faces.length; i++) {
      for (var j = i + 1; j < solid.faces.length; j++) {
        var shared = solid.faces[i].v.filter(function (k) {
          return solid.faces[j].v.indexOf(k) >= 0;
        });
        if (shared.length === 2) out.push({ a: i, b: j, verts: shared });
      }
    }
    return out;
  }

  /** pasangan sisi yang tidak bersentuhan sama sekali (pada balok = sisi berhadapan) */
  function untouchingPairs(solid) {
    var out = [];
    for (var i = 0; i < solid.faces.length; i++) {
      for (var j = i + 1; j < solid.faces.length; j++) {
        var shared = solid.faces[i].v.filter(function (k) {
          return solid.faces[j].v.indexOf(k) >= 0;
        });
        if (shared.length === 0) out.push([i, j]);
      }
    }
    return out;
  }

  // ---------------------------------------------------------------- grup simetri

  /** cari titik terdekat dengan toleransi — lebih tahan galat pembulatan daripada kunci teks */
  function nearIndex(points, p) {
    for (var i = 0; i < points.length; i++) {
      var d = sub(points[i], p);
      if (dot(d, d) < 1e-9) return i;
    }
    return -1;
  }

  function mapsOntoItself(solid, M) {
    for (var i = 0; i < solid.verts.length; i++) {
      if (nearIndex(solid.verts, matVec(M, solid.verts[i])) < 0) return false;
    }
    return true;
  }

  /** permutasi sisi + tambahan sudut putar gambar untuk sebuah matriks simetri */
  function faceMapping(solid, M) {
    var map = new Array(solid.faces.length), delta = new Array(solid.faces.length);
    var centers = solid.faces.map(function (f) { return f.center; });
    for (var i = 0; i < solid.faces.length; i++) {
      var f = solid.faces[i];
      var j = nearIndex(centers, matVec(M, f.center));
      if (j < 0) return null;
      map[i] = j;
      var g = solid.faces[j];
      var ru = matVec(M, f.right);
      delta[i] = norm360(Math.atan2(dot(ru, neg(g.up)), dot(ru, g.right)) * DEG);
    }
    return { map: map, delta: delta };
  }

  function symmetries(solid, withReflections) {
    var f0 = solid.faces[0];
    var t0 = unit(sub(f0.poly[1], f0.poly[0]));
    var b0 = cross(f0.normal, t0);
    var F0inv = matT(frameMat(t0, b0, f0.normal));   // ortonormal -> transpose = invers
    var seen = {}, out = [];

    var len0 = length(sub(f0.poly[1], f0.poly[0]));

    solid.faces.forEach(function (g) {
      if (g.sides !== f0.sides) return;
      if (Math.abs(g.area - f0.area) > 1e-5) return;
      for (var k = 0; k < g.sides; k++) {
        var e = sub(g.poly[(k + 1) % g.sides], g.poly[k]);
        if (Math.abs(length(e) - len0) > 1e-5) continue;
        // Isometri langsung memetakan rusuk maju ke rusuk maju; isometri tak-langsung
        // (pencerminan) membalik urutan simpul, jadi kedua arah rusuk perlu dicoba.
        [1, -1].forEach(function (dir) {
          var t = unit(mul(e, dir));
          var b = cross(g.normal, t);
          var opts = withReflections ? [1, -1] : [1];
          opts.forEach(function (sgn) {
            var M = matMul(frameMat(t, mul(b, sgn), g.normal), F0inv);
            if (!mapsOntoItself(solid, M)) return;
            var fm = faceMapping(solid, M);
            if (!fm) return;
            var key = M.map(function (row) {
              return row.map(function (x) { return (Math.round(x * 1e4) / 1e4).toFixed(4); }).join(',');
            }).join(';');
            if (seen[key]) return;
            seen[key] = true;
            out.push({ M: M, map: fm.map, delta: fm.delta, mirror: det(M) < 0 });
          });
        });
      }
    });
    return out;
  }

  /** Terapkan simetri pada keadaan sisi: gambar ikut berpindah dan berputar. */
  function applyRotation(faces, rot) {
    var out = new Array(faces.length);
    for (var i = 0; i < faces.length; i++) {
      out[rot.map[i]] = {
        art: faces[i].art,
        rot: norm360((faces[i].rot || 0) + rot.delta[i])
      };
    }
    return out;
  }

  // ---------------------------------------------------------------- pembukaan (unfolding)

  function rot2(v, deg) {
    var a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return [v[0] * c - v[1] * s, v[0] * s + v[1] * c];
  }

  /**
   * Buka bangun ruang menjadi jaring-jaring 2D mengikuti pohon rentang.
   * Sumbu 2D memakai konvensi y ke ATAS; pemanggil boleh membalik ke koordinat layar.
   * @returns {{ok:boolean, cells:Array}} cells: {face, poly:[[x,y]], box:{o,U,V} dalam 2D}
   */
  function unfold(solid, treeEdges) {
    var nf = solid.faces.length;
    var adj = [];
    for (var i = 0; i < nf; i++) adj.push([]);
    treeEdges.forEach(function (e) {
      adj[e.a].push({ other: e.b, edge: e });
      adj[e.b].push({ other: e.a, edge: e });
    });

    var placed = new Array(nf);   // {A3,t3,b3, A2,d2,p2}
    var f0 = solid.faces[0];
    var t3 = unit(sub(f0.poly[1], f0.poly[0]));
    placed[0] = {
      A3: f0.poly[0], t3: t3, b3: cross(f0.normal, t3),
      A2: [0, 0], d2: [1, 0], p2: [0, 1]
    };

    var queue = [0], seenFace = { 0: true }, order = [0];
    while (queue.length) {
      var cur = queue.shift();
      for (var q = 0; q < adj[cur].length; q++) {
        var nb = adj[cur][q];
        if (seenFace[nb.other]) continue;
        var A3 = solid.verts[nb.edge.verts[0]], B3 = solid.verts[nb.edge.verts[1]];
        var P = placed[cur];
        var A2 = to2(P, A3), B2 = to2(P, B3);
        var d2 = [B2[0] - A2[0], B2[1] - A2[1]];
        var L = Math.sqrt(d2[0] * d2[0] + d2[1] * d2[1]);
        d2 = [d2[0] / L, d2[1] / L];
        var g = solid.faces[nb.other];
        var nt3 = unit(sub(B3, A3));
        placed[nb.other] = {
          A3: A3, t3: nt3, b3: cross(g.normal, nt3),
          A2: A2, d2: d2, p2: [-d2[1], d2[0]]
        };
        seenFace[nb.other] = true;
        order.push(nb.other);
        queue.push(nb.other);
      }
    }
    if (order.length !== nf) return { ok: false, reason: 'pohon tidak menghubungkan semua sisi' };

    var cells = solid.faces.map(function (f) {
      var P = placed[f.index];
      return {
        face: f.index,
        poly: f.poly.map(function (v) { return to2(P, v); }),
        box: {
          o: to2(P, f.box.o),
          U: dir2(P, f.box.U),
          V: dir2(P, f.box.V)
        }
      };
    });

    for (var a = 0; a < cells.length; a++) {
      for (var b = a + 1; b < cells.length; b++) {
        if (polyOverlap(cells[a].poly, cells[b].poly)) {
          return { ok: false, reason: 'sisi saling tumpang tindih' };
        }
      }
    }
    return { ok: true, cells: cells };
  }

  function to2(P, v) {
    var d = sub(v, P.A3), a = dot(d, P.t3), b = dot(d, P.b3);
    return [P.A2[0] + a * P.d2[0] + b * P.p2[0], P.A2[1] + a * P.d2[1] + b * P.p2[1]];
  }
  function dir2(P, v) {
    var a = dot(v, P.t3), b = dot(v, P.b3);
    return [a * P.d2[0] + b * P.p2[0], a * P.d2[1] + b * P.p2[1]];
  }

  /**
   * Uji tumpang tindih dua poligon SEDERHANA — cembung maupun cekung.
   *
   * Dua poligon bertindihan bila ada rusuk yang berpotongan, atau bila salah satu
   * seluruhnya berada di dalam yang lain. Uji SAT yang lama hanya sahih untuk
   * poligon cembung: pada tutup bangun tak beraturan yang cekung ia melaporkan
   * tindihan palsu sehingga jaring-jaring yang sebenarnya sah ikut terbuang.
   * Poligon dikecilkan dulu agar rusuk yang bersinggungan tidak dihitung.
   */
  function segmenPotong(p1, p2, p3, p4) {
    function arah(a, b, c) {
      var v = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      return Math.abs(v) < 1e-12 ? 0 : (v > 0 ? 1 : -1);
    }
    return arah(p3, p4, p1) !== arah(p3, p4, p2) && arah(p1, p2, p3) !== arah(p1, p2, p4);
  }

  function titikDalam(poly, x, y) {
    var di = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) di = !di;
    }
    return di;
  }

  function polyOverlap(A, B) {
    var a = shrink(A, 0.94), b = shrink(B, 0.94), i, j;
    for (i = 0; i < a.length; i++) {
      for (j = 0; j < b.length; j++) {
        if (segmenPotong(a[i], a[(i + 1) % a.length], b[j], b[(j + 1) % b.length])) return true;
      }
    }
    if (titikDalam(b, a[0][0], a[0][1])) return true;
    if (titikDalam(a, b[0][0], b[0][1])) return true;
    return false;
  }
  function shrink(poly, k) {
    var cx = 0, cy = 0;
    poly.forEach(function (p) { cx += p[0]; cy += p[1]; });
    cx /= poly.length; cy /= poly.length;
    return poly.map(function (p) { return [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]; });
  }
  function satOverlap(A, B) {
    for (var i = 0; i < A.length; i++) {
      var p = A[i], q = A[(i + 1) % A.length];
      var ax = -(q[1] - p[1]), ay = q[0] - p[0];
      var amin = Infinity, amax = -Infinity, bmin = Infinity, bmax = -Infinity;
      A.forEach(function (v) { var d = v[0] * ax + v[1] * ay; amin = Math.min(amin, d); amax = Math.max(amax, d); });
      B.forEach(function (v) { var d = v[0] * ax + v[1] * ay; bmin = Math.min(bmin, d); bmax = Math.max(bmax, d); });
      if (amax < bmin + 1e-9 || bmax < amin + 1e-9) return false;
    }
    return true;
  }

  // ---------------------------------------------------------------- pencacahan jaring-jaring

  function isSpanningTree(nf, edges) {
    if (edges.length !== nf - 1) return false;
    var parent = [];
    for (var i = 0; i < nf; i++) parent.push(i);
    function find(x) { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; }
    for (var k = 0; k < edges.length; k++) {
      var ra = find(edges[k].a), rb = find(edges[k].b);
      if (ra === rb) return false;
      parent[ra] = rb;
    }
    return true;
  }

  /** kunci kanonik pohon terhadap seluruh grup simetri (termasuk pencerminan) */
  function treeKey(solid, edges) {
    var best = null;
    solid.fullSymmetry.forEach(function (s) {
      var k = edges.map(function (e) {
        var a = s.map[e.a], b = s.map[e.b];
        return a < b ? a + '-' + b : b + '-' + a;
      }).sort().join(' ');
      if (best === null || k < best) best = k;
    });
    return best;
  }

  function boundsOf(cells) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    cells.forEach(function (c) {
      c.poly.forEach(function (p) {
        x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]);
        y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
      });
    });
    return { x0: x0, y0: y0, x1: x1, y1: y1, w: x1 - x0, h: y1 - y0 };
  }

  function rotateCells(cells, deg) {
    return cells.map(function (c) {
      return {
        face: c.face,
        poly: c.poly.map(function (p) { return rot2(p, deg); }),
        box: { o: rot2(c.box.o, deg), U: rot2(c.box.U, deg), V: rot2(c.box.V, deg) }
      };
    });
  }

  /**
   * Semua jaring-jaring berbeda dari sebuah bangun ruang.
   * Satu wakil per orbit simetri, yang tumpang tindih dibuang.
   */
  /** Satu pohon rentang acak lewat Kruskal pada urutan rusuk yang diacak. */
  function pohonAcak(nf, E, rnd) {
    var urut = E.map(function (_, i) { return i; });
    for (var i = urut.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1)), t = urut[i]; urut[i] = urut[j]; urut[j] = t;
    }
    var induk = [];
    for (i = 0; i < nf; i++) induk.push(i);
    function cari(x) { while (induk[x] !== x) { induk[x] = induk[induk[x]]; x = induk[x]; } return x; }
    var pilih = [];
    for (i = 0; i < urut.length && pilih.length < nf - 1; i++) {
      var e = E[urut[i]], ra = cari(e.a), rb = cari(e.b);
      if (ra === rb) continue;
      induk[ra] = rb;
      pilih.push(e);
    }
    return pilih.length === nf - 1 ? pilih : null;
  }

  function hitungKombinasi(n, k) {
    var r = 1;
    for (var i = 0; i < k; i++) { r = r * (n - i) / (i + 1); if (r > 1e12) return r; }
    return r;
  }

  function benihDari(teks) {
    var h = 2166136261;
    for (var i = 0; i < teks.length; i++) { h ^= teks.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  /**
   * Struktur prisma: dua tutup sebangun + segelang sisi tegak segiempat.
   * Mengembalikan { tutup:[a,b], gelang:[...urut keliling] } atau null.
   */
  function strukturPrisma(solid) {
    var tutup = [], gelang = [];
    solid.faces.forEach(function (f) {
      if (f.sides === 4) gelang.push(f.index); else tutup.push(f.index);
    });
    if (tutup.length !== 2 || gelang.length < 3) return null;
    if (solid.faces[tutup[0]].sides !== gelang.length) return null;

    // urutkan sisi tegak mengikuti keliling
    var tetangga = {};
    gelang.forEach(function (i) { tetangga[i] = []; });
    solid.edges.forEach(function (e) {
      if (tetangga[e.a] && tetangga[e.b]) { tetangga[e.a].push(e.b); tetangga[e.b].push(e.a); }
    });
    if (!gelang.every(function (i) { return tetangga[i].length === 2; })) return null;

    var urut = [gelang[0]], sebelum = -1;
    while (urut.length < gelang.length) {
      var kini = urut[urut.length - 1];
      var maju = tetangga[kini].filter(function (x) { return x !== sebelum; })[0];
      if (maju === undefined || urut.indexOf(maju) >= 0) return null;
      sebelum = kini;
      urut.push(maju);
    }
    return { tutup: tutup, gelang: urut };
  }

  /**
   * Jaring-jaring prisma yang rapi: sisi tegak dibuka lurus menjadi satu PITA,
   * lalu kedua tutup ditempelkan pada sisi tegak yang dipilih. Inilah bentuk
   * jaring prisma yang lazim di buku pelajaran — jauh lebih terbaca daripada
   * pohon rentang acak, yang menjalar menyerong dan sulit dibayangkan lipatannya.
   * Variasinya tetap banyak: (jumlah sisi tegak)² pasangan titik tempel.
   */
  function netsPita(solid, limit) {
    var st = strukturPrisma(solid);
    if (!st) return null;
    var rusukAntar = {};
    solid.edges.forEach(function (e) {
      rusukAntar[e.a + '-' + e.b] = e;
      rusukAntar[e.b + '-' + e.a] = e;
    });

    var pita = [], i;
    for (i = 0; i + 1 < st.gelang.length; i++) {
      pita.push(rusukAntar[st.gelang[i] + '-' + st.gelang[i + 1]]);
    }
    if (pita.some(function (e) { return !e; })) return null;

    var out = [], seen = {};
    for (var a = 0; a < st.gelang.length && out.length < limit; a++) {
      for (var b = 0; b < st.gelang.length && out.length < limit; b++) {
        var e1 = rusukAntar[st.tutup[0] + '-' + st.gelang[a]];
        var e2 = rusukAntar[st.tutup[1] + '-' + st.gelang[b]];
        if (!e1 || !e2) continue;
        var pohon = pita.concat([e1, e2]);
        if (!isSpanningTree(solid.faces.length, pohon)) continue;
        var key = treeKey(solid, pohon);
        if (seen[key]) continue;
        seen[key] = true;
        var u = unfold(solid, pohon);
        if (!u.ok) continue;
        var cells = u.cells, bo = boundsOf(cells);
        if (bo.h > bo.w + 1e-9) { cells = rotateCells(cells, 90); bo = boundsOf(cells); }
        out.push({ cells: cells, bounds: bo, tree: pohon.slice(), key: key });
      }
    }
    return out.length ? out : null;
  }

  function nets(solid, limit) {
    limit = limit || 60;
    var E = solid.edges, nf = solid.faces.length, need = nf - 1;
    var seen = {}, out = [];

    // Bangun tak beraturan memakai jaring PITA yang rapi. Prisma baku tetap
    // dicacah lengkap supaya jumlah jaring bakunya tidak berkurang
    // (prisma segitiga 9, prisma segienam 12, dan seterusnya).
    if (solid.pita || hitungKombinasi(E.length, need) > 2e5) {
      var pita = netsPita(solid, limit);
      if (pita) return pita;
    }

    function simpan(edges, key) {
      var u = unfold(solid, edges);
      if (!u.ok) return;
      var cells = u.cells;
      var b = boundsOf(cells);
      if (b.h > b.w + 1e-9) { cells = rotateCells(cells, 90); b = boundsOf(cells); }
      out.push({ cells: cells, bounds: b, tree: edges.slice(), key: key });
    }

    // Ruang kombinasi tumbuh sangat cepat: bangun tak beraturan bisa mencapai
    // C(27,10) ≈ 8 juta. Di atas ambang ini pohon rentang diambil secara acak
    // (dengan benih tetap, jadi hasilnya tetap dapat diulang) alih-alih dicacah habis.
    if (hitungKombinasi(E.length, need) > 2e5) {
      var rnd = mulberry32(benihDari(solid.id + '|' + JSON.stringify(solid.params || {})));
      var coba = 0, maks = limit * 120;
      while (out.length < limit && coba++ < maks) {
        var pohon = pohonAcak(nf, E, rnd);
        if (!pohon) continue;
        var k = treeKey(solid, pohon);
        if (seen[k]) continue;
        seen[k] = true;
        simpan(pohon, k);
      }
    } else {
      var idx = [];
      for (var i = 0; i < need; i++) idx.push(i);
      while (true) {
        var edges = idx.map(function (k2) { return E[k2]; });
        if (isSpanningTree(nf, edges)) {
          var key = treeKey(solid, edges);
          if (!seen[key]) { seen[key] = true; simpan(edges, key); }
        }
        if (out.length >= limit) break;
        var p = need - 1;
        while (p >= 0 && idx[p] === E.length - need + p) p--;
        if (p < 0) break;
        idx[p]++;
        for (var j = p + 1; j < need; j++) idx[j] = idx[j - 1] + 1;
      }
    }

    // yang paling "berimbang" lebih dulu — bentuk seperti salib/T muncul di awal daftar
    out.sort(function (a, b) {
      var ma = Math.max(a.bounds.w, a.bounds.h), mb = Math.max(b.bounds.w, b.bounds.h);
      return ma - mb ||
        (a.bounds.w * a.bounds.h) - (b.bounds.w * b.bounds.h) ||
        a.bounds.w - b.bounds.w;
    });
    return out;
  }

  // ---------------------------------------------------------------- tampilan

  /** Sisi yang terlihat dari arah pandang tertentu (setelah pose bangun diterapkan). */
  function visibleFaces(solid, M, view) {
    var out = [];
    solid.faces.forEach(function (f) {
      if (dot(matVec(M, f.normal), view) > 1e-9) out.push(f.index);
    });
    return out;
  }

  function anglesToMatrix(yawDeg, pitchDeg) {
    var y = yawDeg * Math.PI / 180, p = pitchDeg * Math.PI / 180;
    var cy = Math.cos(y), sy = Math.sin(y), cp = Math.cos(p), sp = Math.sin(p);
    return matMul([[1, 0, 0], [0, cp, -sp], [0, sp, cp]], [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]]);
  }

  function poseMatrix(solid) {
    if (!solid.pose) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    return anglesToMatrix(solid.pose.yaw, solid.pose.pitch);
  }

  /** luas bayangan sebuah sisi pada proyeksi ortografis (rumus tali sepatu) */
  function shadowArea(poly, M) {
    var p = poly.map(function (v) { return matVec(M, v); });
    var s = 0;
    for (var i = 0; i < p.length; i++) {
      var a = p[i], b = p[(i + 1) % p.length];
      s += a[0] * b[1] - b[0] * a[1];
    }
    return Math.abs(s) / 2;
  }

  /**
   * Cari sudut pandang terbaik: sebanyak mungkin sisi terlihat, dan tidak ada
   * yang tipis seperti garis. Tanpa ini prisma segitiga tampak seperti kartu
   * terlipat karena satu sisi tegaknya nyaris menghadap tepi.
   */
  function choosePose(solid) {
    var best = { yaw: -30, pitch: 18 }, bestScore = -1;
    // sisi terbesar = "wajah" bangun; kalau ia terbaca, bentuknya mudah dikenali
    var utama = 0, luasMaks = -1;
    solid.faces.forEach(function (f) { if (f.area > luasMaks) { luasMaks = f.area; utama = f.index; } });
    /**
     * Nilai sebuah sudut pandang. Selain jumlah sisi yang tampak dan
     * keseimbangan luasnya, tampilan yang memperlihatkan sisi TERBESAR dengan
     * jelas lebih mudah dibaca: pada prisma sisi itu adalah penampangnya, dan
     * penampang yang terbaca membuat bentuknya langsung dikenali.
     */
    function nilai(yaw, pitch) {
      var M = anglesToMatrix(yaw, pitch);
      var areas = [], luasUtama = 0;
      for (var i = 0; i < solid.faces.length; i++) {
        var f = solid.faces[i];
        if (dot(matVec(M, f.normal), [0, 0, 1]) <= 1e-6) continue;
        var a = shadowArea(f.poly, M);
        areas.push(a);
        if (f.index === utama) luasUtama = a;
      }
      if (!areas.length) return -1;
      var total = 0, min = Infinity;
      for (i = 0; i < areas.length; i++) { total += areas[i]; min = Math.min(min, areas[i]); }
      // Keseimbangan diutamakan: tanpa itu, penilaian justru memilih tampilan
      // yang membuat sisi terbesar mendominasi sampai sisi lain setipis garis —
      // prisma segitiga jadi terlihat seperti kartu terlipat. Bonus sisi terbesar
      // dibuat jenuh di 0,5 supaya tidak bisa "dibeli" dengan mengorbankan yang lain.
      return areas.length + 1.2 * (min / total) + 0.5 * Math.min(luasUtama / total, 0.5);
    }

    function sapu(y0, y1, langkahY, p0, p1, langkahP) {
      for (var yaw = y0; yaw < y1; yaw += langkahY) {
        for (var pitch = p0; pitch <= p1; pitch += langkahP) {
          var s = nilai(((yaw % 360) + 360) % 360, pitch);
          if (s > bestScore + 1e-9) {
            bestScore = s;
            best = { yaw: yaw, pitch: pitch };
          }
        }
      }
    }

    // Sapuan kasar lalu dipertajam di sekitar pemenangnya. Menyapu langsung
    // dengan langkah 2 derajat butuh 3.780 pose per bangun — terasa lambat saat
    // membuat seratus soal yang tiap nomornya berbentuk baru.
    sapu(0, 360, 6, 6, 46, 3);
    var ky = best.yaw, kp = best.pitch;
    sapu(ky - 6, ky + 6, 2, Math.max(6, kp - 3), Math.min(46, kp + 3), 1);

    if (best.yaw > 180) best.yaw -= 360;
    if (best.yaw < -180) best.yaw += 360;
    return best;
  }

  function blankFaces(solid, makeArt) {
    return solid.faces.map(function () { return { art: makeArt ? makeArt() : null, rot: 0 }; });
  }

  /**
   * Sidik bentuk: dua bangun dengan kunci sama itu kongruen (jumlah, bentuk, dan
   * luas sisinya identik). Dipakai agar balok berukuran 1:1:1 tidak dijadikan
   * pengecoh untuk soal kubus.
   */
  /**
   * Sidik-sidik ini dipanggil ratusan kali per soal oleh pemilih pengecoh
   * berbasis kemiripan, sedangkan menghitungnya berarti menyusun ulang seluruh
   * poligon sisi. Hasilnya disimpan pada objek bangunnya (bangun tidak pernah
   * berubah setelah dibangun), yang memangkas waktu pembuatan soal berkali lipat.
   */
  function shapeKey(solid) {
    if (solid._sidikBentuk) return solid._sidikBentuk;
    var k = solid.faces.map(function (f) {
      return f.sides + ':' + Math.round(f.area * 1000);
    }).sort().join('|');
    try { solid._sidikBentuk = k; } catch (e) { /* objek beku */ }
    return k;
  }

  // ---------------------------------------------------------------- bangun datar penyusun

  function edgeLengths(f) {
    var out = [];
    for (var i = 0; i < f.poly.length; i++) {
      out.push(length(sub(f.poly[(i + 1) % f.poly.length], f.poly[i])));
    }
    return out;
  }

  /** Sidik bentuk sebuah sisi, bebas ukuran — persegi dan persegi panjang berbeda. */
  function faceShapeKey(f) {
    var ls = edgeLengths(f);
    var per = ls.reduce(function (a, b) { return a + b; }, 0);
    return f.sides + ':' + ls.map(function (l) { return Math.round(l / per * 1000); })
      .sort(function (a, b) { return a - b; }).join(',');
  }

  /** Apakah poligon punya sudut cekung (bukan poligon beraturan/cembung). */
  function poligonCekung(f) {
    var p = facePoly2D(f), n = p.length, positif = false, negatif = false;
    for (var i = 0; i < n; i++) {
      var a = p[i], b = p[(i + 1) % n], c = p[(i + 2) % n];
      var s = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
      if (s > 1e-9) positif = true;
      if (s < -1e-9) negatif = true;
    }
    return positif && negatif;
  }

  var NAMA_SEGI = {
    5: 'segilima', 6: 'segienam', 7: 'segitujuh', 8: 'segidelapan',
    9: 'segisembilan', 10: 'segisepuluh', 11: 'segisebelas', 12: 'segidua belas'
  };

  function faceShapeLabel(f) {
    var ls = edgeLengths(f).map(function (l) { return Math.round(l * 1000); });
    var beda = ls.filter(function (v, i) { return ls.indexOf(v) === i; }).length;
    if (f.sides === 3) return beda === 1 ? 'segitiga sama sisi' : (beda === 2 ? 'segitiga sama kaki' : 'segitiga');
    if (f.sides === 4 && !poligonCekung(f)) return beda === 1 ? 'persegi' : 'persegi panjang';
    var nama = NAMA_SEGI[f.sides] || 'segi-' + f.sides;
    // penampang bangun tak beraturan bertakik — bukan poligon beraturan
    return poligonCekung(f) ? nama + ' tak beraturan' : nama;
  }

  /** Poligon sebuah sisi dalam koordinat bidangnya sendiri (y ke bawah, siap digambar). */
  function facePoly2D(f) {
    return f.poly.map(function (v) {
      return [dot(sub(v, f.center), f.right), -dot(sub(v, f.center), f.up)];
    });
  }

  /**
   * Daftar bangun datar penyusun, dikelompokkan per JENIS bangun datar
   * (persegi, persegi panjang, segitiga sama kaki, …) — bukan per ukuran.
   * "Balok tersusun dari 6 persegi panjang" adalah jawaban yang dimaksud
   * pelajaran, meski ketiga pasang persegi panjangnya berbeda ukuran. Tanpa
   * pengelompokan ini, bangun tak beraturan akan terurai jadi belasan entri.
   */
  function composition(solid) {
    var by = {}, order = [];
    solid.faces.forEach(function (f) {
      var k = faceShapeLabel(f);
      if (!by[k]) {
        by[k] = { key: k, label: k, count: 0, poly: facePoly2D(f), sides: f.sides, luas: f.area };
        order.push(k);
      }
      by[k].count++;
      // wakil gambar: ambil sisi terbesar agar bentuknya jelas terbaca
      if (f.area > by[k].luas) { by[k].poly = facePoly2D(f); by[k].luas = f.area; }
    });
    return order.map(function (k) { return by[k]; })
      .sort(function (a, b) { return b.count - a.count || a.sides - b.sides; });
  }

  /**
   * Jarak kemiripan dua bangun ruang: 0 berarti kembar, makin besar makin berbeda.
   *
   * Dipakai untuk memilih PENGECOH yang menyerupai kunci. Pengecoh berupa limas
   * untuk soal prisma langsung tercoret penjawab tanpa perlu berpikir; pengecoh
   * yang jumlah sisi dan ukuran sisinya berdekatan memaksa penjawab benar-benar
   * mencocokkan penampang dan menghitung sisinya.
   */
  /** daftar luas & jumlah rusuk tiap sisi, terurut — disimpan agar tidak dihitung ulang */
  function profilSisi(s) {
    if (s._profilSisi) return s._profilSisi;
    var p = {
      luas: s.faces.map(function (f) { return f.area; }).sort(function (x, y) { return y - x; }),
      rusuk: s.faces.map(function (f) { return f.sides; }).sort(function (x, y) { return y - x; }),
      rusukUtama: 0
    };
    var maks = -1;
    s.faces.forEach(function (f) { if (f.area > maks) { maks = f.area; p.rusukUtama = f.sides; } });
    try { s._profilSisi = p; } catch (e) { /* objek beku */ }
    return p;
  }

  function kemiripan(a, b) {
    var d = Math.abs(a.faces.length - b.faces.length) * 3;
    var pa = profilSisi(a), pb = profilSisi(b);
    var la = pa.luas, lb = pb.luas;
    var n = Math.max(la.length, lb.length), i;
    for (i = 0; i < n; i++) d += Math.abs((la[i] || 0) - (lb[i] || 0));

    // Bentuk tiap sisi ikut dibandingkan, bukan cuma luasnya. Tanpa suku ini
    // limas segilima dianggap dekat dengan kubus hanya karena sama-sama bersisi
    // enam, padahal sisinya segitiga semua — penjawab langsung mencoretnya.
    var sa = pa.rusuk, sb = pb.rusuk;
    for (i = 0; i < n; i++) d += Math.abs((sa[i] || 0) - (sb[i] || 0)) * 1.2;

    // jumlah rusuk pada sisi terbesar = bentuk penampang
    d += Math.abs(pa.rusukUtama - pb.rusukUtama) * 0.8;

    // susunan bangun datar yang sama membuat keduanya makin sulit dibedakan
    if (compositionKey(a) === compositionKey(b)) d -= 0.5;
    return d;
  }

  /** Urutkan kandidat dari yang paling mirip dengan `target`. */
  function urutMirip(target, kandidat) {
    return kandidat.map(function (k) {
      return { k: k, d: kemiripan(target, k.solid || k) };
    }).sort(function (x, y) { return x.d - y.d; }).map(function (x) { return x.k; });
  }

  function compositionKey(solid) {
    if (solid._sidikSusunan) return solid._sidikSusunan;
    var k = composition(solid).map(function (c) { return c.count + '×' + c.key; }).sort().join('|');
    try { solid._sidikSusunan = k; } catch (e) { /* objek beku */ }
    return k;
  }

  function compositionText(solid) {
    return composition(solid).map(function (c) { return c.count + ' ' + c.label; }).join(' + ');
  }

  return {
    CATALOG: CATALOG, build: build, nets: nets, unfold: unfold,
    applyRotation: applyRotation, visibleFaces: visibleFaces, poseMatrix: poseMatrix,
    blankFaces: blankFaces, boundsOf: boundsOf, rotateCells: rotateCells, shapeKey: shapeKey,
    composition: composition, compositionKey: compositionKey, compositionText: compositionText,
    kemiripan: kemiripan, urutMirip: urutMirip,
    faceShapeLabel: faceShapeLabel, facePoly2D: facePoly2D,
    symmetries: symmetries, isSpanningTree: isSpanningTree, treeKey: treeKey,
    polyOverlap: polyOverlap, unfold: unfold,
    irregularSolid: irregularSolid, mulberry32: mulberry32, strukturPrisma: strukturPrisma,
    poligonSederhana: poligonSederhana, signedVolume: signedVolume,
    anglesToMatrix: anglesToMatrix, choosePose: choosePose, orthonormalize: orthonormalize,
    matVec: matVec, matMul: matMul, det: det, dot: dot, cross: cross, unit: unit,
    add: add, sub: sub, mul: mul, neg: neg, norm360: norm360, centroid: centroid
  };
});
