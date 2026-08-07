/*
 * art.js — pustaka gambar untuk sisi kubus.
 *
 * Setiap gambar digambar di dalam kotak koordinat 0..100 (u ke kanan, v ke bawah).
 * `sym` = orde simetri putar: 0 (sama dari SEGALA arah, mis. lingkaran), 4 (sama tiap
 * 90 derajat), 2 (sama tiap 180), 1 (tidak simetri).
 * Aturan aman: sym boleh melebih-lebihkan simetri, TIDAK BOLEH mengurangi — kalau kurang,
 * pengecoh hasil putaran bisa tampak identik dengan jawaban benar (soal jadi ambigu).
 * Orde 0 penting sejak ada sisi segitiga: di sana simetri bangun menghasilkan putaran
 * 120 derajat, dan lingkaran yang diputar 120 derajat harus tetap dianggap sama.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Art = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var PIP = { l: 27, m: 50, r: 73, t: 27, b: 73 };
  var PIPS = {
    1: [[PIP.m, PIP.m]],
    2: [[PIP.l, PIP.t], [PIP.r, PIP.b]],
    3: [[PIP.l, PIP.t], [PIP.m, PIP.m], [PIP.r, PIP.b]],
    4: [[PIP.l, PIP.t], [PIP.r, PIP.t], [PIP.l, PIP.b], [PIP.r, PIP.b]],
    5: [[PIP.l, PIP.t], [PIP.r, PIP.t], [PIP.m, PIP.m], [PIP.l, PIP.b], [PIP.r, PIP.b]],
    6: [[PIP.l, PIP.t], [PIP.r, PIP.t], [PIP.l, PIP.m], [PIP.r, PIP.m], [PIP.l, PIP.b], [PIP.r, PIP.b]]
  };
  var PIP_SYM = { 1: 0, 2: 2, 3: 2, 4: 4, 5: 4, 6: 2 };   // mata 1 = satu titik di tengah: bebas arah

  // karakter yang terlihat sama saat diputar — dianggap simetris agar soal tidak ambigu
  var SYM4_CHARS = 'Oo0Xx+*#.•■□●○';
  var SYM2_CHARS = SYM4_CHARS + 'HINSZnsz8|-=─│';

  function poly(pts, fill) {
    return '<polygon points="' + pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' ') +
      '" fill="' + fill + '"/>';
  }

  var TYPES = [
    {
      id: 'blank', label: 'Polos', sym: 0, uses: [],
      draw: function () { return ''; }
    },
    {
      id: 'square', label: 'Kotak kecil', sym: 4, uses: [],
      draw: function (p) { return '<rect x="30" y="30" width="40" height="40" fill="' + p.fg + '"/>'; }
    },
    {
      id: 'circle', label: 'Lingkaran', sym: 0, uses: [],
      draw: function (p) { return '<circle cx="50" cy="50" r="22" fill="' + p.fg + '"/>'; }
    },
    {
      id: 'ring', label: 'Cincin', sym: 0, uses: [],
      draw: function (p) {
        return '<circle cx="50" cy="50" r="21" fill="none" stroke="' + p.fg + '" stroke-width="9"/>';
      }
    },
    {
      id: 'dice', label: 'Mata dadu', sym: function (p) { return PIP_SYM[p.n || 1]; }, uses: ['n'],
      draw: function (p) {
        var n = Math.min(6, Math.max(1, p.n || 1));
        return PIPS[n].map(function (q) {
          return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="9.5" fill="' + p.fg + '"/>';
        }).join('');
      }
    },
    {
      id: 'triangle', label: 'Segitiga', sym: 1, uses: [],
      draw: function (p) { return poly([[50, 20], [80, 76], [20, 76]], p.fg); }
    },
    {
      id: 'arrow', label: 'Panah', sym: 1, uses: [],
      draw: function (p) {
        return poly([[50, 16], [78, 50], [62, 50], [62, 84], [38, 84], [38, 50], [22, 50]], p.fg);
      }
    },
    {
      id: 'text', label: 'Huruf / angka', uses: ['text'],
      sym: function (p) {
        var t = (p.text || '').trim();
        if (t.length !== 1) return 1;
        if (SYM4_CHARS.indexOf(t) >= 0) return 4;
        if (SYM2_CHARS.indexOf(t) >= 0) return 2;
        return 1;
      },
      draw: function (p) {
        var t = (p.text || 'A').slice(0, 3);
        var size = t.length === 1 ? 62 : (t.length === 2 ? 44 : 34);
        return '<text x="50" y="50" fill="' + p.fg + '" font-size="' + size + '"' +
          ' font-family="Arial, Helvetica, sans-serif" font-weight="700"' +
          ' text-anchor="middle" dominant-baseline="central">' + esc(t) + '</text>';
      }
    },
    {
      id: 'diag', label: 'Segitiga sudut', sym: 1, uses: [],
      draw: function (p) { return poly([[0, 0], [100, 0], [0, 100]], p.fg); }
    },
    {
      id: 'half', label: 'Separuh', sym: 1, uses: [],
      draw: function (p) { return '<rect x="0" y="0" width="100" height="50" fill="' + p.fg + '"/>'; }
    },
    {
      id: 'stripe', label: 'Garis tengah', sym: 2, uses: [],
      draw: function (p) { return '<rect x="38" y="0" width="24" height="100" fill="' + p.fg + '"/>'; }
    },
    {
      id: 'plus', label: 'Tanda plus', sym: 4, uses: [],
      draw: function (p) {
        return '<rect x="40" y="16" width="20" height="68" fill="' + p.fg + '"/>' +
          '<rect x="16" y="40" width="68" height="20" fill="' + p.fg + '"/>';
      }
    },
    {
      id: 'ex', label: 'Tanda silang', sym: 4, uses: [],
      draw: function (p) {
        return '<g stroke="' + p.fg + '" stroke-width="16" stroke-linecap="butt">' +
          '<line x1="22" y1="22" x2="78" y2="78"/><line x1="78" y1="22" x2="22" y2="78"/></g>';
      }
    },
    {
      id: 'star', label: 'Bintang', sym: 1, uses: [],
      draw: function (p) {
        var pts = [], i, a, r;
        for (i = 0; i < 10; i++) {
          a = -Math.PI / 2 + i * Math.PI / 5;
          r = i % 2 === 0 ? 36 : 15;
          pts.push([+(50 + r * Math.cos(a)).toFixed(2), +(50 + r * Math.sin(a)).toFixed(2)]);
        }
        return poly(pts, p.fg);
      }
    },
    {
      id: 'corner', label: 'Kotak pojok', sym: 1, uses: [],
      draw: function (p) { return '<rect x="14" y="14" width="30" height="30" fill="' + p.fg + '"/>'; }
    },
    {
      id: 'ell', label: 'Bentuk L', sym: 1, uses: [],
      draw: function (p) { return poly([[26, 18], [46, 18], [46, 62], [80, 62], [80, 82], [26, 82]], p.fg); }
    }
  ];

  var BY_ID = {};
  TYPES.forEach(function (t) { BY_ID[t.id] = t; });

  function get(id) { return BY_ID[id] || BY_ID.blank; }

  function symmetryOf(art) {
    if (!art) return 0;
    // gambar yang warnanya sama dengan latar = sisi polos, sama dari segala arah
    if (art.fg === art.bg) return 0;
    var t = get(art.type);
    return typeof t.sym === 'function' ? t.sym(art) : t.sym;
  }

  /**
   * Sudut putar setelah dinormalkan terhadap simetri gambar.
   * Sudut bisa bukan kelipatan 90 (sisi segitiga menghasilkan kelipatan 120),
   * jadi hasilnya dibulatkan agar galat pecahan tidak membuat dua sudut yang
   * sebenarnya sama dianggap berbeda.
   */
  function canonRot(art, rot) {
    var sym = symmetryOf(art);
    if (!sym) return 0;                     // bebas arah: sudut berapa pun sama saja
    var period = 360 / sym;
    var v = ((((rot || 0) % period) + period) % period);
    v = Math.round(v * 100) / 100;
    if (Math.abs(v - period) < 0.02 || Math.abs(v) < 0.02) v = 0;
    return v;
  }

  /** Kunci identitas visual: dua sisi dengan kunci sama pasti tampak sama. */
  function visualKey(art, rot) {
    if (!art) return 'nil';
    var solid = art.fg === art.bg || art.type === 'blank';
    if (solid) return 'solid:' + art.bg;
    return [art.type, art.n || '', (art.text || '').trim(), art.fg, art.bg, canonRot(art, rot)].join('|');
  }

  function isBlank(art) {
    return !art || art.type === 'blank' || art.fg === art.bg;
  }

  /** Warna latar sisi (mengisi seluruh bidang sisi, bukan hanya kotak gambar). */
  function bgOf(art) { return (art && art.bg) || '#ffffff'; }

  /** Gambar saja di dalam kotak 0..100, tanpa latar dan belum diputar. */
  function shape(art) {
    if (!art) return '';
    return get(art.type).draw({
      fg: art.fg || '#111111', bg: art.bg || '#ffffff', n: art.n, text: art.text
    });
  }

  /** Isi kotak 0..100: latar + gambar (belum diputar). */
  function inner(art) {
    return '<rect x="0" y="0" width="100" height="100" fill="' + bgOf(art) + '"/>' + shape(art);
  }

  function defaultArt(over) {
    var a = { type: 'blank', fg: '#111111', bg: '#ffffff', n: 1, text: 'A', rot: 0 };
    if (over) Object.keys(over).forEach(function (k) { a[k] = over[k]; });
    return a;
  }

  function label(art) {
    if (!art) return 'kosong';
    var t = get(art.type);
    if (art.type === 'dice') return 'mata ' + (art.n || 1);
    if (art.type === 'text') return 'huruf "' + (art.text || '') + '"';
    if (art.type === 'blank') return art.bg === '#ffffff' ? 'polos' : 'blok warna';
    return t.label.toLowerCase();
  }

  return {
    TYPES: TYPES, get: get, symmetryOf: symmetryOf, canonRot: canonRot,
    visualKey: visualKey, isBlank: isBlank, inner: inner, shape: shape, bgOf: bgOf,
    defaultArt: defaultArt, label: label, esc: esc
  };
});
