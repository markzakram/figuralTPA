/*
 * geometry.js — mesin lipat jaring-jaring (net) menjadi kubus + rotasi kubus.
 *
 * Sistem koordinat 3D: X ke kanan, Y ke atas, Z ke arah penonton.
 * Indeks sisi kubus:
 *   0 = +X (kanan)   1 = -X (kiri)
 *   2 = +Y (atas)    3 = -Y (bawah)
 *   4 = +Z (depan)   5 = -Z (belakang)
 *
 * Setiap sisi punya "frame kanonik" (R0, U0) dengan R0 x U0 = normal sisi.
 * Gambar pada sebuah sisi disimpan sebagai { art, rot } dengan rot = derajat
 * putaran SEARAH JARUM JAM saat digambar pada frame kanonik tersebut.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Geo = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var RIGHT = 0, LEFT = 1, TOP = 2, BOTTOM = 3, FRONT = 4, BACK = 5;

  var NORMALS = [
    [1, 0, 0], [-1, 0, 0],
    [0, 1, 0], [0, -1, 0],
    [0, 0, 1], [0, 0, -1]
  ];

  // R0 x U0 = normal (right-handed, dilihat dari luar kubus)
  var FRAME = [
    { r: [0, 0, -1], u: [0, 1, 0] },  // +X
    { r: [0, 0, 1], u: [0, 1, 0] },  // -X
    { r: [1, 0, 0], u: [0, 0, -1] }, // +Y
    { r: [1, 0, 0], u: [0, 0, 1] },  // -Y
    { r: [1, 0, 0], u: [0, 1, 0] },  // +Z
    { r: [-1, 0, 0], u: [0, 1, 0] }  // -Z
  ];

  var OPPOSITE = [1, 0, 3, 2, 5, 4];
  var FACE_NAMES = ['Kanan', 'Kiri', 'Atas', 'Bawah', 'Depan', 'Belakang'];

  // ---------- util vektor / matriks ----------
  function neg(v) { return [-v[0], -v[1], -v[2]]; }
  function eq(a, b) { return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function scale(v, s) { return [v[0] * s, v[1] * s, v[2] * s]; }

  function matVec(M, v) {
    return [
      M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2],
      M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2],
      M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]
    ];
  }

  function matMul(A, B) {
    var out = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (var i = 0; i < 3; i++)
      for (var j = 0; j < 3; j++)
        for (var k = 0; k < 3; k++) out[i][j] += A[i][k] * B[k][j];
    return out;
  }

  var IDENTITY = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  // putar +90 terhadap sumbu X: Y->Z, Z->-Y
  var RX = [[1, 0, 0], [0, 0, -1], [0, 1, 0]];
  // putar +90 terhadap sumbu Y: Z->X, X->-Z
  var RY = [[0, 0, 1], [0, 1, 0], [-1, 0, 0]];

  function faceFromNormal(n) {
    for (var i = 0; i < 6; i++) if (eq(NORMALS[i], n)) return i;
    return -1;
  }

  /** Arah "atas" gambar (dalam 3D) untuk sisi face dengan putaran rot derajat CW. */
  function upVector(face, rot) {
    var f = FRAME[face];
    switch (((rot % 360) + 360) % 360) {
      case 0: return f.u;
      case 90: return f.r;        // atas gambar menunjuk ke kanan sisi
      case 180: return neg(f.u);
      case 270: return neg(f.r);
    }
    return f.u;
  }

  /** Kebalikan upVector: dari arah "atas" gambar menjadi derajat CW. */
  function rotFromUp(face, up) {
    var f = FRAME[face];
    if (eq(up, f.u)) return 0;
    if (eq(up, f.r)) return 90;
    if (eq(up, neg(f.u))) return 180;
    if (eq(up, neg(f.r))) return 270;
    return null;
  }

  // ---------- melipat jaring-jaring ----------
  var key = function (r, c) { return r + ',' + c; };

  /**
   * Lipat jaring-jaring menjadi kubus.
   * @param {Array<{r:number,c:number}>} cells daftar sel jaring-jaring
   * @returns {{valid:boolean, reason:string, map:Object}} map: "r,c" -> {face, rot}
   *          rot = putaran tambahan (CW) akibat pelipatan.
   */
  function foldNet(cells) {
    if (!cells || cells.length === 0) {
      return { valid: false, reason: 'Jaring-jaring masih kosong.', map: {} };
    }
    if (cells.length !== 6) {
      return {
        valid: false,
        reason: 'Butuh tepat 6 kotak, saat ini ' + cells.length + ' kotak.',
        map: {}
      };
    }

    var present = {};
    cells.forEach(function (c) { present[key(c.r, c.c)] = true; });

    var start = cells[0];
    var map = {};
    // frame awal: sel pertama menjadi sisi depan, tanpa putaran
    var queue = [{ r: start.r, c: start.c, n: [0, 0, 1], rt: [1, 0, 0], up: [0, 1, 0] }];
    map[key(start.r, start.c)] = { face: FRONT, rot: 0, n: [0, 0, 1] };

    var used = {};
    used[FRONT] = key(start.r, start.c);

    while (queue.length) {
      var cur = queue.shift();
      // gulingkan kubus ke 4 arah pada kertas
      var moves = [
        { dr: 0, dc: 1, n: cur.rt, rt: neg(cur.n), up: cur.up },        // kanan
        { dr: 0, dc: -1, n: neg(cur.rt), rt: cur.n, up: cur.up },        // kiri
        { dr: -1, dc: 0, n: cur.up, rt: cur.rt, up: neg(cur.n) },       // atas kertas
        { dr: 1, dc: 0, n: neg(cur.up), rt: cur.rt, up: cur.n }          // bawah kertas
      ];
      for (var i = 0; i < moves.length; i++) {
        var m = moves[i];
        var nr = cur.r + m.dr, nc = cur.c + m.dc, k = key(nr, nc);
        if (!present[k] || map[k]) continue;
        var face = faceFromNormal(m.n);
        var rot = rotFromUp(face, m.up);
        map[k] = { face: face, rot: rot, n: m.n };
        queue.push({ r: nr, c: nc, n: m.n, rt: m.rt, up: m.up });
      }
    }

    var visited = Object.keys(map).length;
    if (visited < 6) {
      return {
        valid: false,
        reason: 'Kotak harus saling menempel (ada ' + (6 - visited) + ' kotak terpisah).',
        map: map
      };
    }

    var seen = {}, clash = null;
    Object.keys(map).forEach(function (k) {
      var f = map[k].face;
      if (seen[f] !== undefined) clash = f;
      seen[f] = k;
    });
    if (clash !== null) {
      return {
        valid: false,
        reason: 'Bukan jaring-jaring kubus — ada dua kotak yang bertumpuk di sisi ' +
          FACE_NAMES[clash] + '.',
        map: map
      };
    }

    return { valid: true, reason: '', map: map };
  }

  /**
   * Susun state kubus dari jaring-jaring + gambar tiap sel.
   * @param {Object} foldMap hasil foldNet().map
   * @param {Object} artByCell "r,c" -> objek art (punya properti rot sendiri)
   * @returns {Array} 6 elemen: { art, rot } per indeks sisi
   */
  function buildCube(foldMap, artByCell) {
    var faces = new Array(6);
    Object.keys(foldMap).forEach(function (k) {
      var f = foldMap[k];
      var art = artByCell[k] || null;
      var artRot = art && art.rot ? art.rot : 0;
      faces[f.face] = { art: art, rot: (((f.rot + artRot) % 360) + 360) % 360 };
    });
    for (var i = 0; i < 6; i++) if (!faces[i]) faces[i] = { art: null, rot: 0 };
    return faces;
  }

  // ---------- 24 orientasi kubus ----------
  var _orientations = null;

  function orientations() {
    if (_orientations) return _orientations;
    var list = [], seen = {};
    var stack = [IDENTITY];
    seen[JSON.stringify(IDENTITY)] = true;
    list.push(IDENTITY);
    while (stack.length) {
      var M = stack.pop();
      [RX, RY].forEach(function (R) {
        var N = matMul(R, M);
        var s = JSON.stringify(N);
        if (!seen[s]) { seen[s] = true; list.push(N); stack.push(N); }
      });
    }
    _orientations = list;
    return list;
  }

  /** Putar seluruh kubus dengan matriks M; hasilkan array 6 sisi yang baru. */
  function rotateCube(faces, M) {
    var out = new Array(6);
    for (var i = 0; i < 6; i++) {
      var nn = matVec(M, NORMALS[i]);
      var j = faceFromNormal(nn);
      var up = matVec(M, upVector(i, faces[i].rot));
      out[j] = { art: faces[i].art, rot: rotFromUp(j, up) };
    }
    return out;
  }

  return {
    RIGHT: RIGHT, LEFT: LEFT, TOP: TOP, BOTTOM: BOTTOM, FRONT: FRONT, BACK: BACK,
    NORMALS: NORMALS, FRAME: FRAME, OPPOSITE: OPPOSITE, FACE_NAMES: FACE_NAMES,
    IDENTITY: IDENTITY, RX: RX, RY: RY,
    neg: neg, eq: eq, dot: dot, add: add, scale: scale,
    matVec: matVec, matMul: matMul,
    faceFromNormal: faceFromNormal, upVector: upVector, rotFromUp: rotFromUp,
    key: key, foldNet: foldNet, buildCube: buildCube,
    orientations: orientations, rotateCube: rotateCube
  };
});
