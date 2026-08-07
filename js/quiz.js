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
      return { faces: d.faces, correct: false, reason: d.reason, strategy: d.strategy, sig: d.sig };
    });
    items.push({ faces: answer.faces, correct: true, reason: '', strategy: 'kunci', sig: answer.sig });
    items = shuffle(items, rnd);

    var answerIndex = -1;
    items.forEach(function (it, i) { if (it.correct) answerIndex = i; });

    return {
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
    audit: audit, describeView: describeView, shuffle: shuffle
  };
});
