/*
 * quiz.js — membuat pilihan jawaban A-E dari sebuah bangun ruang yang sisinya sudah diisi.
 *
 * Jaminan kebenaran:
 *   1. Kunci jawaban adalah salah satu orientasi sah bangun ruang (grup rotasinya:
 *      24 untuk kubus, 12 untuk prisma segienam & limas segitiga, 6 prisma segitiga,
 *      4 untuk balok & limas segiempat).
 *   2. Setiap pengecoh dicek terhadap SELURUH orientasi sah. Kalau tampilannya cocok
 *      dengan salah satunya, pengecoh itu dibuang karena sebenarnya benar.
 *   3. Antar pilihan tidak boleh ada yang tampilannya kembar.
 * Perbandingan memakai Art.visualKey() yang memperhitungkan simetri putar gambar,
 * jadi lingkaran tidak dianggap "berubah" saat diputar.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./art.js'), require('./solids.js'));
  } else {
    root.Quiz = factory(root.Art, root.Solids);
  }
})(typeof self !== 'undefined' ? self : this, function (Art, S) {
  'use strict';

  // Gambar pembahasan mewarnai sisi yang sama dengan warna yang sama; tanpa corak,
  // warna itulah satu-satunya jejak yang bisa ditelusuri pembaca.
  var BANTUAN_WARNA = 'Pada gambar di atas, sisi yang sama diberi warna dan nomor yang sama pada kedua bangun — telusuri satu warna untuk melihat ke mana sisi itu melipat.';

  function copyFaces(faces) {
    return faces.map(function (f) { return { art: f.art, rot: f.rot }; });
  }

  // =================================================================
  // Penomoran sisi untuk pembahasan
  // =================================================================

  /**
   * Beri nomor pada tiap sisi. Sisi yang TERLIHAT pada gambar soal mendapat
   * nomor 1..k urut dari kiri ke kanan sebagaimana tampak di gambar, sisanya
   * menyusul. Pembahasan memakai nomor ini, dan gambar pada halaman pembahasan
   * mencantumkannya, sehingga pembaca tahu persis sisi mana yang dimaksud.
   */
  function susunNomor(solid) {
    var M = S.poseMatrix(solid);
    var layar = {};
    solid.faces.forEach(function (f) {
      var c = S.matVec(M, f.center);
      // proyeksi miring menggeser kedalaman ke arah kiri-kanan
      layar[f.index] = {
        x: c[0] - (solid.projection === 'oblique' ? c[2] * 0.38 : 0),
        y: -c[1]
      };
    });
    var urut = solid.visible.slice().sort(function (a, b) {
      return (layar[a].x - layar[b].x) || (layar[a].y - layar[b].y);
    });
    var nomor = {}, n = 1;
    urut.forEach(function (i) { nomor[i] = n++; });
    solid.faces.forEach(function (f) { if (!nomor[f.index]) nomor[f.index] = n++; });
    return nomor;
  }

  /** Sisi terlihat yang bertetangga dengan sisi `i` — untuk kalimat "menghadap sisi X". */
  function tetanggaTampak(solid, i) {
    var hasil = null;
    solid.edges.forEach(function (e) {
      if (hasil !== null) return;
      var lain = e.a === i ? e.b : (e.b === i ? e.a : null);
      if (lain !== null && solid.visible.indexOf(lain) >= 0) hasil = lain;
    });
    return hasil;
  }

  function namaSisi(quiz, i, label) {
    var nomor = (quiz.nomorSisi && quiz.nomorSisi[i]) || '?';
    return 'sisi ' + nomor + (label && label !== 'polos' ? ' (' + label + ')' : '');
  }

  /**
   * Susun kalimat pembahasan untuk satu pilihan yang salah, menyebut nomor sisi
   * yang tercantum pada gambar halaman pembahasan. Kalimat seperti "dua sisinya
   * tertukar" tidak menolong kalau pembaca tidak tahu sisi yang mana.
   */
  function teksAlasan(quiz, opt) {
    var a = opt.alasan;
    var huruf = 'opsi ' + String.fromCharCode(65 + quiz.options.indexOf(opt));
    if (!a) return opt.reason || '';
    var L = a.label || [];

    if (a.jenis === 'tukar') {
      return 'Pada ' + huruf + ', posisi ' + namaSisi(quiz, a.sisi[0], L[0]) + ' dan ' +
        namaSisi(quiz, a.sisi[1], L[1]) + ' tertukar. Ketika jaring-jaring dilipat, kedua sisi ' +
        'tersebut tidak akan berada pada posisi yang sama dengan bangun ruang pada soal.';
    }
    if (a.jenis === 'arah') {
      var t = tetanggaTampak(quiz.solid, a.sisi[0]);
      var salah = a.putar === 180 ? 'memiliki orientasi yang terbalik'
        : ((a.putar === 120 ? 'diputar sepertiga putaran'
          : a.putar === 240 ? 'diputar sepertiga putaran'
          : 'diputar seperempat putaran') +
           (a.putar === 90 || a.putar === 120 ? ' searah jarum jam'
            : ' berlawanan arah jarum jam'));
      return 'Pada ' + huruf + ', simbol pada ' + namaSisi(quiz, a.sisi[0], L[0]) + ' ' + salah +
        '. Setelah sisi tersebut dilipat ke posisi yang ' +
        'sesuai, arah simbol seharusnya menghadap ' +
        (t !== null ? 'sisi ' + (quiz.nomorSisi[t] || '?') : 'sisi di sebelahnya') +
        ' seperti pada bangun ruang soal.';
    }
    if (a.jenis === 'ganda') {
      var s0 = L[0] || 'simbol yang sama';
      return 'Pada ' + huruf + ', ' + s0 + ' muncul pada ' +
        namaSisi(quiz, a.sisi[0]) + ' dan ' + namaSisi(quiz, a.sisi[1]) +
        '. Pada bangun ruang soal simbol tersebut hanya menempati satu sisi, sehingga ' +
        'susunan ini tidak mungkin terbentuk dari lipatan.';
    }
    if (a.jenis === 'sembunyi') {
      var g = L[0] || 'gambar itu';
      return 'Pada ' + huruf + ', ' + namaSisi(quiz, a.sisi[0], L[0]) + ' menempati posisi yang ' +
        'pada bangun ruang soal ditempati ' + (a.labelAsli || 'gambar lain') + '. ' +
        g.charAt(0).toUpperCase() + g.slice(1) + ' sebenarnya berada di sisi ' +
        (quiz.nomorSisi[a.asal] || '?') + ', yang tidak tampak pada gambar bangun ruang soal, ' +
        'sehingga tidak mungkin muncul di posisi tersebut.';
    }
    if (a.jenis === 'bentuk') {
      var yangSalah = quiz.type === 'toShape'
        ? 'bangun ini tidak dapat dibentuk dari jaring-jaring pada soal'
        : quiz.type === 'toFaces'
          ? 'susunan ini bukan susunan sisi bangun ruang pada soal'
          : 'jaring ini tidak dapat membentuk bangun ruang pada soal';
      if (a.susunan !== a.susunanBenar) {
        return 'Pada ' + huruf + ', sisi-sisinya terdiri atas ' + a.susunan +
          ', sedangkan bangun ruang pada soal tersusun dari ' + a.susunanBenar +
          '. Susunan sisi yang berbeda tidak mungkin menghasilkan bangun yang sama.';
      }
      var beda = a.beda ? ': ' + a.beda : '';
      return 'Pada ' + huruf + ', jumlah dan jenis sisinya memang sama (' + a.susunan +
        '), tetapi proporsinya berbeda' + beda + '. Sisi yang ukurannya tidak sama tidak akan ' +
        'bertemu rapat ketika dilipat, jadi ' + yangSalah + '.';
    }
    return opt.reason || '';
  }

  /** Deretan nomor sisi menjadi kalimat: "sisi 1, sisi 2, dan sisi 3". */
  function deretSisi(quiz, daftar, faces) {
    var teks = daftar.map(function (i) {
      var lbl = faces && faces[i] && faces[i].art ? Art.label(faces[i].art) : null;
      return namaSisi(quiz, i, lbl);
    });
    if (teks.length <= 1) return teks[0] || '';
    return teks.slice(0, -1).join(', ') + (teks.length > 2 ? ', dan ' : ' dan ') + teks[teks.length - 1];
  }

  function bersebelahan(solid, i, j) {
    return solid.edges.some(function (e) {
      return (e.a === i && e.b === j) || (e.a === j && e.b === i);
    });
  }

  /** Adakah satu titik sudut yang dimiliki SEMUA sisi dalam daftar? */
  function titikBersama(solid, daftar) {
    if (daftar.length < 3) return false;
    var awal = solid.faces[daftar[0]].v;
    return awal.some(function (v) {
      return daftar.every(function (i) { return solid.faces[i].v.indexOf(v) >= 0; });
    });
  }

  /** Sisi yang sama sekali tidak bersinggungan dengan sisi `i` (berseberangan). */
  function seberang(solid, i) {
    var p = (solid.untouching || []).filter(function (q) { return q[0] === i || q[1] === i; });
    return p.length ? (p[0][0] === i ? p[0][1] : p[0][0]) : null;
  }

  /**
   * Mengapa pilihan yang BENAR itu benar.
   *
   * Menyatakan "opsi X dapat dilipat menjadi bangun pada soal" saja tidak
   * mengajarkan apa pun — pembaca tetap tidak tahu apa yang harus diperhatikan.
   * Kalimat di sini menyebut bukti yang bisa ditelusuri sendiri di gambar:
   * sisi mana bersebelahan dengan sisi mana, mana yang bertemu di satu titik
   * sudut, dan sisi mana yang melipat ke bagian yang tidak terlihat. Semuanya
   * dihitung dari geometri bangunnya, jadi tidak ada klaim yang tidak terbukti.
   */
  function alasanKunci(quiz) {
    var solid = quiz.solid, huruf = 'opsi ' + quiz.answerLetter;
    var nomor = quiz.nomorSisi || {};
    var out = [];
    var opsi = quiz.options[quiz.answerIndex] || {};

    if (quiz.type === 'toShape') {
      // Arah lipatannya dijelaskan menurut susunan bangunnya, bukan dengan satu
      // kalimat umum: prisma menutup keliling lewat pitanya, limas mengerucut ke
      // satu titik puncak. Keduanya dikenali dari geometri, bukan dari namanya.
      var st2 = S.strukturPrisma(solid);
      var segitiga = solid.faces.filter(function (f) { return f.sides === 3; }).length;
      var kalimat = 'Jaring-jaring pada soal tersusun dari ' + S.compositionText(solid) + '.';
      if (st2) {
        kalimat += ' Sisi tegaknya yang berjumlah ' + st2.gelang.length + ' berderet dalam satu ' +
          'pita; bila pita itu dilipat melingkar, kedua tutupnya bertemu di ujung atas dan bawah ' +
          'sehingga terbentuk bangun ruang pada ' + huruf + '.';
      } else if (segitiga === solid.faces.length - 1) {
        kalimat += ' Sisi segitiganya yang berjumlah ' + segitiga + ' dilipat ke atas dari tiap ' +
          'rusuk alas dan bertemu di satu titik puncak, sehingga terbentuk bangun ruang pada ' +
          huruf + '.';
      } else {
        kalimat += ' Bila seluruh sisinya dilipat pada rusuk bersamanya, sisi-sisi itu menutup ' +
          'rapat dan membentuk bangun ruang pada ' + huruf + '.';
      }
      out.push(kalimat);
      out.push(BANTUAN_WARNA);
      return out;
    }
    if (quiz.type === 'toFaces') {
      out.push('Bangun ruang pada soal dibatasi oleh ' + S.compositionText(solid) +
        ', yaitu susunan bangun datar pada ' + huruf + '. Sisi yang bentuknya sama dikelompokkan menjadi satu, meskipun ukurannya berbeda.');
      return out;
    }

    var keJaring = quiz.type === 'toNet';
    var faces = keJaring ? quiz.faces : (opsi.faces || quiz.faces);

    if (quiz.polos || !faces || faces.every(function (f) { return !f || Art.isBlank(f.art); })) {
      // Bangun polos: yang membedakan hanya bentuk, jadi buktinya susunan sisinya.
      var st = S.strukturPrisma(solid);
      var kalimat = (keJaring ? 'Jaring-jaring pada ' + huruf : 'Bangun ruang pada ' + huruf) +
        ' tersusun dari ' + S.compositionText(solid) + ', sama persis dengan bangun ruang pada soal.';
      if (st) {
        kalimat += ' Sisi tegaknya yang berjumlah ' + st.gelang.length +
          ' berderet dalam satu pita, dan kedua tutupnya menempel pada pita itu; bila pita dilipat melingkar, kedua tutup bertemu di ujung atas dan bawah.';
      }
      out.push(kalimat);
      out.push(BANTUAN_WARNA);
      return out;
    }

    out.push(keJaring
      ? 'Jaring-jaring pada ' + huruf + ' dapat dilipat sehingga menghasilkan susunan sisi yang sama dengan bangun ruang pada soal.'
      : 'Bangun ruang pada ' + huruf + ' merupakan hasil lipatan jaring-jaring pada soal, sehingga susunan sisinya sama.');

    // bukti yang bisa ditelusuri: sisi terlihat mana bersebelahan dengan mana
    var tampak = solid.visible.slice().sort(function (a, b) { return nomor[a] - nomor[b]; });
    if (tampak.length >= 2) {
      if (titikBersama(solid, tampak)) {
        out.push('Pada bangun ruang soal, ' + deretSisi(quiz, tampak, faces) +
          ' bertemu di satu titik sudut. Ketiganya juga saling bersebelahan pada jaring-jaring ' + huruf + ', jadi setelah dilipat letak dan arah simbolnya tepat sama.');
      } else {
        var rantai = [];
        for (var i = 0; i + 1 < tampak.length; i++) {
          if (bersebelahan(solid, tampak[i], tampak[i + 1])) {
            rantai.push(namaSisi(quiz, tampak[i], faces[tampak[i]] && Art.label(faces[tampak[i]].art)) +
              ' bersebelahan dengan ' +
              namaSisi(quiz, tampak[i + 1], faces[tampak[i + 1]] && Art.label(faces[tampak[i + 1]].art)));
          }
        }
        if (rantai.length) {
          // dua kaitan sudah cukup jadi bukti; merangkai seluruh sisi membuat
          // kalimatnya berbelit dan justru sulit ditelusuri
          out.push('Perhatikan bahwa ' + rantai.slice(0, 2).join(', serta ') +
            ' — hubungan yang sama juga terlihat pada jaring-jaring ' + huruf +
            ', dan tetap begitu setelah dilipat.');
        }
      }
    }

    // sisi yang melipat ke bagian tersembunyi
    var sembunyi = [];
    solid.faces.forEach(function (f) {
      if (solid.visible.indexOf(f.index) < 0) sembunyi.push(f.index);
    });
    sembunyi.sort(function (a, b) { return nomor[a] - nomor[b]; });
    if (sembunyi.length) {
      var akhir = deretSisi(quiz, sembunyi, faces);
      akhir = akhir.charAt(0).toUpperCase() + akhir.slice(1) +
        ' melipat ke bagian yang tidak terlihat pada gambar soal';
      var lawan = seberang(solid, tampak[0]);
      if (lawan !== null && sembunyi.indexOf(lawan) >= 0) {
        akhir += '; sisi ' + (nomor[lawan] || '?') + ' berseberangan dengan sisi ' +
          (nomor[tampak[0]] || '?') + ' sehingga keduanya tidak pernah tampak bersamaan';
      }
      out.push(akhir + '.');
    }
    return out;
  }

  /**
   * Apa yang membedakan dua bangun yang susunan sisinya sama?
   *
   * Sejak pengecoh diturunkan dari bentuk kuncinya, keduanya hampir selalu
   * bersusunan sisi sama persis — "susunannya berbeda" tidak lagi benar, dan
   * "ukurannya berbeda" terlalu samar untuk ditelusuri. Yang dibandingkan di sini
   * proporsinya: tinggi pita sisi tegak terhadap lebar tutupnya, lalu bentuk
   * tutupnya sendiri. Semuanya diukur dari geometri, bukan dari cara pengecohnya
   * dibuat, jadi tetap sahih untuk pengecoh yang berasal dari kolam bentuk lain.
   *
   * @returns {string|null} keterangan singkat, atau null kalau tidak ada yang menonjol
   */
  /** Nisbah kotak pembatas terurut — dipakai kalau bangunnya bukan prisma. */
  function nisbahKotak(sd) {
    var lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    sd.verts.forEach(function (v) {
      for (var i = 0; i < 3; i++) {
        if (v[i] < lo[i]) lo[i] = v[i];
        if (v[i] > hi[i]) hi[i] = v[i];
      }
    });
    var d = [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]].sort(function (x, y) { return x - y; });
    return d[0] / d[2];
  }

  function bedaProporsi(kunci, lain) {
    var a = S.strukturPrisma(kunci), b = S.strukturPrisma(lain);
    if (!a || !b) {
      // limas dan kawan-kawannya: yang bisa dibandingkan hanya kerampingannya
      var na = nisbahKotak(kunci), nb = nisbahKotak(lain);
      var d = (nb - na) / Math.max(na, nb);
      if (Math.abs(d) < 0.12) return null;
      return d > 0 ? 'bentuknya lebih gempal — tinggi dan lebarnya lebih berimbang'
        : 'bentuknya lebih ramping — selisih tinggi dan lebarnya lebih besar';
    }

    function ukur(sd, st) {
      var t1 = sd.faces[st.tutup[0]], t2 = sd.faces[st.tutup[1]];
      var tinggi = Math.abs(S.dot(S.sub(t2.center, t1.center), t1.normal));
      var lebar = Math.sqrt(Math.max(t1.area, t2.area));
      // sisi terpanjang : terpendek pada tutupnya = pipih atau tidaknya tutup itu
      var p = S.facePoly2D(t1), mn = Infinity, mx = 0;
      for (var i = 0; i < p.length; i++) {
        var q = p[(i + 1) % p.length];
        var L = Math.hypot(q[0] - p[i][0], q[1] - p[i][1]);
        mn = Math.min(mn, L); mx = Math.max(mx, L);
      }
      // kotak pembatas tutup: memanjang ke satu arah atau tidak
      var xs = p.map(function (q2) { return q2[0]; }), ys = p.map(function (q2) { return q2[1]; });
      var lb = Math.max.apply(null, xs) - Math.min.apply(null, xs);
      var dl = Math.max.apply(null, ys) - Math.min.apply(null, ys);
      return {
        ramping: tinggi / lebar,
        pipih: mx / Math.max(mn, 1e-9),
        lonjong: Math.max(lb, dl) / Math.max(Math.min(lb, dl), 1e-9)
      };
    }

    var A = ukur(kunci, a), B = ukur(lain, b);
    var dRamping = (B.ramping - A.ramping) / Math.max(A.ramping, B.ramping);
    var dPipih = (B.pipih - A.pipih) / Math.max(A.pipih, B.pipih);

    if (Math.abs(dRamping) >= 0.12 && Math.abs(dRamping) >= Math.abs(dPipih)) {
      return dRamping > 0 ? 'sisi tegaknya lebih tinggi dibanding lebar tutupnya'
        : 'sisi tegaknya lebih pendek dibanding lebar tutupnya';
    }
    if (Math.abs(dPipih) >= 0.12) {
      return dPipih > 0 ? 'tutupnya lebih pipih — ada rusuk yang jauh lebih panjang daripada yang lain'
        : 'tutupnya lebih rata — rusuknya lebih seragam panjangnya';
    }
    var dLonjong = (B.lonjong - A.lonjong) / Math.max(A.lonjong, B.lonjong);
    if (Math.abs(dLonjong) >= 0.10) {
      return dLonjong > 0 ? 'tutupnya memanjang ke satu arah, tidak sebulat tutup pada soal'
        : 'tutupnya lebih membulat, tidak memanjang seperti tutup pada soal';
    }
    return null;
  }

  /** Tanda tangan visual: gambar apa yang tampak pada tiap sisi yang terlihat. */
  function signature(solid, faces) {
    return solid.visible.map(function (i) {
      var f = faces[i] || {};
      return Art.visualKey(f.art, f.rot);
    }).join('#');
  }

  /** Semua tampilan sah bangun ini, satu per orientasi (yang kembar digabung). */
  function validViews(solid, faces) {
    var set = {}, list = [];
    solid.rotations.forEach(function (r) {
      var rf = S.applyRotation(faces, r);
      var sig = signature(solid, rf);
      if (!set[sig]) { set[sig] = true; list.push({ faces: rf, sig: sig, rot: r }); }
    });
    return { set: set, list: list };
  }

  function shuffle(arr, rnd) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor((rnd || Math.random)() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pick(arr, rnd) { return arr[Math.floor((rnd || Math.random)() * arr.length)]; }

  /**
   * Pilih tata letak jaring, mendahulukan yang sisi tegaknya berderet dalam satu
   * pita. Pita terputus membentuk L atau T yang terbaca seperti bangun melengkung,
   * padahal bangun ruangnya bersudut siku — pembaca jadi mencoretnya karena
   * bentuknya, bukan karena membayangkan lipatannya.
   */
  function pilihJaring(nets, rnd) {
    var lurus = nets.filter(function (j) { return j.lurus; });
    return pick(lurus.length ? lurus : nets, rnd);
  }

  /** Urutan indeks tata letak: pita utuh lebih dulu, masing-masing diacak. */
  function urutJaring(nets, rnd) {
    var lurus = [], sisa = [];
    nets.forEach(function (j, i) { (j.lurus ? lurus : sisa).push(i); });
    return shuffle(lurus, rnd).concat(shuffle(sisa, rnd));
  }

  /** Skor "enak dilihat": makin banyak sisi terisi dan berbeda, makin bagus. */
  function viewScore(solid, faces) {
    var keys = {}, filled = 0;
    solid.visible.forEach(function (i) {
      if (!Art.isBlank(faces[i].art)) filled++;
      keys[Art.visualKey(faces[i].art, faces[i].rot)] = true;
    });
    return filled * 2 + Object.keys(keys).length;
  }

  // ---------- strategi pengecoh ----------
  // Tiap strategi mengubah satu tampilan sah menjadi tampilan yang MUSTAHIL.

  function stratSwap(solid, base) {
    var out = [], vis = solid.visible;
    for (var a = 0; a < vis.length; a++) {
      for (var b = a + 1; b < vis.length; b++) {
        var f = copyFaces(base);
        var t = f[vis[a]]; f[vis[a]] = f[vis[b]]; f[vis[b]] = t;
        out.push({ faces: f, alasan: { jenis: 'tukar', sisi: [vis[a], vis[b]],
          label: [Art.label(base[vis[a]].art), Art.label(base[vis[b]].art)] } });
      }
    }
    return out;
  }

  /** Menaruh sisi yang seharusnya tersembunyi ke posisi yang terlihat. */
  function stratHidden(solid, base) {
    var out = [], vis = solid.visible;
    var hidden = [];
    solid.faces.forEach(function (f) { if (vis.indexOf(f.index) < 0) hidden.push(f.index); });
    vis.forEach(function (i) {
      hidden.forEach(function (h) {
        if (solid.faces[h].sides !== solid.faces[i].sides) return;
        if (Art.visualKey(base[h].art, base[h].rot) === Art.visualKey(base[i].art, base[i].rot)) return;
        var f = copyFaces(base);
        f[i] = { art: base[h].art, rot: base[h].rot };
        out.push({ faces: f, alasan: { jenis: 'sembunyi', sisi: [i], asal: h,
          label: [Art.label(base[h].art)], labelAsli: Art.label(base[i].art) } });
      });
    });
    return out;
  }

  function stratSpin(solid, base) {
    var out = [];
    solid.visible.forEach(function (i) {
      var art = base[i].art;
      if (Art.isBlank(art)) return;
      var steps = solid.faces[i].sides === 3 ? [120, 240, 180] : [90, 180, 270];
      steps.forEach(function (d) {
        // lewati kalau gambarnya memang tampak sama setelah diputar sejauh itu
        if (Art.canonRot(art, base[i].rot + d) === Art.canonRot(art, base[i].rot)) return;
        var f = copyFaces(base);
        f[i] = { art: art, rot: S.norm360(base[i].rot + d) };
        out.push({ faces: f, alasan: { jenis: 'arah', sisi: [i], putar: d, label: [Art.label(base[i].art)] } });
      });
    });
    return out;
  }

  function stratDuplicate(solid, base) {
    var out = [], vis = solid.visible;
    vis.forEach(function (i) {
      vis.forEach(function (j) {
        if (i === j || Art.isBlank(base[i].art)) return;
        if (solid.faces[i].sides !== solid.faces[j].sides) return;
        var f = copyFaces(base);
        f[j] = { art: base[i].art, rot: base[i].rot };
        out.push({ faces: f, alasan: { jenis: 'ganda', sisi: [i, j],
          label: [Art.label(base[i].art), Art.label(base[j].art)] } });
      });
    });
    return out;
  }

  var STRATEGIES = {
    swap: stratSwap, hidden: stratHidden, spin: stratSpin, duplicate: stratDuplicate
  };

  var DIFFICULTY = {
    mudah: ['hidden', 'duplicate', 'swap', 'spin'],
    sedang: ['hidden', 'swap', 'duplicate', 'spin'],
    sulit: ['spin', 'swap', 'hidden', 'duplicate']
  };

  /**
   * Buat satu soal.
   * @param {Object} solid hasil Solids.build
   * @param {Array} faces keadaan tiap sisi: {art, rot}
   */
  function generate(solid, faces, opts) {
    opts = opts || {};
    var rnd = opts.rnd || Math.random;
    var count = opts.count || 5;
    var order = DIFFICULTY[opts.difficulty] || DIFFICULTY.sedang;
    var warnings = [];

    var views = validViews(solid, faces);
    if (views.list.length === 1) {
      warnings.push('Semua tampilan bangun ini kelihatan sama, jadi tidak ada pengecoh yang bisa dibuat. ' +
        'Beri gambar berbeda pada minimal dua sisi.');
    }

    var best = -1, pool = [];
    views.list.forEach(function (v) {
      var s = viewScore(solid, v.faces);
      if (s > best) { best = s; pool = [v]; }
      else if (s === best) pool.push(v);
    });
    var answer = pick(pool, rnd);

    var bases = shuffle(views.list, rnd).slice(0, 8);
    if (bases.indexOf(answer) === -1) bases.unshift(answer);

    var used = {}, buckets = {};
    used[answer.sig] = true;
    order.forEach(function (name) { buckets[name] = []; });

    bases.forEach(function (base) {
      order.forEach(function (name) {
        STRATEGIES[name](solid, base.faces).forEach(function (cand) {
          var sig = signature(solid, cand.faces);
          if (views.set[sig]) return;   // ternyata tampilan sah -> bukan pengecoh
          if (used[sig]) return;        // kembar dengan pilihan lain
          used[sig] = true;
          cand.sig = sig;
          cand.strategy = name;
          buckets[name].push(cand);
        });
      });
    });

    // ambil bergiliran antar strategi supaya jenis kesalahannya bervariasi
    var need = count - 1, distractors = [], round = 0;
    while (distractors.length < need && round < 40) {
      var added = false;
      for (var i = 0; i < order.length && distractors.length < need; i++) {
        var b = buckets[order[i]];
        if (b.length) {
          distractors.push(b.splice(Math.floor(rnd() * b.length), 1)[0]);
          added = true;
        }
      }
      if (!added) break;
      round++;
    }

    if (distractors.length < need) {
      warnings.push('Hanya bisa dibuat ' + distractors.length + ' pengecoh yang benar-benar salah, ' +
        'jadi soal ini punya ' + (distractors.length + 1) + ' pilihan. ' +
        'Tambahkan variasi gambar antar sisi untuk mendapatkan ' + count + ' pilihan.');
    }

    var items = distractors.map(function (d) {
      return { kind: 'solid', faces: d.faces, correct: false, reason: d.reason,
        alasan: d.alasan, strategy: d.strategy, sig: d.sig };
    });
    items.push({ kind: 'solid', faces: answer.faces, correct: true, reason: '', strategy: 'kunci', sig: answer.sig });
    items = shuffle(items, rnd);

    var answerIndex = -1;
    items.forEach(function (it, i) { if (it.correct) answerIndex = i; });

    var nomorGeo = susunNomor(solid);
    var nomorNet = {};
    solid.faces.forEach(function (f) {
      var g = answer.rot ? answer.rot.map[f.index] : f.index;
      nomorNet[f.index] = nomorGeo[g];
    });

    return {
      type: 'toSolid', nomorSisi: nomorGeo, nomorNet: nomorNet,
      solid: solid, faces: faces, options: items, answerIndex: answerIndex,
      answerLetter: String.fromCharCode(65 + answerIndex),
      warnings: warnings, describe: describeView(solid, answer.faces)
    };
  }

  function describeView(solid, faces) {
    return solid.visible.map(function (i) {
      return solid.faces[i].name.toLowerCase() + ' = ' + Art.label(faces[i].art);
    }).join(', ');
  }

  // =================================================================
  // TIPE B — diberi bangun ruang, pilih JARING-JARING yang benar
  // =================================================================

  /**
   * Sebuah jaring-jaring benar bila hasil lipatannya DAPAT diputar sehingga
   * tampak persis seperti gambar pada soal. Penilaian memakai sisi yang terlihat
   * saja, karena sisi tersembunyi memang tidak bisa dinilai oleh penjawab.
   */
  function netIsValid(solid, trueSig, candFaces) {
    return validViews(solid, candFaces).set[trueSig] === true;
  }

  function scrambles(solid, faces) {
    var out = [], n = solid.faces.length, i, j;
    for (i = 0; i < n; i++) {
      for (j = i + 1; j < n; j++) {
        if (solid.faces[i].sides !== solid.faces[j].sides) continue;
        if (Art.visualKey(faces[i].art, faces[i].rot) === Art.visualKey(faces[j].art, faces[j].rot)) continue;
        var sw = copyFaces(faces);
        var t = sw[i]; sw[i] = sw[j]; sw[j] = t;
        out.push({ faces: sw, alasan: { jenis: 'tukar', sisi: [i, j],
          label: [Art.label(faces[i].art), Art.label(faces[j].art)] } });

        var dup = copyFaces(faces);
        dup[j] = { art: faces[i].art, rot: faces[i].rot };
        out.push({ faces: dup, alasan: { jenis: 'ganda', sisi: [i, j],
          label: [Art.label(faces[i].art), Art.label(faces[j].art)] } });
      }
    }
    for (i = 0; i < n; i++) {
      if (Art.isBlank(faces[i].art)) continue;
      var steps = solid.faces[i].sides === 3 ? [120, 240] : [90, 180, 270];
      for (var k = 0; k < steps.length; k++) {
        if (Art.canonRot(faces[i].art, faces[i].rot + steps[k]) === Art.canonRot(faces[i].art, faces[i].rot)) continue;
        var sp = copyFaces(faces);
        sp[i] = { art: faces[i].art, rot: S.norm360(faces[i].rot + steps[k]) };
        out.push({ faces: sp, alasan: { jenis: 'arah', sisi: [i], putar: steps[k], label: [Art.label(faces[i].art)] } });
      }
    }
    return out;
  }

  /**
   * @param {Object} solid bangun ruang
   * @param {Array} faces isi tiap sisi
   * @param {Array} nets daftar jaring-jaring (hasil Solids.nets)
   */
  /**
   * Tipe B untuk bangun POLOS (tanpa gambar sisi).
   *
   * Karena semua sisi kosong, pengecoh tidak bisa dibuat dengan menukar gambar —
   * yang membedakan hanyalah BENTUK. Jadi pengecohnya diambil dari jaring-jaring
   * bangun lain yang susunan sisinya berbeda.
   *
   * Jaminan: hasil lipatan sebuah jaring-jaring pasti punya kumpulan sisi yang
   * sama persis dengan jaring itu. Maka jaring milik bangun yang kumpulan sisinya
   * berbeda MUSTAHIL terlipat menjadi bangun pada soal — tanpa perlu mencoba.
   */
  /**
   * Pengecoh untuk bangun polos, diturunkan dari bentuk KUNCINYA sendiri.
   *
   * Mengambil pengecoh dari bangun lain di kolam membuat soalnya bocor: pada soal
   * prisma segidelapan, pengecoh berjumlah sisi sama pun tutupnya bisa berupa blok
   * bertakik, sehingga penjawab mencoretnya dari bentuk tutupnya saja. Turunan
   * berpola sama persis — tutup sejenis, pita sisi tegak sejenis — dan hanya
   * berbeda proporsi, jadi harus benar-benar dicocokkan.
   *
   * Kalau turunannya kurang (bangun yang bukan prisma tidak punya), kolam bentuk
   * lain tetap dipakai sebagai cadangan.
   */
  function pengecohTurunan(solid, jumlah, rnd) {
    var benih = Math.floor((rnd || Math.random)() * 1e6) + 1;
    return S.variasiBentuk(solid, jumlah, benih)
      .map(function (t) { return { solid: t, nets: S.nets(t, 8) }; })
      .filter(function (t) { return t.nets.length; });
  }
  function netChoicePolos(solid, nets, pool, opts) {
    opts = opts || {};
    var rnd = opts.rnd || Math.random;
    var count = opts.count || 5;
    var warnings = [];
    var kunciBentuk = S.shapeKey(solid);

    var sudah = {};
    sudah[kunciBentuk] = true;
    var kandidat = (pool || []).filter(function (k) {
      if (!k.nets || !k.nets.length) return false;
      var s = S.shapeKey(k.solid);
      if (sudah[s]) return false;      // buang yang kembar dengan kunci maupun sesama pengecoh
      sudah[s] = true;
      return true;
    });
    // Ambil dari sekumpulan bentuk PALING MIRIP, lalu diacak. Kalau pengecohnya
    // jauh berbeda (mis. limas untuk soal prisma) penjawab bisa mencoretnya tanpa
    // berpikir; yang mirip memaksa mencocokkan penampang dan menghitung sisi.

    // Turunan bentuk kunci lebih dulu; kolam bentuk lain hanya cadangan.
    var turunan = pengecohTurunan(solid, count + 2, rnd);
    kandidat = turunan.length >= count - 1 ? turunan : turunan.concat(kandidat);

    // Jaring yang melengkung hanya dipasangkan dengan jaring yang melengkung.
    // Bangun kotak berpengecoh jaring kipas langsung ketahuan tanpa perlu
    // membayangkan lipatannya — dan sebaliknya.
    var lengkungKunci = S.jaringMelengkung(solid);
    var sekelas = kandidat.filter(function (k) {
      return S.jaringMelengkung(k.solid) === lengkungKunci;
    });
    if (sekelas.length >= count - 1) kandidat = sekelas;

    var lain = shuffle(S.urutMirip(solid, kandidat).slice(0, Math.max(count * 2, 8)), rnd);

    var items = [{
      kind: 'net', net: pilihJaring(nets, rnd), faces: solid.faces.map(function () { return { art: null, rot: 0 }; }),
      solidNet: solid, correct: true, reason: '', key: 'kunci'
    }];

    for (var i = 0; i < lain.length && items.length < count; i++) {
      var k = lain[i];
      items.push({
        kind: 'net', net: pilihJaring(k.nets, rnd),
        faces: k.solid.faces.map(function () { return { art: null, rot: 0 }; }),
        solidNet: k.solid, correct: false, key: k.solid.id + ':' + i,
        alasan: { jenis: 'bentuk', susunan: S.compositionText(k.solid),
          susunanBenar: S.compositionText(solid), beda: bedaProporsi(solid, k.solid) }
      });
    }

    if (items.length < count) {
      warnings.push('Hanya tersedia ' + (items.length - 1) + ' bangun pembanding yang bentuknya berbeda.');
    }

    items = shuffle(items, rnd);
    var answerIndex = -1;
    items.forEach(function (it, n) { if (it.correct) answerIndex = n; });

    var nomorPolos = susunNomor(solid);
    return {
      type: 'toNet', polos: true, nomorSisi: nomorPolos, nomorNet: nomorPolos,
      solid: solid, faces: null, options: items,
      answerIndex: answerIndex, answerLetter: String.fromCharCode(65 + answerIndex),
      warnings: warnings, describe: S.compositionText(solid)
    };
  }

  function generateNetChoice(solid, faces, nets, opts) {
    opts = opts || {};
    // Bangun polos: bedanya hanya bentuk, jadi pengecoh diambil dari bangun lain.
    // Penandanya diambil dari bangunnya sendiri lebih dulu — menyimpulkannya dari
    // corak saja membuat satu sisi tersisa bisa membelokkan seluruh jenis soal.
    var polos = !!solid.polos || !faces || faces.every(function (f) { return Art.isBlank(f.art); });
    if (polos && opts.pool && opts.pool.length) {
      return netChoicePolos(solid, nets, opts.pool, opts);
    }
    var rnd = opts.rnd || Math.random;
    var count = opts.count || 5;
    var warnings = [];
    var trueSig = signature(solid, faces);

    if (!nets || !nets.length) {
      return { type: 'toNet', solid: solid, faces: faces, options: [], answerIndex: -1, answerLetter: '-',
        warnings: ['Bangun ini belum punya jaring-jaring yang bisa digambar.'], describe: '' };
    }

    // satu bentuk jaring berbeda untuk tiap pilihan, seperti soal aslinya,
    // dan pita utuh dipakai lebih dulu supaya tidak ada yang tampak membelok
    var layouts = urutJaring(nets, rnd);
    var pool = [];
    for (var i = 0; i < count; i++) pool.push(layouts[i % layouts.length]);

    var items = [{
      kind: 'net', net: nets[pool[0]], faces: copyFaces(faces),
      correct: true, reason: '', key: pool[0] + '|' + faceKey(solid, faces)
    }];

    var cands = shuffle(scrambles(solid, faces), rnd);
    var used = {};
    used[items[0].key] = true;
    for (var c = 0; c < cands.length && items.length < count; c++) {
      if (netIsValid(solid, trueSig, cands[c].faces)) continue;   // ternyata benar juga
      var layout = pool[items.length];
      var key = layout + '|' + faceKey(solid, cands[c].faces);
      if (used[key]) continue;
      used[key] = true;
      items.push({
        kind: 'net', net: nets[layout], faces: cands[c].faces,
        correct: false, reason: cands[c].reason, alasan: cands[c].alasan, key: key
      });
    }

    if (items.length < count) {
      warnings.push('Hanya bisa dibuat ' + (items.length - 1) + ' pengecoh yang benar-benar salah. ' +
        'Tambahkan variasi gambar antar sisi.');
    }

    items = shuffle(items, rnd);
    var answerIndex = -1;
    items.forEach(function (it, k) { if (it.correct) answerIndex = k; });

    var nomorB = susunNomor(solid);
    return {
      type: 'toNet', nomorSisi: nomorB, nomorNet: nomorB, solid: solid, faces: faces, options: items,
      answerIndex: answerIndex, answerLetter: String.fromCharCode(65 + answerIndex),
      warnings: warnings, describe: describeView(solid, faces)
    };
  }

  function faceKey(solid, faces) {
    return faces.map(function (f) { return Art.visualKey(f.art, f.rot); }).join(',');
  }

  // =================================================================
  // TIPE C — diberi jaring-jaring, pilih BENTUK bangun ruangnya
  // =================================================================

  /**
   * @param {Object} target bangun yang benar
   * @param {Array} others kandidat bangun lain (sudah dibangun)
   */
  function generateShapeChoice(target, others, opts) {
    opts = opts || {};
    var rnd = opts.rnd || Math.random;
    var count = opts.count || 5;
    var warnings = [];
    var tKey = S.shapeKey(target);

    // buang bangun yang sebenarnya kongruen dengan jawaban (mis. balok 1:1:1 = kubus)
    // Disaring HANYA lewat sidik bentuk, bukan id: semua bangun tak beraturan
    // memakai id yang sama ('acak') padahal bentuknya berbeda-beda. Penyaringan
    // juga membuang bentuk yang kembar SESAMA pengecoh, bukan hanya yang kembar
    // dengan kunci — dua bentuk acak bisa kebetulan kongruen.
    var sudah = {};
    sudah[tKey] = true;
    var kandidat = others.filter(function (s) {
      var k = S.shapeKey(s);
      if (sudah[k]) return false;      // kembar dengan kunci atau sesama pengecoh
      sudah[k] = true;
      return true;
    });
    // TIPE C TIDAK memakai turunan proporsi seperti tipe B.
    //
    // Pada tipe B soal menunjukkan bangun ruangnya dan pilihannya berupa jaring:
    // jaring digambar besar dan mendatar, jadi selisih proporsi 20% masih terbaca,
    // sedangkan pengecoh bertutup lain jenis membuat soalnya bocor.
    //
    // Di sini kebalikannya. Soal menunjukkan JARING, pilihannya bangun ruang kecil,
    // dan tiap gambar diskalakan ke kotaknya sendiri sehingga selisih ukuran lenyap
    // sama sekali — lima prisma yang hanya berbeda proporsi tampak kembar. Lagi pula
    // pengecoh berjumlah sisi lain TIDAK membocorkan jawaban di sini: jumlah sisi
    // bangunnya hanya bisa diketahui dengan menghitung petak pada jaring soal, dan
    // itu justru keterampilan yang diuji.

    // Jaring pada soal memperlihatkan apakah bangunnya menirus (pitanya membuka
    // seperti kipas) atau tegak (pitanya lurus). Pengecoh dari kelas yang lain
    // langsung tercoret tanpa perlu membayangkan lipatannya, jadi hanya bangun
    // sekelas yang dipakai selama jumlahnya cukup.
    var lengkungKunci = S.jaringMelengkung(target);
    var sekelas = kandidat.filter(function (k) { return S.jaringMelengkung(k) === lengkungKunci; });
    if (sekelas.length >= count - 1) kandidat = sekelas;

    // pengecoh diambil dari bentuk yang paling menyerupai kunci
    // Diambil lebih banyak calon daripada tipe lain: penyaring "tampak kembar"
    // di bawah menolak cukup banyak, dan kalau calonnya habis syaratnya terpaksa
    // dilonggarkan — yang justru memunculkan pilihan kembar yang mau dihindari.
    var pool = shuffle(S.urutMirip(target, kandidat).slice(0, Math.max(count * 6, 24)), rnd);

    /**
     * Sidik "seperti apa gambarnya": jumlah sisi + bentuk tutupnya.
     *
     * Yang membuat dua pilihan tampak kembar adalah tutup yang sama bentuknya —
     * sisanya tinggal beda tinggi, dan tinggi lenyap karena tiap gambar diskalakan
     * ke kotaknya sendiri. Bentuk tutup disidik dari panjang rusuknya yang
     * dinormalkan ke keliling lalu dibulatkan kasar, jadi bebas ukuran: dua tutup
     * sebangun bersidik sama, tutup segienam siku dan segienam zigzag tidak.
     */
    function sidikTampak(sd) {
      var st = S.strukturPrisma(sd), muka;
      if (st) muka = sd.faces[st.tutup[0]];
      else {
        muka = sd.faces[0];
        sd.faces.forEach(function (f) { if (f.area > muka.area) muka = f; });
      }
      var p = S.facePoly2D(muka), keliling = 0, L = [];
      for (var i = 0; i < p.length; i++) {
        var q = p[(i + 1) % p.length];
        var d = Math.hypot(q[0] - p[i][0], q[1] - p[i][1]);
        L.push(d); keliling += d;
      }
      L = L.map(function (d) { return Math.round(d / keliling * 20); })
        .sort(function (x, y) { return x - y; });
      return sd.faces.length + '|' + p.length + '|' + L.join(',');
    }

    var items = [{ kind: 'shape', solid: target, correct: true, reason: '' }];
    var tampak = {};
    tampak[sidikTampak(target)] = 1;
    var sisiKunci = target.faces.length;

    /**
     * Isi pilihan bertahap. Tahap ketat menolak pengecoh yang tampak kembar dan
     * membatasi berapa yang boleh berjumlah sisi sama dengan kunci; kalau kolam
     * bentuknya kecil dan pilihan belum genap, syaratnya dilonggarkan setahap.
     * Lebih baik satu pengecoh yang agak mirip daripada soal berpilihan empat.
     */
    function isi(tolakKembar, batasSamaSisi) {
      var samaSisi = 0;
      for (var i = 0; i < pool.length && items.length < count; i++) {
        var sid = sidikTampak(pool[i]);
        if (tolakKembar && tampak[sid]) continue;
        var sama = pool[i].faces.length === sisiKunci;
        if (sama && ++samaSisi > batasSamaSisi) continue;
        if (items.some(function (it) { return it.solid === pool[i]; })) continue;
        tampak[sid] = 1;
        items.push({
          kind: 'shape', solid: pool[i], correct: false,
          // Menyebut namanya saja tidak menolong ketika kunci dan pengecoh
          // sama-sama "bangun tak beraturan" — yang membedakan susunan sisinya.
          alasan: { jenis: 'bentuk', susunan: S.compositionText(pool[i]),
            susunanBenar: S.compositionText(target), beda: bedaProporsi(target, pool[i]) }
        });
      }
    }

    isi(true, 2);
    if (items.length < count) isi(true, count);
    if (items.length < count) isi(false, count);

    if (items.length < count) {
      warnings.push('Hanya tersedia ' + (items.length - 1) + ' bangun pembanding yang berbeda bentuk.');
    }

    items = shuffle(items, rnd);
    var answerIndex = -1;
    items.forEach(function (it, k) { if (it.correct) answerIndex = k; });

    var nomorBentuk = susunNomor(target);
    return {
      type: 'toShape', nomorSisi: nomorBentuk, nomorNet: nomorBentuk,
      solid: target, faces: null, options: items,
      answerIndex: answerIndex, answerLetter: String.fromCharCode(65 + answerIndex),
      warnings: warnings, describe: target.name.toLowerCase() + ' (' + S.compositionText(target) + ')'
    };
  }

  // =================================================================
  // TIPE D — diberi bangun ruang, pilih BANGUN DATAR penyusunnya
  // =================================================================

  /**
   * @param {Object} target bangun yang benar
   * @param {Array} others kandidat bangun lain (dipakai komposisi sisinya sebagai pengecoh)
   */
  function generateFaceChoice(target, others, opts) {
    opts = opts || {};
    var rnd = opts.rnd || Math.random;
    var count = opts.count || 5;
    var warnings = [];
    var tKey = S.compositionKey(target);

    var seen = {};
    seen[tKey] = true;
    var kandidat = others.filter(function (s) {
      var k = S.compositionKey(s);
      if (seen[k]) return false;          // komposisinya sama dengan kunci -> bukan pengecoh
      seen[k] = true;
      return true;
    });
    // susunan yang berdekatan (beda satu-dua sisi saja) jauh lebih menantang
    var pool = shuffle(S.urutMirip(target, kandidat).slice(0, Math.max(count * 2, 8)), rnd);

    var items = [{
      kind: 'faces', solid: target, comp: S.composition(target),
      correct: true, reason: '', key: tKey
    }];
    for (var i = 0; i < pool.length && items.length < count; i++) {
      items.push({
        kind: 'faces', solid: pool[i], comp: S.composition(pool[i]), correct: false,
        key: S.compositionKey(pool[i]),
        alasan: { jenis: 'bentuk', susunan: S.compositionText(pool[i]), susunanBenar: S.compositionText(target) }
      });
    }
    if (items.length < count) {
      warnings.push('Hanya tersedia ' + (items.length - 1) + ' susunan bangun datar yang berbeda.');
    }

    items = shuffle(items, rnd);
    var answerIndex = -1;
    items.forEach(function (it, k) { if (it.correct) answerIndex = k; });

    return {
      type: 'toFaces', nomorSisi: susunNomor(target), solid: target, faces: null, options: items,
      answerIndex: answerIndex, answerLetter: String.fromCharCode(65 + answerIndex),
      warnings: warnings, describe: S.compositionText(target)
    };
  }

  function ringkasSisi(solid) {
    var by = {};
    solid.faces.forEach(function (f) { by[f.sides] = (by[f.sides] || 0) + 1; });
    var nama = {
      3: 'segitiga', 4: 'segiempat', 5: 'segilima', 6: 'segienam',
      7: 'segitujuh', 8: 'segidelapan', 9: 'segisembilan', 10: 'segisepuluh',
      11: 'segisebelas', 12: 'segidua belas'
    };
    return Object.keys(by).sort().map(function (k) {
      return by[k] + ' ' + (nama[k] || 'segi-' + k);
    }).join(' + ');
  }

  /** Pemeriksaan mandiri untuk soal tipe B dan C. */
  function auditAlt(quiz) {
    var validCount = 0, dupes = 0, seen = {};
    if (quiz.type === 'toNet' && quiz.polos) {
      // sah bila jaring itu memang milik bangun yang kumpulan sisinya sama
      var kb = S.shapeKey(quiz.solid);
      quiz.options.forEach(function (o) {
        if (o.solidNet && S.shapeKey(o.solidNet) === kb) validCount++;
        if (seen[o.key]) dupes++;
        seen[o.key] = true;
      });
    } else if (quiz.type === 'toNet') {
      var trueSig = signature(quiz.solid, quiz.faces);
      quiz.options.forEach(function (o) {
        if (netIsValid(quiz.solid, trueSig, o.faces)) validCount++;
        if (seen[o.key]) dupes++;
        seen[o.key] = true;
      });
    } else if (quiz.type === 'toFaces') {
      var cKey = S.compositionKey(quiz.solid);
      quiz.options.forEach(function (o) {
        if (S.compositionKey(o.solid) === cKey) validCount++;
        if (seen[o.key]) dupes++;
        seen[o.key] = true;
      });
    } else {
      var tKey = S.shapeKey(quiz.solid);
      quiz.options.forEach(function (o) {
        var k = S.shapeKey(o.solid);
        if (k === tKey) validCount++;
        if (seen[k]) dupes++;
        seen[k] = true;
      });
    }
    return {
      ok: validCount === 1 && dupes === 0 && quiz.answerIndex >= 0,
      validCount: validCount, duplicates: dupes,
      answerIsValid: quiz.options[quiz.answerIndex] ? quiz.options[quiz.answerIndex].correct === true : false
    };
  }

  /** Pemeriksaan mandiri: pastikan tepat satu pilihan yang sah. */
  function audit(quiz) {
    var views = validViews(quiz.solid, quiz.faces);
    var validCount = 0, dupes = 0, seen = {};
    quiz.options.forEach(function (o) {
      var sig = signature(quiz.solid, o.faces);
      if (views.set[sig]) validCount++;
      if (seen[sig]) dupes++;
      seen[sig] = true;
    });
    return {
      ok: validCount === 1 && dupes === 0,
      validCount: validCount, duplicates: dupes,
      answerIsValid: views.set[signature(quiz.solid, quiz.options[quiz.answerIndex].faces)] === true
    };
  }

  return {
    signature: signature, validViews: validViews, generate: generate,
    generateNetChoice: generateNetChoice, generateShapeChoice: generateShapeChoice,
    generateFaceChoice: generateFaceChoice,
    netIsValid: netIsValid, audit: audit, auditAlt: auditAlt,
    describeView: describeView, ringkasSisi: ringkasSisi, shuffle: shuffle,
    susunNomor: susunNomor, teksAlasan: teksAlasan, namaSisi: namaSisi,
    alasanKunci: alasanKunci
  };
});
