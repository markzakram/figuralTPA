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

  var CATALOG = {
    kubus: {
      name: 'Kubus', faceCount: 6, pose: null, projection: 'oblique',
      build: function () { return boxSolid(1, 1, 1); }
    },
    balok: {
      name: 'Balok', faceCount: 6, pose: null, projection: 'oblique',
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
      name: 'Prisma segitiga', faceCount: 5, pose: 'auto', projection: 'ortho',
      build: function () { return prismSolid(3, 0.62, 0.95); }
    },
    prisma6: {
      name: 'Prisma segienam', faceCount: 8, pose: 'auto', projection: 'ortho',
      build: function () { return prismSolid(6, 0.52, 0.9); }
    },
    limas4: {
      name: 'Limas segiempat', faceCount: 5, pose: 'auto', projection: 'ortho',
      build: function () { return pyramidSolid(4, 0.72, 1.05); }
    },
    limas3: {
      // bidang empat beraturan: tinggi = r*akar(2) membuat keempat sisinya kongruen,
      // sehingga grup rotasinya 12 (bukan 3) dan soal jadi jauh lebih bervariasi
      name: 'Limas segitiga', faceCount: 4, pose: 'auto', projection: 'ortho',
      build: function () { return pyramidSolid(3, 0.68, 0.68 * Math.SQRT2); }
    }
  };

  // ---------------------------------------------------------------- menyusun solid

  /** apakah titik (a,b) berada di dalam poligon cembung yang simpulnya sudah 2D */
  function insideConvex(poly2, a, b) {
    var sign = 0;
    for (var i = 0; i < poly2.length; i++) {
      var p = poly2[i], q = poly2[(i + 1) % poly2.length];
      var cr = (q[0] - p[0]) * (b - p[1]) - (q[1] - p[1]) * (a - p[0]);
      if (Math.abs(cr) < 1e-9) continue;
      var s = cr > 0 ? 1 : -1;
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
    return true;
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

    function fits(s) {
      var h = s / 2;
      return [[ca - h, cb - h], [ca + h, cb - h], [ca + h, cb + h], [ca - h, cb + h]]
        .every(function (p) { return insideConvex(poly2, p[0], p[1]); });
    }
    var s = full;
    if (!fits(s)) {
      var lo = 0, hi = full;
      for (var k = 0; k < 24; k++) {
        var mid = (lo + hi) / 2;
        if (fits(mid)) lo = mid; else hi = mid;
      }
      s = lo * 0.985;   // sisakan sedikit ruang dari rusuk
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

    var faces = raw.faces.map(function (f, i) {
      var idx = f.v.slice();
      var vs = idx.map(function (k) { return verts[k]; });
      var n = polyNormal(vs);
      // solid cembung berpusat di titik asal: normal keluar bila searah pusat sisi
      if (dot(n, centroid(vs)) < 0) {
        idx.reverse();
        vs = idx.map(function (k) { return verts[k]; });
        n = neg(n);
      }
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
      id: id, name: def.name, verts: verts, faces: faces,
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

  /** uji tumpang tindih dua poligon cembung (SAT); poligon dikecilkan agar sisi bersinggungan tidak dihitung */
  function polyOverlap(A, B) {
    var a = shrink(A, 0.94), b = shrink(B, 0.94);
    return satOverlap(a, b) && satOverlap(b, a);
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
  function nets(solid, limit) {
    limit = limit || 60;
    var E = solid.edges, nf = solid.faces.length, need = nf - 1;
    var seen = {}, out = [];
    var idx = [];
    for (var i = 0; i < need; i++) idx.push(i);

    while (true) {
      var edges = idx.map(function (k) { return E[k]; });
      if (isSpanningTree(nf, edges)) {
        var key = treeKey(solid, edges);
        if (!seen[key]) {
          seen[key] = true;
          var u = unfold(solid, edges);
          if (u.ok) {
            var cells = u.cells;
            var b = boundsOf(cells);
            if (b.h > b.w + 1e-9) { cells = rotateCells(cells, 90); b = boundsOf(cells); }
            out.push({ cells: cells, bounds: b, tree: edges.slice(), key: key });
          }
        }
      }
      if (out.length >= limit) break;
      // kombinasi berikutnya
      var p = need - 1;
      while (p >= 0 && idx[p] === E.length - need + p) p--;
      if (p < 0) break;
      idx[p]++;
      for (var j = p + 1; j < need; j++) idx[j] = idx[j - 1] + 1;
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
    for (var yaw = 0; yaw < 360; yaw += 2) {
      for (var pitch = 6; pitch <= 46; pitch += 2) {
        var M = anglesToMatrix(yaw, pitch);
        var areas = [];
        solid.faces.forEach(function (f) {
          if (dot(matVec(M, f.normal), [0, 0, 1]) > 1e-6) areas.push(shadowArea(f.poly, M));
        });
        if (!areas.length) continue;
        var total = areas.reduce(function (a, b) { return a + b; }, 0);
        var score = areas.length + Math.min.apply(null, areas) / total;
        if (score > bestScore + 1e-9) {
          bestScore = score;
          best = { yaw: yaw > 180 ? yaw - 360 : yaw, pitch: pitch };
        }
      }
    }
    return best;
  }

  function blankFaces(solid, makeArt) {
    return solid.faces.map(function () { return { art: makeArt ? makeArt() : null, rot: 0 }; });
  }

  return {
    CATALOG: CATALOG, build: build, nets: nets, unfold: unfold,
    applyRotation: applyRotation, visibleFaces: visibleFaces, poseMatrix: poseMatrix,
    blankFaces: blankFaces, boundsOf: boundsOf, rotateCells: rotateCells,
    symmetries: symmetries, isSpanningTree: isSpanningTree, treeKey: treeKey,
    anglesToMatrix: anglesToMatrix, choosePose: choosePose, orthonormalize: orthonormalize,
    matVec: matVec, matMul: matMul, det: det, dot: dot, cross: cross, unit: unit,
    add: add, sub: sub, mul: mul, neg: neg, norm360: norm360, centroid: centroid
  };
});
