/* app.js — antarmuka: pemilih bangun ruang, galeri jaring-jaring, editor sisi,
   pratinjau 3D, dan lembar soal. */
(function () {
  'use strict';

  // 4 x 6 sudah cukup: jaring kubus/balok tertinggi hanya 4 petak, terlebar 5 petak
  var ROWS = 4, COLS = 6;
  var STORE = 'generator-bangun-ruang-v2';
  var $ = function (id) { return document.getElementById(id); };

  var COLORS = [
    { v: '#111111', n: 'hitam' }, { v: '#ffffff', n: 'putih' }, { v: '#c0392b', n: 'merah' },
    { v: '#2f6df6', n: 'biru' }, { v: '#12805c', n: 'hijau' }, { v: '#f1c40f', n: 'kuning' },
    { v: '#e67e22', n: 'oranye' }, { v: '#8e44ad', n: 'ungu' }, { v: '#8a94a6', n: 'abu-abu' }
  ];

  var GRID_PRESET = [[0, 2], [1, 1], [1, 2], [1, 3], [2, 2], [3, 2]];
  var PARAM_SHORT = { p: 'P', l: 'L', t: 'T' };

  var state = {
    solidId: 'kubus',
    params: {},
    solid: null,
    faces: [],
    nets: [],
    netIndex: 0,
    mode: 'auto',        // 'auto' = pilih dari daftar, 'grid' = susun sendiri (kubus/balok)
    grid: {},
    fold: null,
    selected: 0,
    rotM: null,                 // matriks putaran pratinjau (trackball bebas 360 derajat)
    quiz: null, bank: [], spinTimer: null
  };

  function boxLike() { return state.solidId === 'kubus' || state.solidId === 'balok'; }

  // ---------------------------------------------------------------- util

  function artSVG(art, rot) {
    var body = Art.inner(art);
    if (rot) body = '<g transform="rotate(' + rot + ' 50 50)">' + body + '</g>';
    return '<svg viewBox="0 0 100 100" preserveAspectRatio="none">' + body + '</svg>';
  }

  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        solidId: state.solidId, params: state.params, mode: state.mode,
        netIndex: state.netIndex, grid: state.grid,
        arts: state.faces.map(function (f) { return { art: f.art, rot: f.rot }; })
      }));
    } catch (e) { /* abaikan */ }
  }

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(STORE) || 'null');
      if (!d || !Solids.CATALOG[d.solidId]) return false;
      setSolid(d.solidId, d.params, true);
      if (d.arts && d.arts.length === state.faces.length) state.faces = d.arts;
      if (d.mode === 'grid' && boxLike()) state.mode = 'grid';
      if (d.grid && Object.keys(d.grid).length) state.grid = d.grid;
      state.netIndex = Math.min(d.netIndex || 0, Math.max(0, state.nets.length - 1));
      return true;
    } catch (e) { return false; }
  }

  // ---------------------------------------------------------------- bangun ruang

  function setSolid(id, params, keepArt) {
    state.solidId = id;
    state.params = params || {};
    state.solid = Solids.build(id, state.params);
    state.nets = Solids.nets(state.solid, 60);
    state.netIndex = 0;
    state.selected = 0;
    state.rotM = null;           // pratinjau kembali ke sudut baku bangun yang baru
    if (!keepArt || state.faces.length !== state.solid.faces.length) {
      state.faces = state.solid.faces.map(function () {
        return { art: Art.defaultArt(), rot: 0 };
      });
    }
    if (!boxLike()) state.mode = 'auto';
    if (boxLike() && !Object.keys(state.grid).length) {
      GRID_PRESET.forEach(function (rc) { state.grid[Geo.key(rc[0], rc[1])] = true; });
    }
  }

  function gridCellList() {
    return Object.keys(state.grid).map(function (k) {
      var p = k.split(',');
      return { r: +p[0], c: +p[1] };
    });
  }

  function refold() {
    state.fold = Geo.foldNet(gridCellList());
    return state.fold;
  }

  /** Sel jaring-jaring yang sedang dipakai, dalam bentuk umum {face, poly, box}. */
  function netCells() {
    if (state.mode === 'grid') {
      if (!state.fold || !state.fold.valid) return null;
      return Object.keys(state.fold.map).map(function (k) {
        var p = k.split(','), f = state.fold.map[k];
        // gambar disimpan relatif terhadap sisi; pada kertas arahnya dikoreksi -rot lipatan
        return Render.gridCell(f.face, +p[0], +p[1], -f.rot);
      });
    }
    var n = state.nets[state.netIndex];
    return n ? n.cells : null;
  }

  // ---------------------------------------------------------------- panel 1

  function renderSolidPicker() {
    $('solid-picker').innerHTML = Object.keys(Solids.CATALOG).map(function (id) {
      var c = Solids.CATALOG[id];
      return '<button type="button" class="ghost' + (id === state.solidId ? ' active' : '') +
        '" data-solid="' + id + '" title="' + c.name + '">' + (c.short || c.name) + '</button>';
    }).join('');

    var info = Solids.CATALOG[state.solidId].paramInfo;
    $('param-box').hidden = !info;
    if (info) {
      $('params').innerHTML = info.map(function (p) {
        var val = state.solid.params[p.key];
        return '<label class="num-field" title="' + p.label + '"><span>' +
          (PARAM_SHORT[p.key] || p.label) + '</span>' +
          '<input type="number" data-param="' + p.key + '" min="0.3" max="2" step="0.05" value="' +
          (Math.round(val * 100) / 100) + '"></label>';
      }).join('');
    }
    $('mode-switch').hidden = !boxLike();
    Array.prototype.forEach.call($('mode-switch').children, function (b) {
      b.classList.toggle('active', b.dataset.mode === state.mode);
    });
  }

  function renderGallery() {
    $('gallery-wrap').hidden = state.mode === 'grid';
    $('grid-wrap').hidden = state.mode !== 'grid';
    if (state.mode === 'grid') return;

    $('gallery-note').textContent = state.nets.length +
      ' jaring-jaring berbeda untuk ' + state.solid.name.toLowerCase() +
      (state.nets.length >= 60 ? ' (ditampilkan 60 pertama)' : '');

    $('gallery').innerHTML = state.nets.map(function (n, i) {
      var size = 15;
      var r = Render.net(n.cells, null, size, { strokeWidth: 1.2, stroke: '#4a5670' });
      return '<button type="button" class="net-thumb' + (i === state.netIndex ? ' active' : '') +
        '" data-net="' + i + '" title="Jaring-jaring ' + (i + 1) + '">' +
        Render.doc(r.svg, r.width, r.height) + '</button>';
    }).join('');
  }

  function renderGrid() {
    var g = $('grid');
    g.style.gridTemplateColumns = 'repeat(' + COLS + ', 48px)';
    var html = '';
    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var k = Geo.key(r, c), on = state.grid[k];
        var fm = on && state.fold && state.fold.valid ? state.fold.map[k] : null;
        var sel = fm && fm.face === state.selected;
        var art = fm ? state.faces[fm.face] : null;
        html += '<button type="button" class="cell' + (on ? ' on' : '') + (sel ? ' sel' : '') +
          '" data-k="' + k + '">' +
          (art ? artSVG(art.art, art.rot - fm.rot) : '') +
          (fm ? '<span class="tag">' + state.solid.faces[fm.face].name + '</span>' : '') +
          '</button>';
      }
    }
    g.innerHTML = html;

    var el = $('fold-status');
    if (state.fold && state.fold.valid) {
      el.className = 'status ok';
      el.textContent = '✓ Jaring-jaring sah — dapat dilipat menjadi ' + state.solid.name.toLowerCase() + '.';
    } else {
      el.className = 'status bad';
      el.textContent = '✕ ' + (state.fold ? state.fold.reason : 'Belum ada kotak.');
    }
  }

  function renderNetView() {
    var cells = netCells();
    var host = $('net-view');
    // di mode papan, papan itu sendiri sudah menampilkan gambar tiap sisi
    $('net-box').hidden = state.mode === 'grid';
    if (state.mode === 'grid' || !cells) {
      if (!cells) host.innerHTML = '<p class="hint">Susunan kotak belum membentuk jaring-jaring yang sah.</p>';
      return;
    }
    var b = Solids.boundsOf(cells);
    // muat di lebar kolom tanpa memaksa halaman menggulir
    var scale = Math.max(26, Math.min(58, 250 / Math.max(b.w, b.h * 1.15)));
    var r = Render.net(cells, state.faces, scale, { strokeWidth: 2, pad: 3 });
    host.innerHTML = Render.doc(r.svg, r.width, r.height);
    var svg = host.querySelector('svg');
    Array.prototype.forEach.call(svg.querySelectorAll('.net-face'), function (g) {
      if (+g.dataset.face === state.selected) g.classList.add('sel');
    });
  }

  // ---------------------------------------------------------------- panel 2

  function buildEditorOnce() {
    $('fe-type').innerHTML = Art.TYPES.map(function (t) {
      return '<option value="' + t.id + '">' + t.label + '</option>';
    }).join('');
    $('fe-n').innerHTML = [1, 2, 3, 4, 5, 6].map(function (n) {
      return '<button type="button" class="ghost num-btn" data-n="' + n + '">' + n + '</button>';
    }).join('');
    ['fe-fg', 'fe-bg'].forEach(function (id) {
      $(id).innerHTML = COLORS.map(function (c) {
        return '<button type="button" class="swatch" data-c="' + c.v + '" title="' + c.n +
          '" style="background:' + c.v + '"></button>';
      }).join('');
    });
  }

  function selectedState() { return state.faces[state.selected]; }

  function renderFaceStrip() {
    $('face-strip').innerHTML = state.solid.faces.map(function (f, i) {
      return '<button type="button" class="face-chip' + (i === state.selected ? ' active' : '') +
        '" data-face="' + i + '" title="' + f.name + '">' +
        '<span class="chip-art">' + artSVG(state.faces[i].art, state.faces[i].rot) + '</span>' +
        '<span class="chip-name">' + f.name + '</span></button>';
    }).join('');
  }

  function renderFaceEditor() {
    var st = selectedState();
    if (!st) return;
    var art = st.art;
    var face = state.solid.faces[state.selected];

    $('fe-title').textContent = 'Sisi ' + face.name.toLowerCase();
    $('fe-face').textContent = face.sides === 3 ? 'bentuk segitiga'
      : (face.sides === 4 ? 'bentuk segiempat' : 'bentuk segi-' + face.sides);
    $('fe-preview').innerHTML = artSVG(art, st.rot);

    $('fe-type').value = art.type;
    var def = Art.get(art.type);
    $('fe-n-wrap').hidden = def.uses.indexOf('n') === -1;
    $('fe-text-wrap').hidden = def.uses.indexOf('text') === -1;
    $('fe-text').value = art.text || '';

    Array.prototype.forEach.call($('fe-n').children, function (b) {
      b.classList.toggle('active', +b.dataset.n === (art.n || 1));
    });
    Array.prototype.forEach.call($('fe-fg').children, function (b) {
      b.classList.toggle('active', b.dataset.c === art.fg);
    });
    Array.prototype.forEach.call($('fe-bg').children, function (b) {
      b.classList.toggle('active', b.dataset.c === art.bg);
    });
    $('fe-rot-val').textContent = Math.round(st.rot) + '°';
  }

  function updateArt(patch) {
    var st = selectedState();
    if (!st) return;
    Object.keys(patch).forEach(function (k) {
      if (k === 'rot') st.rot = patch[k]; else st.art[k] = patch[k];
    });
    changed();
  }

  // ---------------------------------------------------------------- pratinjau

  function defaultRot() {
    var p = state.solid.pose;
    return p ? Solids.anglesToMatrix(p.yaw, p.pitch) : Solids.anglesToMatrix(-32, 20);
  }

  function renderPreview() {
    if (!state.rotM) state.rotM = defaultRot();
    var r = Render.solidSpin(state.solid, state.faces, 134, state.rotM, { strokeWidth: 2 });
    $('preview').innerHTML = Render.doc(r.svg, r.width, r.height);

    // daftar ini hanya informatif untuk bangun seperti kubus/balok/prisma segitiga;
    // pada prisma segilima ke atas jumlahnya belasan dan malah memenuhi layar
    var pairs = state.solid.untouching;
    $('opposite-box').hidden = pairs.length === 0 || pairs.length > 4;
    if (!$('opposite-box').hidden) {
      $('opposite-title').textContent = state.solid.faces.length === 6
        ? 'Pasangan sisi berhadapan' : 'Sisi yang tidak bersentuhan';
      $('opposite-list').innerHTML = pairs.map(function (p) {
        var nama = state.solid.faces[p[0]].name.toLowerCase() + ' & ' +
          state.solid.faces[p[1]].name.toLowerCase();
        return '<div class="opp-row" title="' + nama + '"><span class="mini">' +
          artSVG(state.faces[p[0]].art, state.faces[p[0]].rot) +
          '</span><span>&harr;</span><span class="mini">' +
          artSVG(state.faces[p[1]].art, state.faces[p[1]].rot) + '</span></div>';
      }).join('');
    }
  }

  function bindPreviewDrag() {
    var host = $('preview'), dragging = false, lx = 0, ly = 0;
    host.addEventListener('pointerdown', function (e) {
      dragging = true; lx = e.clientX; ly = e.clientY;
      host.classList.add('dragging');
      host.setPointerCapture(e.pointerId);
      stopSpin();
    });
    host.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      // Putaran ditumpuk sebagai matriks di ruang layar (trackball), bukan sudut
      // yaw/pitch. Jadi memutar ke atas-bawah sama bebasnya dengan kiri-kanan:
      // 360 derajat penuh, tanpa mentok dan tanpa terkunci di kutub.
      var step = Solids.anglesToMatrix((e.clientX - lx) * 0.6, (e.clientY - ly) * 0.6);
      state.rotM = Solids.orthonormalize(Solids.matMul(step, state.rotM || defaultRot()));
      lx = e.clientX; ly = e.clientY;
      renderPreview();
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) {
      host.addEventListener(ev, function () { dragging = false; host.classList.remove('dragging'); });
    });
  }

  function stopSpin() {
    if (state.spinTimer) { clearInterval(state.spinTimer); state.spinTimer = null; }
    $('btn-view-spin').classList.remove('active');
  }

  // ---------------------------------------------------------------- lembar soal

  /** Gambar jaring-jaring yang muat dalam kotak lebar x tinggi tertentu. */
  function netFit(cells, faces, boxW, boxH, sw) {
    var b = Solids.boundsOf(cells);
    var scale = Math.min(boxW / b.w, boxH / b.h);
    return Render.net(cells, faces, scale, { strokeWidth: sw || 2 });
  }

  /** Gambar pertanyaan (bagian atas lembar), berbeda menurut tipe soal. */
  function questionRender(quiz, opts) {
    if (quiz.type === 'toNet') {
      return Render.solidView(quiz.solid, quiz.faces, 128, { strokeWidth: 2 });
    }
    if (quiz.type === 'toFaces') {
      return Render.solidView(quiz.solid, null, 128, { strokeWidth: 2 });
    }
    var cells = opts.netCells || quiz.netCells || netCells();
    if (!cells) return null;
    // tipe "bentuk bangunnya": jaring digambar polos, seperti pada soal aslinya
    var faces = quiz.type === 'toShape' ? null : (opts.netFaces || quiz.faces || state.faces);
    return netFit(cells, faces, 280, 190, 2);
  }

  /** Gambar satu pilihan jawaban. */
  function optionRender(quiz, opt, size) {
    if (opt.kind === 'net') return netFit(opt.net.cells, opt.faces, size, size * 0.88, 1.8);
    if (opt.kind === 'shape') return Render.solidView(opt.solid, null, size, { strokeWidth: 2 });
    if (opt.kind === 'faces') return Render.shapes(opt.comp, size * 0.62, { strokeWidth: 1.8 });
    return Render.solidView(quiz.solid, opt.faces, size, { strokeWidth: 2 });
  }

  /** Deretan pilihan A-E beserta labelnya, sebagai satu blok gambar. */
  function optionsBlock(quiz, opts) {
    opts = opts || {};
    var gap = 16;
    var size = opts.size || (quiz.type === 'toNet' ? 124 : 92);
    var rends = quiz.options.map(function (o) { return optionRender(quiz, o, size); });
    var slotW = Math.max.apply(null, rends.map(function (r) { return r.width; }));
    var slotH = Math.max.apply(null, rends.map(function (r) { return r.height; }));
    var n = rends.length;
    var width = n * slotW + (n - 1) * gap;
    var parts = [];

    quiz.options.forEach(function (opt, i) {
      var r = rends[i];
      var slotX = i * (slotW + gap);
      var x = slotX + (slotW - r.width) / 2;      // pusatkan dalam slot yang sama lebar
      var y = (slotH - r.height) / 2;
      if (opts.showKey && i === quiz.answerIndex) {
        parts.push('<rect x="' + Render.num(slotX - 7) + '" y="-7" width="' +
          Render.num(slotW + 14) + '" height="' + Render.num(slotH + 30) +
          '" rx="8" fill="#e6f6f0" stroke="#12805c" stroke-width="2"/>');
      }
      parts.push('<g transform="translate(' + Render.num(x) + ',' + Render.num(y) + ')">' + r.svg + '</g>');
      parts.push(Render.text(String.fromCharCode(65 + i) + '.', slotX + slotW / 2, slotH + 18,
        { size: 15, weight: 700, anchor: 'middle' }));
    });

    return { svg: parts.join(''), width: width, height: slotH + 26 };
  }

  function sheetSVG(quiz, opts) {
    opts = opts || {};
    var pad = 22, titleSize = 15;
    var head = questionRender(quiz, opts);
    if (!head) return '';
    var blok = optionsBlock(quiz, opts);
    var width = Math.max(pad * 2 + blok.width, pad * 2 + head.width, 560);

    var parts = [];
    var y = pad;
    // teks pertanyaan hanya muncul bila diminta lewat opts.title
    if (opts.title) {
      y += titleSize;
      parts.push(Render.text(opts.title, pad, y, { size: titleSize }));
      y += 14;
    }
    parts.push('<g transform="translate(' + Render.num((width - head.width) / 2) + ',' + y + ')">' +
      head.svg + '</g>');
    y += head.height + 30;
    parts.push('<g transform="translate(' + Render.num((width - blok.width) / 2) + ',' + y + ')">' +
      blok.svg + '</g>');
    y += blok.height;

    if (opts.showKey) {
      y += 20;
      parts.push(Render.text('Kunci jawaban: ' + quiz.answerLetter + '   (' + quiz.describe + ')',
        pad, y, { size: 13, fill: '#12805c', weight: 700 }));
    }

    return Render.doc(parts.join(''), width, y + pad, { background: '#ffffff' });
  }

  /** Gambar soal saja (tanpa pilihan) — dipakai sebagai satu halaman PDF. */
  function questionDoc(quiz) {
    var r = questionRender(quiz, {});
    if (!r) return '';
    var pad = 16;
    return Render.doc('<g transform="translate(' + pad + ',' + pad + ')">' + r.svg + '</g>',
      r.width + pad * 2, r.height + pad * 2, { background: '#ffffff' });
  }

  /** Deretan pilihan saja — halaman PDF berikutnya. */
  function optionsDoc(quiz) {
    var b = optionsBlock(quiz, {});
    var pad = 16;
    return Render.doc('<g transform="translate(' + pad + ',' + pad + ')">' + b.svg + '</g>',
      b.width + pad * 2, b.height + pad * 2, { background: '#ffffff' });
  }

  function renderQuiz() {
    var q = state.quiz;
    $('quiz-actions').hidden = !q;
    $('quiz-answer').hidden = !q;
    if (!q) { $('quiz-sheet').innerHTML = ''; $('quiz-warnings').innerHTML = ''; return; }

    $('quiz-warnings').innerHTML = q.warnings.map(function (w) {
      return '<p class="note">⚠ ' + Art.esc(w) + '</p>';
    }).join('');
    $('quiz-sheet').innerHTML = sheetSVG(q, { showKey: $('show-key').checked });

    $('answer-buttons').innerHTML = q.options.map(function (o, i) {
      return '<button type="button" class="ghost opt-btn" data-i="' + i + '">' +
        String.fromCharCode(65 + i) + '</button>';
    }).join('');
    $('answer-feedback').textContent = '';
    $('answer-feedback').className = 'feedback';
    $('answer-reveal').textContent = '';
  }

  function benarText(q) {
    if (q.type === 'toNet') return 'Benar. Jaring-jaring itu terlipat menjadi bangun pada soal.';
    if (q.type === 'toShape') return 'Benar. Bangunnya ' + q.describe + '.';
    if (q.type === 'toFaces') return 'Benar. Bangun itu tersusun dari ' + q.describe + '.';
    return 'Benar. ' + q.describe + '.';
  }

  function answerClicked(i) {
    var q = state.quiz;
    if (!q) return;
    var opt = q.options[i], fb = $('answer-feedback');
    Array.prototype.forEach.call($('answer-buttons').children, function (b) {
      b.classList.remove('right', 'wrong');
    });
    var btn = $('answer-buttons').children[i];
    if (opt.correct) {
      btn.classList.add('right');
      fb.className = 'feedback ok';
      fb.textContent = benarText(q);
    } else {
      btn.classList.add('wrong');
      $('answer-buttons').children[q.answerIndex].classList.add('right');
      fb.className = 'feedback bad';
      fb.textContent = 'Kurang tepat — pilihan ' + String.fromCharCode(65 + i) + ' ' + opt.reason + '.';
    }
    $('answer-reveal').textContent = 'Kunci: ' + q.answerLetter + ' (' + q.describe + ').';
  }

  var _allSolids = null;
  function allSolids() {
    if (!_allSolids) {
      _allSolids = Object.keys(Solids.CATALOG).map(function (id) { return Solids.build(id); });
    }
    // pakai balok dengan ukuran yang sedang dipilih pengguna
    return _allSolids.map(function (s) {
      return s.id === state.solidId ? state.solid : s;
    });
  }

  /** Buat satu soal sesuai tipe yang dipilih, lengkap dengan pemeriksaan mandiri. */
  function makeQuiz(netCellsOverride) {
    var type = $('qtype').value;
    var q, check;
    if (type === 'toNet') {
      q = Quiz.generateNetChoice(state.solid, state.faces, state.nets, {});
      check = Quiz.auditAlt(q);
    } else if (type === 'toFaces') {
      q = Quiz.generateFaceChoice(state.solid, allSolids(), {});
      check = Quiz.auditAlt(q);
    } else if (type === 'toShape') {
      q = Quiz.generateShapeChoice(state.solid, allSolids(), {});
      q.netCells = netCellsOverride || netCells();
      check = Quiz.auditAlt(q);
    } else {
      q = Quiz.generate(state.solid, state.faces, { difficulty: $('difficulty').value });
      q.netCells = netCellsOverride || netCells();
      check = Quiz.audit(q);
    }
    if (!check.ok) {
      q.warnings.push('Pemeriksaan internal menemukan keanehan (pilihan sah: ' + check.validCount +
        ', kembar: ' + check.duplicates + '). Silakan buat ulang soal.');
    }
    return q;
  }

  function generate() {
    var t = $('qtype').value;
    // tipe yang soalnya menampilkan bangun 3D tidak butuh jaring yang sah
    if (t !== 'toNet' && t !== 'toFaces' && !netCells()) { flash('Jaring-jaring belum sah.'); return null; }
    state.quiz = makeQuiz();
    renderQuiz();
    return state.quiz;
  }

  function flash(msg) {
    var el = $('quiz-warnings');
    el.innerHTML = '<p class="note">⚠ ' + Art.esc(msg) + '</p>';
    setTimeout(function () { if (state.quiz) renderQuiz(); else el.innerHTML = ''; }, 2600);
  }

  // ---------------------------------------------------------------- bank soal

  var TIPE_LABEL = {
    toSolid: 'Jaring-jaring → bangun ruang',
    toNet: 'Bangun ruang → jaring-jaring',
    toShape: 'Jaring-jaring → bentuk bangun',
    toFaces: 'Bangun ruang → bangun datar penyusun'
  };
  var TINGKAT_LABEL = { mudah: 'Mudah', sedang: 'Sedang', sulit: 'Sulit' };

  /** Uraian jawaban untuk halaman pembahasan PDF. */
  function pembahasan(q) {
    var out = [];
    var kunci = 'Jawaban benar: ' + q.answerLetter + '. ';
    if (q.type === 'toNet') {
      kunci += 'Jaring-jaring itu bila dilipat menghasilkan bangun pada soal — sisi yang tampak: ' +
        q.describe + '.';
    } else if (q.type === 'toShape') {
      kunci += 'Jaring-jaring pada soal membentuk ' + q.describe + '.';
    } else if (q.type === 'toFaces') {
      kunci += 'Bangun pada soal tersusun dari ' + q.describe + '.';
    } else {
      kunci += 'Setelah jaring-jaring dilipat, sisi yang tampak adalah ' + q.describe + '.';
    }
    out.push(kunci);
    out.push('Pilihan lain tidak mungkin:');
    q.options.forEach(function (o, i) {
      if (!o.correct) out.push(String.fromCharCode(65 + i) + '. ' + (o.reason || 'tidak sesuai') + '.');
    });
    return out;
  }

  function addToBank(q, diam) {
    q = q || state.quiz;
    if (!q) return;
    state.bank.push({
      sheet: sheetSVG(q, { showKey: false }),
      soalSvg: questionDoc(q),
      pilihanSvg: optionsDoc(q),
      letter: q.answerLetter,
      describe: q.describe,
      solid: q.solid.name,
      tipe: TIPE_LABEL[q.type] || '',
      tingkat: q.type === 'toSolid' ? (TINGKAT_LABEL[$('difficulty').value] || '') : '',
      pembahasan: pembahasan(q)
    });
    if (!diam) renderBank();
  }

  function quizKey(q) {
    return q.options.map(function (o) {
      return o.sig || o.key || (o.solid && o.solid.id) || '';
    }).join('||');
  }

  function renderBank() {
    $('bank-count').textContent = state.bank.length;
    $('bank').innerHTML = state.bank.map(function (it, i) {
      return '<div class="bank-item"><div>' + it.sheet + '</div>' +
        '<div><div class="bank-meta">Soal ' + (i + 1) + '<br>' + Art.esc(it.solid) + '</div>' +
        '<div class="bank-key">Kunci: ' + it.letter + '</div>' +
        '<button type="button" class="ghost danger" data-del="' + i + '">Hapus</button></div></div>';
    }).join('');
  }

  function printBank() {
    if (!state.bank.length) { batchStatus('Bank soal masih kosong.', true); return; }
    var qs = state.bank.map(function (it, i) {
      return '<div class="print-q"><b>' + (i + 1) + '.</b><br>' + it.sheet + '</div>';
    }).join('');
    var keys = '<div class="print-key"><h2>Kunci jawaban</h2><table>' +
      state.bank.map(function (it, i) {
        return '<tr><td><b>' + (i + 1) + '.</b> ' + it.letter + '</td><td>' +
          Art.esc(it.solid) + '</td><td>' + Art.esc(it.describe) + '</td></tr>';
      }).join('') + '</table></div>';
    $('print-area').innerHTML = qs + keys;
    window.print();
  }

  // ---------------------------------------------------------------- buat banyak soal

  function batchStatus(pesan, error) {
    var el = $('batch-status');
    el.textContent = pesan || '';
    el.className = 'status-line' + (error ? ' error' : '');
  }

  function jeda() { return new Promise(function (r) { setTimeout(r, 0); }); }

  /**
   * Buat sekaligus N soal ke bank. Bisa mengacak gambar sisi, bangun ruang,
   * dan tipe soal supaya satu paket tidak monoton.
   */
  async function batchGenerate() {
    var jumlah = Math.max(1, Math.min(200, parseInt($('batch-count').value, 10) || 10));
    var variasi = $('batch-vary').value;
    var tipeMode = $('batch-type').value;
    var TIPE = ['toSolid', 'toNet', 'toShape', 'toFaces'];
    var ids = Object.keys(Solids.CATALOG);

    var asalSolid = state.solidId, asalParams = state.params;
    var asalFaces = state.faces, asalNet = state.netIndex, asalTipe = $('qtype').value;

    var bar = $('batch-progress');
    bar.hidden = false; bar.max = jumlah; bar.value = 0;
    $('btn-batch').disabled = true;
    batchStatus('Membuat soal…');

    try {
      for (var i = 0; i < jumlah; i++) {
        if (tipeMode === 'campur') $('qtype').value = TIPE[i % TIPE.length];

        if (variasi === 'artSolid') {
          setSolid(ids[Math.floor(Math.random() * ids.length)], null, false);
          state.faces = randomFaces();
        } else if (variasi === 'art') {
          state.faces = randomFaces();
        }
        if (state.mode !== 'grid' && state.nets.length) {
          state.netIndex = Math.floor(Math.random() * state.nets.length);
        }

        var alt = state.mode !== 'grid' && state.nets.length ? state.nets[state.netIndex].cells : null;
        if (state.mode === 'grid' || !alt) alt = netCells();
        addToBank(makeQuiz(alt), true);

        bar.value = i + 1;
        if (i % 4 === 3) { batchStatus('Membuat soal ' + (i + 1) + '/' + jumlah + '…'); await jeda(); }
      }
      batchStatus(jumlah + ' soal ditambahkan. Total di bank: ' + state.bank.length + '.');
    } catch (e) {
      batchStatus('Gagal membuat soal: ' + e.message, true);
    } finally {
      // kembalikan keadaan editor seperti semula
      $('qtype').value = asalTipe;
      $('difficulty').disabled = asalTipe !== 'toSolid';
      setSolid(asalSolid, asalParams, false);
      state.faces = asalFaces;
      state.netIndex = Math.min(asalNet, Math.max(0, state.nets.length - 1));
      bar.hidden = true;
      $('btn-batch').disabled = false;
      renderBank();
      changed();
    }
  }

  /** Unduh seluruh bank soal sebagai PDF: 4 halaman per soal. */
  async function downloadPDF() {
    if (!state.bank.length) { batchStatus('Bank soal masih kosong — tekan Generate dulu.', true); return; }
    var bar = $('batch-progress');
    bar.hidden = false; bar.max = state.bank.length; bar.value = 0;
    $('btn-pdf').disabled = true;

    try {
      var soal = [];
      for (var i = 0; i < state.bank.length; i++) {
        var it = state.bank[i];
        soal.push({
          no: i + 1,
          tipe: it.tipe,
          tingkat: it.tingkat,
          jawaban: it.letter,
          pembahasan: it.pembahasan,
          gambarSoal: await Raster.svgKePiksel(it.soalSvg, 2),
          gambarPilihan: await Raster.svgKePiksel(it.pilihanSvg, 2)
        });
        bar.value = i + 1;
        batchStatus('Menyiapkan halaman ' + (i + 1) + '/' + state.bank.length + '…');
        if (i % 3 === 2) await jeda();
      }
      batchStatus('Memampatkan PDF…');
      var blob = await Pdf.buat(soal, {});
      Raster.unduhBlob(blob, 'soal-bangun-ruang-' + state.bank.length + 'soal.pdf');
      batchStatus('PDF siap: ' + (state.bank.length * 4) + ' halaman dari ' + state.bank.length +
        ' soal (' + (blob.size / 1048576).toFixed(1) + ' MB).');
    } catch (e) {
      batchStatus('Ekspor PDF gagal: ' + e.message, true);
    } finally {
      bar.hidden = true;
      $('btn-pdf').disabled = false;
    }
  }

  // ---------------------------------------------------------------- ekspor

  function download(url, name) {
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }

  function fileName(ext) {
    return 'soal-' + state.solidId + '.' + ext;
  }

  function downloadSVG() {
    if (!state.quiz) return;
    download('data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(sheetSVG(state.quiz, { showKey: $('show-key').checked })), fileName('svg'));
  }

  function downloadPNG() {
    if (!state.quiz) return;
    var svg = sheetSVG(state.quiz, { showKey: $('show-key').checked });
    var img = new Image();
    img.onload = function () {
      var scale = 2, cv = document.createElement('canvas');
      cv.width = img.width * scale; cv.height = img.height * scale;
      var ctx = cv.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
      ctx.drawImage(img, 0, 0);
      try { download(cv.toDataURL('image/png'), fileName('png')); }
      catch (e) { flash('Peramban memblokir ekspor PNG, memakai SVG.'); downloadSVG(); }
    };
    img.onerror = function () { flash('Gagal membuat PNG, memakai SVG.'); downloadSVG(); };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // ---------------------------------------------------------------- isi cepat

  function fillNumbers() {
    var faces = state.solid.faces;
    var pairs = state.solid.untouching;
    if (faces.length === 6 && pairs.length === 3) {
      // aturan dadu: sisi berhadapan berjumlah 7
      var n = 1;
      var used = {};
      pairs.forEach(function (p) {
        state.faces[p[0]] = { art: Art.defaultArt({ type: 'dice', n: n }), rot: 0 };
        state.faces[p[1]] = { art: Art.defaultArt({ type: 'dice', n: 7 - n }), rot: 0 };
        used[p[0]] = used[p[1]] = true;
        n++;
      });
    } else {
      faces.forEach(function (f, i) {
        state.faces[i] = i < 6
          ? { art: Art.defaultArt({ type: 'dice', n: i + 1 }), rot: 0 }
          : { art: Art.defaultArt({ type: 'text', text: String(i + 1) }), rot: 0 };
      });
    }
    changed();
  }

  function randomFaces() {
    var pool = [
      { type: 'dice', n: 1 }, { type: 'dice', n: 2 }, { type: 'dice', n: 3 },
      { type: 'dice', n: 4 }, { type: 'dice', n: 5 }, { type: 'dice', n: 6 },
      { type: 'square' }, { type: 'circle' }, { type: 'ring' }, { type: 'triangle' },
      { type: 'arrow' }, { type: 'star' }, { type: 'plus' }, { type: 'ex' },
      { type: 'diag' }, { type: 'half' }, { type: 'stripe' }, { type: 'corner' },
      { type: 'ell' }, { type: 'blank' }, { type: 'diamond' }, { type: 'frame' },
      { type: 'dots2' }, { type: 'bars' }, { type: 'checker' }, { type: 'chevron' },
      { type: 'halfCircle' }, { type: 'quarter' }, { type: 'pentagon' }, { type: 'hexagon' },
      { type: 'bowtie' }, { type: 'zigzag' }, { type: 'heart' }, { type: 'moon' },
      { type: 'rightTri' }, { type: 'tee' },
      { type: 'text', text: 'A' }, { type: 'text', text: 'B' }, { type: 'text', text: 'F' },
      { type: 'text', text: 'L' }, { type: 'text', text: 'R' }, { type: 'text', text: '4' }
    ];
    var picked = Quiz.shuffle(pool);
    // "Warna tetap": hanya gambarnya yang diacak, warna tiap sisi dipertahankan
    var tetap = $('keep-color').checked;
    var colored = !tetap && Math.random() < 0.45;
    return state.solid.faces.map(function (f, i) {
      var base = picked[i % picked.length];
      var lama = state.faces[i];
      var fg = '#111111', bg = '#ffffff';
      if (tetap && lama && lama.art) {
        fg = lama.art.fg; bg = lama.art.bg;
      } else if (colored) {
        var c = COLORS[2 + Math.floor(Math.random() * 6)];
        if (base.type === 'blank') bg = c.v; else fg = c.v;
      } else if (base.type === 'blank' && Math.random() < 0.5) {
        bg = '#111111';
      }
      return {
        art: Art.defaultArt({
          type: base.type, n: base.n || 1, text: base.text || 'A', fg: fg, bg: bg
        }),
        rot: [0, 90, 180, 270][Math.floor(Math.random() * 4)]
      };
    });
  }

  function randomFill() {
    state.faces = randomFaces();
    changed();
  }

  function clearArt() {
    state.faces = state.solid.faces.map(function () { return { art: Art.defaultArt(), rot: 0 }; });
    changed();
  }

  // ---------------------------------------------------------------- alur

  function changed() {
    if (state.mode === 'grid') refold();
    renderSolidPicker();
    renderGallery();
    if (state.mode === 'grid') renderGrid();
    renderNetView();
    renderFaceStrip();
    renderFaceEditor();
    renderPreview();
    save();
  }

  function bind() {
    $('btn-help').addEventListener('click', function () {
      var h = $('help'); h.hidden = !h.hidden;
    });

    $('solid-picker').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-solid]');
      if (!b || b.dataset.solid === state.solidId) return;
      setSolid(b.dataset.solid, null, false);
      state.quiz = null;
      renderQuiz();
      changed();
    });

    $('params').addEventListener('change', function (e) {
      var inp = e.target.closest('input[data-param]');
      if (!inp) return;
      var p = {};
      Array.prototype.forEach.call($('params').querySelectorAll('input[data-param]'), function (x) {
        p[x.dataset.param] = Math.max(0.3, Math.min(2, parseFloat(x.value) || 1));
      });
      setSolid(state.solidId, p, true);
      changed();
    });

    $('mode-switch').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-mode]');
      if (!b) return;
      state.mode = b.dataset.mode;
      changed();
    });

    $('btn-net-random').addEventListener('click', function () {
      if (state.mode === 'grid' || state.nets.length < 2) return;
      var i = state.netIndex;
      while (i === state.netIndex) i = Math.floor(Math.random() * state.nets.length);
      state.netIndex = i;
      changed();
      var act = $('gallery').querySelector('.net-thumb.active');
      if (act) act.scrollIntoView({ block: 'nearest' });
    });

    $('gallery').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-net]');
      if (!b) return;
      state.netIndex = +b.dataset.net;
      changed();
    });

    $('net-view').addEventListener('click', function (e) {
      var g = e.target.closest('.net-face');
      if (!g) return;
      state.selected = +g.dataset.face;
      changed();
    });

    $('grid').addEventListener('click', function (e) {
      var b = e.target.closest('.cell');
      if (!b) return;
      var k = b.dataset.k, p = k.split(',');
      if (!state.grid[k]) {
        var n = Object.keys(state.grid).length;
        if (n >= 6) { flash('Sudah 6 kotak — hapus dulu salah satunya (klik kanan).'); return; }
        if (n > 0 && !(state.grid[Geo.key(+p[0] - 1, +p[1])] || state.grid[Geo.key(+p[0] + 1, +p[1])] ||
          state.grid[Geo.key(+p[0], +p[1] - 1)] || state.grid[Geo.key(+p[0], +p[1] + 1)])) {
          flash('Kotak baru harus menempel pada kotak yang sudah ada.');
          return;
        }
        state.grid[k] = true;
      }
      refold();
      if (state.fold.valid && state.fold.map[k]) state.selected = state.fold.map[k].face;
      changed();
    });

    $('grid').addEventListener('contextmenu', function (e) {
      var b = e.target.closest('.cell');
      if (!b) return;
      e.preventDefault();
      delete state.grid[b.dataset.k];
      changed();
    });

    $('face-strip').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-face]');
      if (!b) return;
      state.selected = +b.dataset.face;
      changed();
    });

    $('fe-type').addEventListener('change', function () { updateArt({ type: this.value }); });
    $('fe-n').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (b) updateArt({ n: +b.dataset.n });
    });
    $('fe-text').addEventListener('input', function () { updateArt({ text: this.value }); });
    $('fe-fg').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (b) updateArt({ fg: b.dataset.c });
    });
    $('fe-bg').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (b) updateArt({ bg: b.dataset.c });
    });
    $('fe-rot-cw').addEventListener('click', function () {
      updateArt({ rot: Solids.norm360(selectedState().rot + 90) });
    });
    $('fe-rot-ccw').addEventListener('click', function () {
      updateArt({ rot: Solids.norm360(selectedState().rot - 90) });
    });
    $('btn-copy-bg').addEventListener('click', function () {
      var bg = selectedState().art.bg;
      state.faces.forEach(function (f) { f.art.bg = bg; });
      changed();
    });

    $('btn-dice').addEventListener('click', fillNumbers);
    $('btn-random').addEventListener('click', randomFill);
    $('btn-clear-art').addEventListener('click', clearArt);

    $('btn-view-reset').addEventListener('click', function () {
      stopSpin(); state.rotM = defaultRot(); renderPreview();
    });
    $('btn-view-spin').addEventListener('click', function () {
      if (state.spinTimer) { stopSpin(); return; }
      this.classList.add('active');
      state.spinTimer = setInterval(function () {
        state.rotM = Solids.orthonormalize(
          Solids.matMul(Solids.anglesToMatrix(1.6, 0), state.rotM || defaultRot()));
        renderPreview();
      }, 40);
    });

    $('btn-generate').addEventListener('click', generate);
    $('qtype').addEventListener('change', function () {
      // tingkat kesulitan hanya berpengaruh pada tipe "jaring-jaring -> bangun ruang"
      $('difficulty').disabled = this.value !== 'toSolid';
      if (state.quiz) generate();
    });
    $('difficulty').addEventListener('change', function () { if (state.quiz) generate(); });
    $('show-key').addEventListener('change', function () { if (state.quiz) renderQuiz(); });
    $('answer-buttons').addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (b) answerClicked(+b.dataset.i);
    });

    $('btn-png').addEventListener('click', downloadPNG);
    $('btn-svg').addEventListener('click', downloadSVG);
    $('btn-add-bank').addEventListener('click', function () { addToBank(); });
    $('btn-batch').addEventListener('click', batchGenerate);
    $('btn-pdf').addEventListener('click', downloadPDF);
    $('btn-print').addEventListener('click', printBank);
    $('btn-clear-bank').addEventListener('click', function () {
      state.bank = []; renderBank(); batchStatus('');
    });
    $('bank').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-del]');
      if (!b) return;
      state.bank.splice(+b.dataset.del, 1);
      renderBank();
    });
  }

  function init() {
    buildEditorOnce();
    bind();
    bindPreviewDrag();
    if (!load()) {
      setSolid('kubus', null, false);
      fillNumbers();
    }
    changed();
    renderBank();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
