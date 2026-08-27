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

  function copyFaces(faces) {
    return faces.map(function (f) { return { art: f.art, rot: f.rot }; });
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
      if (!set[sig]) { set[sig] = true; list.push({ faces: rf, sig: sig }); }
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
        out.push({ faces: f, reason: 'dua sisi tertukar posisinya' });
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
        out.push({
          faces: f,
          reason: 'menampilkan ' + Art.label(base[h].art) + ' bersama ' +
            Art.label(base[vis[0] === i ? vis[1] : vis[0]].art) +
            ', padahal kedua sisi itu tidak bisa terlihat bersamaan'
        });
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
        out.push({
          faces: f,
          reason: 'arah gambar pada sisi ' + solid.faces[i].name.toLowerCase() + ' tidak sesuai'
        });
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
        out.push({
          faces: f,
          reason: Art.label(base[i].art) + ' muncul di dua sisi, padahal hanya ada satu'
        });
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
      return { kind: 'solid', faces: d.faces, correct: false, reason: d.reason, strategy: d.strategy, sig: d.sig };
    });
    items.push({ kind: 'solid', faces: answer.faces, correct: true, reason: '', strategy: 'kunci', sig: answer.sig });
    items = shuffle(items, rnd);

    var answerIndex = -1;
    items.forEach(function (it, i) { if (it.correct) answerIndex = i; });

    return {
      type: 'toSolid',
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
        out.push({ faces: sw, reason: 'letak dua sisinya tertukar, jadi hasil lipatannya berbeda' });

        var dup = copyFaces(faces);
        dup[j] = { art: faces[i].art, rot: faces[i].rot };
        out.push({
          faces: dup,
          reason: Art.label(faces[i].art) + ' terpasang di dua sisi, padahal hanya ada satu'
        });
      }
    }
    for (i = 0; i < n; i++) {
      if (Art.isBlank(faces[i].art)) continue;
      var steps = solid.faces[i].sides === 3 ? [120, 240] : [90, 180, 270];
      for (var k = 0; k < steps.length; k++) {
        if (Art.canonRot(faces[i].art, faces[i].rot + steps[k]) === Art.canonRot(faces[i].art, faces[i].rot)) continue;
        var sp = copyFaces(faces);
        sp[i] = { art: faces[i].art, rot: S.norm360(faces[i].rot + steps[k]) };
        out.push({
          faces: sp,
          reason: 'arah gambar pada satu sisi menghadap ke arah yang salah setelah dilipat'
        });
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
  function netChoicePolos(solid, nets, pool, opts) {
    opts = opts || {};
    var rnd = opts.rnd || Math.random;
    var count = opts.count || 5;
    var warnings = [];
    var kunciBentuk = S.shapeKey(solid);

    var lain = shuffle((pool || []).filter(function (k) {
      return k.nets && k.nets.length && S.shapeKey(k.solid) !== kunciBentuk;
    }), rnd);

    var items = [{
      kind: 'net', net: pick(nets, rnd), faces: solid.faces.map(function () { return { art: null, rot: 0 }; }),
      solidNet: solid, correct: true, reason: '', key: 'kunci'
    }];

    for (var i = 0; i < lain.length && items.length < count; i++) {
      var k = lain[i];
      items.push({
        kind: 'net', net: pick(k.nets, rnd),
        faces: k.solid.faces.map(function () { return { art: null, rot: 0 }; }),
        solidNet: k.solid, correct: false, key: k.solid.id + ':' + i,
        reason: 'itu jaring-jaring bangun lain — susunan sisinya ' + S.compositionText(k.solid) +
          ', sedangkan bangun pada soal butuh ' + S.compositionText(solid)
      });
    }

    if (items.length < count) {
      warnings.push('Hanya tersedia ' + (items.length - 1) + ' bangun pembanding yang bentuknya berbeda.');
    }

    items = shuffle(items, rnd);
    var answerIndex = -1;
    items.forEach(function (it, n) { if (it.correct) answerIndex = n; });

    return {
      type: 'toNet', polos: true, solid: solid, faces: null, options: items,
      answerIndex: answerIndex, answerLetter: String.fromCharCode(65 + answerIndex),
      warnings: warnings, describe: S.compositionText(solid)
    };
  }

  function generateNetChoice(solid, faces, nets, opts) {
    opts = opts || {};
    // bangun polos: bedanya hanya bentuk, jadi pengecoh diambil dari bangun lain
    var polos = !faces || faces.every(function (f) { return Art.isBlank(f.art); });
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

    // satu bentuk jaring berbeda untuk tiap pilihan, seperti soal aslinya
    var layouts = shuffle(nets.map(function (_, i) { return i; }), rnd);
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
        correct: false, reason: cands[c].reason, key: key
      });
    }

    if (items.length < count) {
      warnings.push('Hanya bisa dibuat ' + (items.length - 1) + ' pengecoh yang benar-benar salah. ' +
        'Tambahkan variasi gambar antar sisi.');
    }

    items = shuffle(items, rnd);
    var answerIndex = -1;
    items.forEach(function (it, k) { if (it.correct) answerIndex = k; });

    return {
      type: 'toNet', solid: solid, faces: faces, options: items,
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
    var pool = shuffle(others, rnd).filter(function (s) {
      var k = S.shapeKey(s);
      if (sudah[k]) return false;
      sudah[k] = true;
      return true;
    });

    var items = [{ kind: 'shape', solid: target, correct: true, reason: '' }];
    for (var i = 0; i < pool.length && items.length < count; i++) {
      items.push({
        kind: 'shape', solid: pool[i], correct: false,
        reason: 'itu ' + pool[i].name.toLowerCase() + ', jaring-jaringnya terdiri dari ' +
          ringkasSisi(pool[i]) + ' — tidak cocok dengan gambar'
      });
    }
    if (items.length < count) {
      warnings.push('Hanya tersedia ' + (items.length - 1) + ' bangun pembanding yang berbeda bentuk.');
    }

    items = shuffle(items, rnd);
    var answerIndex = -1;
    items.forEach(function (it, k) { if (it.correct) answerIndex = k; });

    return {
      type: 'toShape', solid: target, faces: null, options: items,
      answerIndex: answerIndex, answerLetter: String.fromCharCode(65 + answerIndex),
      warnings: warnings, describe: target.name.toLowerCase() + ' (' + ringkasSisi(target) + ')'
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
    var pool = shuffle(others, rnd).filter(function (s) {
      var k = S.compositionKey(s);
      if (seen[k]) return false;          // komposisinya sama dengan kunci -> bukan pengecoh
      seen[k] = true;
      return true;
    });

    var items = [{
      kind: 'faces', solid: target, comp: S.composition(target),
      correct: true, reason: '', key: tKey
    }];
    for (var i = 0; i < pool.length && items.length < count; i++) {
      items.push({
        kind: 'faces', solid: pool[i], comp: S.composition(pool[i]), correct: false,
        key: S.compositionKey(pool[i]),
        reason: 'itu susunan sisi ' + pool[i].name.toLowerCase() + ' (' + S.compositionText(pool[i]) + ')'
      });
    }
    if (items.length < count) {
      warnings.push('Hanya tersedia ' + (items.length - 1) + ' susunan bangun datar yang berbeda.');
    }

    items = shuffle(items, rnd);
    var answerIndex = -1;
    items.forEach(function (it, k) { if (it.correct) answerIndex = k; });

    return {
      type: 'toFaces', solid: target, faces: null, options: items,
      answerIndex: answerIndex, answerLetter: String.fromCharCode(65 + answerIndex),
      warnings: warnings, describe: S.compositionText(target)
    };
  }

  function ringkasSisi(solid) {
    var by = {};
    solid.faces.forEach(function (f) { by[f.sides] = (by[f.sides] || 0) + 1; });
    var nama = { 3: 'segitiga', 4: 'segiempat', 5: 'segilima', 6: 'segienam' };
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
    describeView: describeView, ringkasSisi: ringkasSisi, shuffle: shuffle
  };
});
