/*
 * render.js — penggambar SVG untuk bangun ruang dan jaring-jaringnya.
 * Tanpa library eksternal supaya berkas bisa dibuka langsung dari disk (file://).
 *
 * Gambar sisi dilukis di dalam "kotak gambar" (o, U, V): o = sudut kiri-atas kotak,
 * U = sumbu kanan, V = sumbu bawah. Kotak itu dipetakan ke layar lewat matriks affine,
 * lalu dipotong (clip) mengikuti bentuk sisinya.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./art.js'), require('./solids.js'));
  } else {
    root.Render = factory(root.Art, root.Solids);
  }
})(typeof self !== 'undefined' ? self : this, function (Art, S) {
  'use strict';

  var uid = 0;
  function num(v) { return Math.round(v * 1000) / 1000; }
  function pts(list) {
    return list.map(function (p) { return num(p[0]) + ',' + num(p[1]); }).join(' ');
  }

  // ---------------------------------------------------------------- proyeksi

  /** Proyeksi miring: sisi depan berupa persegi, kedalaman menyerong ke kanan-atas. */
  function oblique(size, depth) {
    var S1 = size, D = depth;
    return {
      width: S1 + D, height: S1 + D,
      view: [D, D, S1],
      project: function (p) {
        return [
          (p[0] + 0.5) * S1 + (0.5 - p[2]) * D,
          (0.5 - p[1]) * S1 - (0.5 - p[2]) * D + D
        ];
      }
    };
  }

  /** Proyeksi ortografis, dipakai untuk bangun yang diputar bebas. */
  function ortho(size, scale) {
    var k = size / (scale || 1.95), c = size / 2;
    return {
      width: size, height: size, view: [0, 0, 1],
      project: function (p) { return [c + p[0] * k, c - p[1] * k]; }
    };
  }

  function yawPitch(yawDeg, pitchDeg) {
    var y = yawDeg * Math.PI / 180, p = pitchDeg * Math.PI / 180;
    var cy = Math.cos(y), sy = Math.sin(y), cp = Math.cos(p), sp = Math.sin(p);
    return S.matMul([[1, 0, 0], [0, cp, -sp], [0, sp, cp]], [[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]]);
  }

  function projectionFor(solid, size) {
    return solid.projection === 'oblique'
      ? oblique(size, Math.round(size * 0.38))
      : ortho(size + Math.round(size * 0.38));
  }

  // ---------------------------------------------------------------- satu sisi

  /**
   * @param {Array} poly titik sisi dalam koordinat layar
   * @param {Object} box {o,U,V} kotak gambar dalam koordinat layar
   */
  /**
   * @param {boolean} tanpaGaris jangan gambar rusuknya di sini — dipakai oleh
   *        jaring-jaring, yang menggambar rusuk pada lapisan tersendiri agar
   *        garis lipatan bisa dibuat putus-putus.
   */
  function facePiece(poly, box, state, opts, id, tanpaGaris, warna) {
    var art = state && state.art;
    var rot = (state && state.rot) || 0;
    var stroke = tanpaGaris ? 'none' : (opts.stroke || '#111111');
    var sw = opts.strokeWidth != null ? opts.strokeWidth : 2;
    var body = Art.shape(art);
    var out = '', defs = '';

    // Warna sisi hanya dipakai pada gambar pembahasan bangun POLOS: tanpa corak,
    // warna adalah satu-satunya jejak yang menghubungkan petak jaring dengan sisi
    // bangun ruangnya. Gambar soal dan pilihan tetap polos.
    out += '<polygon points="' + pts(poly) + '" fill="' + (warna || Art.bgOf(art)) + '"/>';

    if (body) {
      var m = [box.U[0] / 100, box.U[1] / 100, box.V[0] / 100, box.V[1] / 100, box.o[0], box.o[1]];
      var g = '<g transform="matrix(' + m.map(num).join(',') + ')">' +
        (rot ? '<g transform="rotate(' + num(rot) + ' 50 50)">' + body + '</g>' : body) +
        '</g>';
      defs = '<clipPath id="' + id + '"><polygon points="' + pts(poly) + '"/></clipPath>';
      out += '<g clip-path="url(#' + id + ')">' + g + '</g>';
    }

    out += '<polygon points="' + pts(poly) + '" fill="none" stroke="' + stroke +
      '" stroke-width="' + sw + '" stroke-linejoin="round"/>';
    return { body: out, defs: defs };
  }

  // ---------------------------------------------------------------- bangun ruang 3D

  /**
   * Gambar bangun ruang. `M` boleh matriks rotasi apa pun (termasuk sudut bebas
   * untuk pratinjau) — matriks itu hanya memutar geometri, bukan isi sisinya.
   */
  function solid(sd, faces, M, proj, opts) {
    opts = opts || {};
    M = M || [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
    var prefix = 'f' + (++uid) + '_';
    var body = [], defs = [];

    // Sisi yang membelakangi penonton tidak pernah terlihat pada bangun tertutup,
    // jadi tetap dibuang. Sisanya diurutkan dari yang terjauh: pada bangun CEKUNG
    // (mis. balok bertakik) dua sisi yang sama-sama menghadap penonton bisa saling
    // menutupi, dan urutan gambarlah yang menentukan mana yang tampak.
    var tampak = sd.faces.filter(function (f) {
      return S.dot(S.matVec(M, f.normal), proj.view) > 1e-9;
    }).map(function (f) {
      return { f: f, dalam: S.dot(S.matVec(M, f.center), proj.view) };
    }).sort(function (a, b) { return a.dalam - b.dalam; });

    var segi = tampak.map(function (item) {
      return item.f.poly.map(function (v) { return proj.project(S.matVec(M, v)); });
    });

    tampak.forEach(function (item, k) {
      var f = item.f;
      var poly = segi[k];
      var o = proj.project(S.matVec(M, f.box.o));
      var pu = proj.project(S.matVec(M, S.add(f.box.o, f.box.U)));
      var pv = proj.project(S.matVec(M, S.add(f.box.o, f.box.V)));
      var piece = facePiece(poly, {
        o: o, U: [pu[0] - o[0], pu[1] - o[1]], V: [pv[0] - o[0], pv[1] - o[1]]
      }, faces && faces[f.index], opts, prefix + f.index, false,
        opts.warnaSisi && opts.warnaSisi[f.index]);
      body.push(piece.body);
      if (piece.defs) defs.push(piece.defs);
    });

    // nomor sisi untuk pembahasan: di luar bayangan bangun, digambar paling akhir
    var nomor = '';
    if (opts.nomor) {
      var rr = opts.ukuranNomor || 11;
      var titik = [], rintangan = segi.slice();
      tampak.forEach(function (item, k) {
        var no = opts.nomor[item.f.index];
        if (!no) return;
        var f2 = faces && faces[item.f.index];
        var t = titikNomor(segi[k], rintangan, rr, !f2 || Art.isBlank(f2.art));
        t.no = no;
        titik.push(t);
        rintangan.push(cakramNomor(t, rr));   // nomor berikutnya menghindari yang ini
      });
      nomor = gambarNomor(renggangkan(titik, rr, segi), rr);
    }


    return (defs.length ? '<defs>' + defs.join('') + '</defs>' : '') + body.join('') + nomor;
  }

  /** Tampilan baku untuk pilihan jawaban: pose bangun + proyeksi khasnya. */
  function solidView(sd, faces, size, opts) {
    opts = opts || {};
    var proj = projectionFor(sd, size);
    var svg = solid(sd, faces, S.poseMatrix(sd), proj, opts);
    if (!opts.nomor) return { svg: svg, width: proj.width, height: proj.height };
    // nomor berada di luar bayangan bangun, jadi bingkainya diberi tepi
    var m = (opts.ukuranNomor || 11) * 2.6;
    return {
      svg: '<g transform="translate(' + num(m) + ',' + num(m) + ')">' + svg + '</g>',
      width: proj.width + m * 2, height: proj.height + m * 2
    };
  }

  /**
   * Tampilan pratinjau yang bisa diputar bebas oleh pengguna.
   * @param {Array} M matriks rotasi apa pun — bukan sudut, supaya putaran ke
   *        segala arah tidak punya batas dan tidak terkunci di kutub.
   */
  function solidSpin(sd, faces, size, M, opts) {
    var proj = ortho(size, 1.75);
    return {
      svg: solid(sd, faces, M, proj, opts || {}),
      width: proj.width, height: proj.height
    };
  }

  // ---------------------------------------------------------------- jaring-jaring

  /**
   * Gambar jaring-jaring dari daftar sel {face, poly, box} berkoordinat y-ke-ATAS.
   * @param {Array} cells sel jaring-jaring
   * @param {Array} faces keadaan tiap sisi {art, rot}
   */
  /**
   * Gambar jaring-jaring.
   *
   * Rusuk digambar dalam satu lapisan tersendiri, bukan per sisi, supaya bisa
   * dibedakan: rusuk yang dimiliki DUA sisi adalah garis LIPATAN dan digambar
   * putus-putus, sedangkan rusuk yang hanya dimiliki satu sisi adalah tepi luar
   * dan digambar penuh — mengikuti kelaziman gambar jaring-jaring.
   */
  function net(cells, faces, scale, opts) {
    opts = opts || {};
    // nomor duduk di luar petak, jadi bingkai gambar perlu dilebarkan
    var pad = opts.pad || (opts.nomor ? (opts.ukuranNomor || 11) * 2.6 : 0);
    var b = S.boundsOf(cells);
    var prefix = 'n' + (++uid) + '_';
    var body = [], defs = [];
    var stroke = opts.stroke || '#111111';
    var sw = opts.strokeWidth != null ? opts.strokeWidth : 2;

    function P(p) { return [pad + (p[0] - b.x0) * scale, pad + (b.y1 - p[1]) * scale]; }
    function D(v) { return [v[0] * scale, -v[1] * scale]; }

    var rusuk = {};
    function catat(a, b2) {
      var ka = a.map(function (v) { return Math.round(v * 1e6); }).join(',');
      var kb = b2.map(function (v) { return Math.round(v * 1e6); }).join(',');
      var k = ka < kb ? ka + '|' + kb : kb + '|' + ka;
      if (rusuk[k]) rusuk[k].n++;
      else rusuk[k] = { a: a, b: b2, n: 1 };
    }

    var segi = cells.map(function (c) { return c.poly.map(P); });

    cells.forEach(function (c, ci) {
      var titik = segi[ci];
      var box = { o: P(c.box.o), U: D(c.box.U), V: D(c.box.V) };
      var piece = facePiece(titik, box, faces && faces[c.face], opts, prefix + c.face, true,
        opts.warnaSisi && opts.warnaSisi[c.face]);
      body.push('<g data-face="' + c.face + '" class="net-face">' + piece.body + '</g>');
      if (piece.defs) defs.push(piece.defs);
      for (var i = 0; i < titik.length; i++) catat(titik[i], titik[(i + 1) % titik.length]);
    });

    // thumbnail terlalu kecil untuk garis putus-putus — di sana semua digambar penuh
    var pakaiPutus = opts.lipatan !== false && scale >= 22;

    /**
     * Pola putus-putus yang PAS sepanjang rusuknya: jumlah strip dibulatkan lalu
     * panjang strip disesuaikan, sehingga garis selalu mulai dan berakhir dengan
     * strip, tidak terpotong setengah. Satu pola tetap untuk semua rusuk membuat
     * rusuk pendek hanya kebagian dua-tiga strip panjang — di kertas itu terbaca
     * sebagai garis patah yang tidak rapi, bukan garis lipatan.
     */
    var periode = Math.min(9, Math.max(2.6, scale * 0.075));
    var ISI = 0.5;                       // bagian strip terhadap satu periode
    function polaPutus(panjang) {
      var jml = Math.max(3, Math.round(panjang / periode));
      var d = panjang / (jml + (jml - 1) * (1 - ISI) / ISI);
      return num(d) + ' ' + num(d * (1 - ISI) / ISI);
    }

    var luar = [], lipat = [];
    Object.keys(rusuk).forEach(function (k) {
      var r = rusuk[k];
      var awal = '<line x1="' + num(r.a[0]) + '" y1="' + num(r.a[1]) +
        '" x2="' + num(r.b[0]) + '" y2="' + num(r.b[1]) + '"';
      if (r.n > 1 && pakaiPutus) {
        var pj = Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]);
        lipat.push(awal + ' stroke-dasharray="' + polaPutus(pj) + '"/>');
      } else {
        luar.push(awal + '/>');
      }
    });

    var garis = '<g fill="none" stroke="' + stroke + '" stroke-width="' + sw +
      '" stroke-linecap="round">' + luar.join('') + '</g>';
    if (lipat.length) {
      garis += '<g fill="none" stroke="' + stroke + '" stroke-width="' + Math.max(0.9, sw * 0.7) +
        '" stroke-linecap="butt">' + lipat.join('') + '</g>';
    }

    // nomor sisi: di luar petaknya, tidak menutupi gambar mana pun
    var nomor = '';
    if (opts.nomor) {
      var rn = opts.ukuranNomor || 11;
      var daftar = [], rintangan = segi.slice();
      cells.forEach(function (c, ci) {
        var no = opts.nomor[c.face];
        if (!no) return;
        var fc = faces && faces[c.face];
        var t = titikNomor(segi[ci], rintangan, rn, !fc || Art.isBlank(fc.art));
        t.no = no;
        daftar.push(t);
        rintangan.push(cakramNomor(t, rn));   // nomor berikutnya menghindari yang ini
      });
      nomor = gambarNomor(renggangkan(daftar, rn, segi), rn);
    }

    return {
      svg: (defs.length ? '<defs>' + defs.join('') + '</defs>' : '') + body.join('') + garis + nomor,
      width: b.w * scale + pad * 2,
      height: b.h * scale + pad * 2
    };
  }

  /** Sel jaring-jaring untuk satu petak persegi pada editor papan (koordinat y-ke-atas). */
  function gridCell(face, r, c, rotCW) {
    var poly = [[c, -r], [c + 1, -r], [c + 1, -r - 1], [c, -r - 1]];
    var box = { o: [c, -r], U: [1, 0], V: [0, -1] };
    if (rotCW) {
      var a = -rotCW * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a);   // y-ke-atas: CW = sudut negatif
      var rot = function (v) { return [v[0] * cs - v[1] * sn, v[0] * sn + v[1] * cs]; };
      var ctr = [c + 0.5, -r - 0.5];
      var U = rot(box.U), V = rot(box.V);
      box = { o: [ctr[0] - (U[0] + V[0]) / 2, ctr[1] - (U[1] + V[1]) / 2], U: U, V: V };
    }
    return { face: face, poly: poly, box: box };
  }

  // ---------------------------------------------------------------- bangun datar penyusun

  /**
   * Gambar bangun datar penyusun sebuah bangun ruang: tiap bentuk berbeda
   * digambar sekali dengan keterangan jumlahnya, mis. "2×" segitiga "3×" persegi.
   */
  function shapes(list, box, opts) {
    opts = opts || {};
    var stroke = opts.stroke || '#111111';
    var sw = opts.strokeWidth != null ? opts.strokeWidth : 1.8;
    var gap = 12, labelW = 20, parts = [], x = 0, maxH = 0;

    // skala bersama supaya perbandingan ukuran antar bentuk tetap terbaca
    var span = 0;
    list.forEach(function (c) {
      c.poly.forEach(function (p) { span = Math.max(span, Math.abs(p[0]), Math.abs(p[1])); });
    });
    var k = (box / 2) / (span || 1);

    list.forEach(function (c) {
      var w = 0, h = 0;
      var pl = c.poly.map(function (p) { return [p[0] * k, p[1] * k]; });
      var xs = pl.map(function (p) { return p[0]; }), ys = pl.map(function (p) { return p[1]; });
      var x0 = Math.min.apply(null, xs), y0 = Math.min.apply(null, ys);
      w = Math.max.apply(null, xs) - x0; h = Math.max.apply(null, ys) - y0;
      parts.push(text(c.count + '×', x, box / 2 + 5, { size: 13, weight: 700 }));
      parts.push('<polygon points="' +
        pl.map(function (p) { return num(p[0] - x0 + x + labelW) + ',' + num(p[1] - y0 + (box - h) / 2); }).join(' ') +
        '" fill="#ffffff" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linejoin="round"/>');
      x += labelW + w + gap;
      maxH = Math.max(maxH, box);
    });

    return { svg: parts.join(''), width: Math.max(0, x - gap), height: maxH };
  }

  // ---------------------------------------------------------------- pembungkus

  /** Titik di dalam poligon 2D? (pancaran sinar, sah juga untuk poligon cekung) */
  function didalam(poly, x, y) {
    var masuk = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) masuk = !masuk;
    }
    return masuk;
  }

  /** Jarak titik ke tepi poligon, tanpa peduli di dalam atau di luar. */
  function jarakKeTepi(x, y, poly) {
    var d = Infinity;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var ax = poly[j][0], ay = poly[j][1];
      var ex = poly[i][0] - ax, ey = poly[i][1] - ay;
      var L = ex * ex + ey * ey;
      var t = L ? ((x - ax) * ex + (y - ay) * ey) / L : 0;
      t = Math.max(0, Math.min(1, t));
      d = Math.min(d, Math.hypot(x - (ax + t * ex), y - (ay + t * ey)));
    }
    return d;
  }

  /**
   * Titik paling "dalam" pada sebuah sisi: titik di dalam poligon yang jaraknya
   * ke tepi paling jauh. Dicari dengan penyisiran kisi lalu dipertajam, sebab
   * sisi bangun tak beraturan sering CEKUNG dan titik tengahnya bisa jatuh di
   * luar sisi itu sendiri.
   *
   * @returns {{x:number, y:number, d:number}} d = jarak ke tepi terdekat
   */
  function titikDalam(poly) {
    var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    poly.forEach(function (p) {
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[1] > y1) y1 = p[1];
    });
    var terbaik = { x: (x0 + x1) / 2, y: (y0 + y1) / 2, d: -1 }, i, j;
    var langkah = Math.max((x1 - x0), (y1 - y0)) / 12;
    for (i = x0 + langkah / 2; i < x1; i += langkah) {
      for (j = y0 + langkah / 2; j < y1; j += langkah) {
        if (!didalam(poly, i, j)) continue;
        var d = jarakKeTepi(i, j, poly);
        if (d > terbaik.d) terbaik = { x: i, y: j, d: d };
      }
    }
    // pertajam di sekitar pemenangnya
    for (var putaran = 0; putaran < 3; putaran++) {
      langkah /= 2.5;
      for (i = -2; i <= 2; i++) {
        for (j = -2; j <= 2; j++) {
          var x = terbaik.x + i * langkah, y = terbaik.y + j * langkah;
          if (!didalam(poly, x, y)) continue;
          var d2 = jarakKeTepi(x, y, poly);
          if (d2 > terbaik.d) terbaik = { x: x, y: y, d: d2 };
        }
      }
    }
    return terbaik;
  }

  /** Jarak titik ke poligon; 0 kalau titiknya di dalam. */
  function jarakKePoly(x, y, poly) {
    if (didalam(poly, x, y)) return 0;
    var d = Infinity;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var ax = poly[j][0], ay = poly[j][1];
      var ex = poly[i][0] - ax, ey = poly[i][1] - ay;
      var L = ex * ex + ey * ey;
      var t = L ? ((x - ax) * ex + (y - ay) * ey) / L : 0;
      t = Math.max(0, Math.min(1, t));
      d = Math.min(d, Math.hypot(x - (ax + t * ex), y - (ay + t * ey)));
    }
    return d;
  }

  /**
   * Tempat bulatan nomor: DI LUAR sisinya, menempel pada salah satu tepi luar,
   * dengan garis penunjuk pendek. Ditaruh di dalam sisi, bulatan sebesar ini pasti
   * menimpa simbol pada sisi yang kecil — dan simbol itulah yang harus terbaca.
   *
   * @param poly    poligon sisi yang dinomori (koordinat layar)
   * @param semua   semua poligon pada gambar, untuk memastikan bulatan tidak
   *                jatuh menimpa sisi tetangga
   */
  /** Poligon segidelapan yang membungkus bulatan nomor — dipakai sebagai rintangan. */
  function cakramNomor(t, r) {
    var out = [];
    for (var k = 0; k < 8; k++) {
      var a = k * Math.PI / 4;
      out.push([t.x + Math.cos(a) * r * 1.08, t.y + Math.sin(a) * r * 1.08]);
    }
    return out;
  }

  /**
   * @param bolehDalam sisi ini polos (tidak bergambar), jadi nomornya boleh
   *   diletakkan DI DALAM sisi. Aturan "nomor selalu di luar" ada semata untuk
   *   melindungi corak; pada bangun polos aturan itu justru merugikan — nomor
   *   menumpuk di tepi gambar dengan garis penunjuk panjang yang saling menyilang.
   */
  function titikNomor(poly, semua, r, bolehDalam) {
    var cx = 0, cy = 0, i;
    for (i = 0; i < poly.length; i++) { cx += poly[i][0]; cy += poly[i][1]; }
    cx /= poly.length; cy /= poly.length;

    // seluruh bulatan harus bebas, bukan hanya titik tengahnya
    function bebasPenuh(x, y) {
      for (var k = 0; k < semua.length; k++) {
        if (jarakKePoly(x, y, semua[k]) < r * 0.98) return false;
      }
      return true;
    }

    if (bolehDalam) {
      var dalam = titikDalam(poly);
      if (dalam.d >= r * 1.06) return { x: dalam.x, y: dalam.y, ax: dalam.x, ay: dalam.y };
    }

    var terbaik = null, skor = -1;
    for (i = 0; i < poly.length; i++) {
      var a = poly[i], b = poly[(i + 1) % poly.length];
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      var ex = b[0] - a[0], ey = b[1] - a[1];
      var pj = Math.hypot(ex, ey);
      if (pj < 1e-6) continue;
      var nx = -ey / pj, ny = ex / pj;
      if (nx * (mx - cx) + ny * (my - cy) < 0) { nx = -nx; ny = -ny; }   // arahkan keluar
      var jarak = [1.45, 1.15, 1.9, 2.4, 3.0];
      for (var j = 0; j < jarak.length; j++) {
        var d = r * jarak[j];
        var x = mx + nx * d, y = my + ny * d;
        if (!bebasPenuh(x, y)) continue;
        // tepi yang panjang lebih jelas menunjuk sisinya
        var nilai = pj - j * r * 0.6;
        if (nilai > skor) { skor = nilai; terbaik = { x: x, y: y, ax: mx, ay: my, kx: nx, ky: ny }; }
        break;
      }
    }
    if (terbaik) return terbaik;

    // Sisi yang terkepung sisi lain: nomornya dibawa keluar dari seluruh gambar
    // mengikuti sinar dari pusat gambar, dengan garis penunjuk yang lebih panjang.
    var gx = 0, gy = 0, jml = 0;
    semua.forEach(function (p) {
      p.forEach(function (v) { gx += v[0]; gy += v[1]; jml++; });
    });
    if (jml) { gx /= jml; gy /= jml; }
    var vx = cx - gx, vy = cy - gy, pj2 = Math.hypot(vx, vy);
    if (pj2 < 1e-6) { vx = 0; vy = -1; } else { vx /= pj2; vy /= pj2; }
    for (var s = 1; s <= 40; s++) {
      var lx = cx + vx * r * 0.6 * s, ly = cy + vy * r * 0.6 * s;
      if (bebasPenuh(lx, ly)) return { x: lx, y: ly, ax: cx, ay: cy, kx: vx, ky: vy };
    }
    return { x: cx, y: cy, ax: cx, ay: cy };
  }

  /**
   * Renggangkan bulatan yang berdempetan. Setiap dorongan dibatalkan kalau
   * membuat bulatan itu naik ke atas gambar — bebas dari gambar lebih penting
   * daripada jarak antar nomor.
   */
  function renggangkan(daftar, r, semua) {
    function bebas(t) {
      for (var m = 0; m < semua.length; m++) {
        if (jarakKePoly(t.x, t.y, semua[m]) < r * 0.98) return false;
      }
      return true;
    }
    function jauhkan(t, d) {
      if (t.kx === undefined) return;
      var x = t.x, y = t.y;
      t.x += t.kx * d; t.y += t.ky * d;
      if (!bebas(t)) { t.x = x; t.y = y; }
    }
    var awalBebas = daftar.map(bebas);
    var batas = r * 2.15;
    for (var putaran = 0; putaran < 24; putaran++) {
      var geser = false;
      for (var i = 0; i < daftar.length; i++) {
        for (var j = i + 1; j < daftar.length; j++) {
          var a = daftar[i], b = daftar[j];
          var dx = b.x - a.x, dy = b.y - a.y;
          var d = Math.hypot(dx, dy);
          if (d >= batas || d < 1e-9) continue;
          var dorong = (batas - d) / 2;
          dx /= d; dy /= d;
          var ax = a.x, ay = a.y, bx = b.x, by = b.y;
          a.x -= dx * dorong; a.y -= dy * dorong;
          b.x += dx * dorong; b.y += dy * dorong;
          // dorongan yang menaikkan nomor ke atas gambar diganti dengan
          // geseran menjauh dari sisinya, arah yang pasti tetap bebas
          if (awalBebas[i] && !bebas(a)) { a.x = ax; a.y = ay; jauhkan(a, dorong); }
          if (awalBebas[j] && !bebas(b)) { b.x = bx; b.y = by; jauhkan(b, dorong); }
          if (a.x !== ax || b.x !== bx || a.y !== ay || b.y !== by) geser = true;
        }
      }
      if (!geser) break;
    }
    return daftar;
  }

  /**
   * Bulatan nomor beserta garis penunjuknya. Garis selalu digambar dan berakhir
   * sedikit DI DALAM sisinya, supaya tidak ada keraguan nomor itu milik sisi yang
   * mana — pada jaring yang rapat, angka yang menempel saja masih bisa salah baca.
   */
  function gambarNomor(daftar, r) {
    return daftar.map(function (t) {
      var dx = t.ax - t.x, dy = t.ay - t.y;
      var d = Math.hypot(dx, dy);
      var garis = "";
      if (d > 1e-6) {
        var ux = dx / d, uy = dy / d;
        var ujungX = t.ax + ux * r * 0.75, ujungY = t.ay + uy * r * 0.75;
        garis = '<line x1="' + num(t.x + ux * r * 0.95) + '" y1="' + num(t.y + uy * r * 0.95) +
          '" x2="' + num(ujungX) + '" y2="' + num(ujungY) +
          '" stroke="#1f4fc4" stroke-width="' + num(r * 0.17) + '" stroke-linecap="round"/>';
      }
      return garis + labelNomor(t.x, t.y, t.no, r);
    }).join("");
  }

  /**
   * Warna sisi untuk gambar pembahasan bangun polos. Nadanya sengaja muda supaya
   * garis hitam dan bulatan nomor tetap terbaca di atasnya, dan cukup berjauhan
   * satu sama lain supaya dua sisi bersebelahan tidak pernah bernada mirip.
   */
  var PALET_SISI = [
    '#ffe0b2', '#c5e1f5', '#c8e6c9', '#f8bbd0', '#d1c4e9', '#fff59d',
    '#b2dfdb', '#ffccbc', '#cfd8dc', '#e6ee9c', '#d7ccc8', '#f0b7cd'
  ];

  /** Peta sisi -> warna untuk sebuah bangun. */
  function paletSisi(jumlah) {
    var out = {};
    for (var i = 0; i < jumlah; i++) out[i] = PALET_SISI[i % PALET_SISI.length];
    return out;
  }

  /** Bulatan bernomor: putih berbingkai supaya terbaca di atas corak apa pun. */
  function labelNomor(x, y, teksNomor, r) {
    r = r || 11;
    return '<g class="no-sisi"><circle cx="' + num(x) + '" cy="' + num(y) + '" r="' + num(r) +
      '" fill="#ffffff" stroke="#1f4fc4" stroke-width="' + num(r * 0.18) + '"/>' +
      '<text x="' + num(x) + '" y="' + num(y) + '" fill="#1f4fc4" font-size="' + num(r * 1.25) +
      '" font-family="Arial, Helvetica, sans-serif" font-weight="700" text-anchor="middle"' +
      ' dominant-baseline="central">' + Art.esc(teksNomor) + '</text></g>';
  }

  function doc(inner, w, h, opts) {
    opts = opts || {};
    var bg = opts.background ? '<rect width="100%" height="100%" fill="' + opts.background + '"/>' : '';
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + num(w) + '" height="' + num(h) +
      '" viewBox="0 0 ' + num(w) + ' ' + num(h) + '">' + bg + inner + '</svg>';
  }

  function text(str, x, y, opts) {
    opts = opts || {};
    return '<text x="' + num(x) + '" y="' + num(y) + '" fill="' + (opts.fill || '#111111') +
      '" font-size="' + (opts.size || 16) + '" font-family="' +
      (opts.family || 'Arial, Helvetica, sans-serif') + '"' +
      (opts.weight ? ' font-weight="' + opts.weight + '"' : '') +
      ' text-anchor="' + (opts.anchor || 'start') + '">' + Art.esc(str) + '</text>';
  }

  return {
    oblique: oblique, ortho: ortho, yawPitch: yawPitch, projectionFor: projectionFor,
    solid: solid, solidView: solidView, solidSpin: solidSpin,
    net: net, gridCell: gridCell, shapes: shapes, doc: doc, text: text, num: num,
    paletSisi: paletSisi
  };
});
