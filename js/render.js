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
  function facePiece(poly, box, state, opts, id) {
    var art = state && state.art;
    var rot = (state && state.rot) || 0;
    var stroke = opts.stroke || '#111111';
    var sw = opts.strokeWidth != null ? opts.strokeWidth : 2;
    var body = Art.shape(art);
    var out = '', defs = '';

    out += '<polygon points="' + pts(poly) + '" fill="' + Art.bgOf(art) + '"/>';

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

    sd.faces.forEach(function (f) {
      if (S.dot(S.matVec(M, f.normal), proj.view) <= 1e-9) return;   // membelakangi penonton
      var poly = f.poly.map(function (v) { return proj.project(S.matVec(M, v)); });
      var o = proj.project(S.matVec(M, f.box.o));
      var pu = proj.project(S.matVec(M, S.add(f.box.o, f.box.U)));
      var pv = proj.project(S.matVec(M, S.add(f.box.o, f.box.V)));
      var piece = facePiece(poly, {
        o: o, U: [pu[0] - o[0], pu[1] - o[1]], V: [pv[0] - o[0], pv[1] - o[1]]
      }, faces && faces[f.index], opts, prefix + f.index);
      body.push(piece.body);
      if (piece.defs) defs.push(piece.defs);
    });

    return (defs.length ? '<defs>' + defs.join('') + '</defs>' : '') + body.join('');
  }

  /** Tampilan baku untuk pilihan jawaban: pose bangun + proyeksi khasnya. */
  function solidView(sd, faces, size, opts) {
    var proj = projectionFor(sd, size);
    return {
      svg: solid(sd, faces, S.poseMatrix(sd), proj, opts || {}),
      width: proj.width, height: proj.height
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
  function net(cells, faces, scale, opts) {
    opts = opts || {};
    var pad = opts.pad || 0;
    var b = S.boundsOf(cells);
    var prefix = 'n' + (++uid) + '_';
    var body = [], defs = [];

    function P(p) { return [pad + (p[0] - b.x0) * scale, pad + (b.y1 - p[1]) * scale]; }
    function D(v) { return [v[0] * scale, -v[1] * scale]; }

    cells.forEach(function (c) {
      var piece = facePiece(
        c.poly.map(P),
        { o: P(c.box.o), U: D(c.box.U), V: D(c.box.V) },
        faces && faces[c.face], opts, prefix + c.face
      );
      body.push('<g data-face="' + c.face + '" class="net-face">' + piece.body + '</g>');
      if (piece.defs) defs.push(piece.defs);
    });

    return {
      svg: (defs.length ? '<defs>' + defs.join('') + '</defs>' : '') + body.join(''),
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
    net: net, gridCell: gridCell, shapes: shapes, doc: doc, text: text, num: num
  };
});
