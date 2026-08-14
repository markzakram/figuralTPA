/*
 * pdf.js — penyusun PDF tanpa pustaka luar.
 *
 * Halaman 1440 x 810 pt (20 x 11,25 inci, 16:9) dan satu soal tetap empat halaman:
 * judul, gambar soal, pilihan A-E, lalu kunci + pembahasan. Susunannya mengikuti
 * format PDF generator diagrammatical.
 *
 * Gambar disisipkan sebagai XObject: DeviceGray bila gambarnya hitam-putih
 * (datanya sepertiga), DeviceRGB bila berwarna. Kompresi memakai CompressionStream
 * bawaan peramban. Font memakai Helvetica bawaan pembaca PDF sehingga tidak perlu
 * disematkan.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Pdf = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LEBAR = 1440, TINGGI = 810, MARGIN = 81;
  var enc = new TextEncoder();

  var WARNA_TINGKAT = {
    Mudah: [0.18, 0.49, 0.2], Sedang: [0.7, 0.42, 0], Sulit: [0.7, 0.15, 0.12]
  };

  var GANTI = {
    '—': '-', '–': '-', '“': '"', '”': '"',
    '‘': "'", '’': "'", '…': '...', '×': 'x', '→': '->', '↔': '<->'
  };

  function keLatin1(s) {
    return String(s == null ? '' : s)
      .replace(/[—–“”‘’…×→↔]/g, function (c) { return GANTI[c] || c; })
      .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?');
  }

  function teksPdf(s) {
    return keLatin1(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  function kempis(u8) {
    if (typeof CompressionStream !== 'function') return Promise.resolve(null);
    var aliran = new Blob([u8]).stream().pipeThrough(new CompressionStream('deflate'));
    return new Response(aliran).arrayBuffer().then(function (buf) { return new Uint8Array(buf); });
  }

  /* ---------- pengukur lebar Helvetica lewat canvas ---------- */

  function buatPengukur() {
    var c = document.createElement('canvas');
    var ctx = c.getContext('2d');
    var memo = {};
    return function (teks, tebal, ukuran) {
      var kunci = (tebal ? 'b' : 'r') + '|' + ukuran + '|' + teks;
      if (memo[kunci] != null) return memo[kunci];
      ctx.font = (tebal ? 'bold ' : '') + ukuran + 'px Helvetica, Arial, sans-serif';
      var w = ctx.measureText(teks).width;
      memo[kunci] = w;
      return w;
    };
  }

  /** Penggal satu paragraf menjadi baris-baris yang muat selebar `lebar`. */
  function penggal(teks, lebar, ukur, tebal, ukuran) {
    var kata = String(teks).split(/\s+/).filter(Boolean);
    var baris = [], kini = '';
    kata.forEach(function (k) {
      var coba = kini ? kini + ' ' + k : k;
      if (kini && ukur(coba, tebal, ukuran) > lebar) { baris.push(kini); kini = k; }
      else kini = coba;
    });
    if (kini) baris.push(kini);
    return baris.length ? baris : [''];
  }

  function aliranTeks(baris, x, yAwal, ukuran, spasiBaris, ukur, tebal, warna) {
    var bagian = [], y = yAwal;
    baris.forEach(function (t) {
      if (t !== '') {
        var c = warna || [0.1, 0.1, 0.1];
        bagian.push(
          'BT ' + c[0].toFixed(3) + ' ' + c[1].toFixed(3) + ' ' + c[2].toFixed(3) + ' rg ' +
          (tebal ? '/F2' : '/F1') + ' ' + ukuran + ' Tf 1 0 0 1 ' + x.toFixed(2) + ' ' + y.toFixed(2) +
          ' Tm (' + teksPdf(t) + ') Tj ET'
        );
      }
      y -= spasiBaris;
    });
    return { isi: bagian.join('\n'), yAkhir: y };
  }

  /**
   * @param {Array} soal daftar soal:
   *        { no, tipe, tingkat, jawaban, pembahasan:[string], gambarSoal, gambarPilihan }
   *        gambar* = { lebar, tinggi, data, kanal }
   * @param {object} opsi { judul }
   * @returns {Promise<Blob>}
   */
  function buat(soal, opsi) {
    opsi = opsi || {};
    var ukur = buatPengukur();
    var objek = [];
    function tambah(isi) { objek.push(isi); return objek.length; }

    var noKatalog = tambah(null);
    var noPages = tambah(null);
    var noF1 = tambah('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
    var noF2 = tambah('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

    var halaman = [];
    function buatHalaman(isi, gambarNo) {
      var noIsi = tambah({ kamus: null, aliran: enc.encode(isi) });
      var xobj = gambarNo ? '/XObject << /Im0 ' + gambarNo + ' 0 R >>' : '';
      halaman.push(tambah(
        '<< /Type /Page /Parent ' + noPages + ' 0 R /MediaBox [0 0 ' + LEBAR + ' ' + TINGGI + '] ' +
        '/Resources << /Font << /F1 ' + noF1 + ' 0 R /F2 ' + noF2 + ' 0 R >> ' + xobj + ' >> ' +
        '/Contents ' + noIsi + ' 0 R >>'
      ));
    }

    function pasangGambar(g) {
      return kempis(g.data).then(function (padat) {
        var data = padat || g.data;
        return tambah({
          kamus: '<< /Type /XObject /Subtype /Image /Width ' + g.lebar + ' /Height ' + g.tinggi +
            ' /ColorSpace ' + (g.kanal === 1 ? '/DeviceGray' : '/DeviceRGB') +
            ' /BitsPerComponent 8 ' + (padat ? '/Filter /FlateDecode ' : '') +
            '/Length ' + data.length + ' >>',
          aliran: data
        });
      });
    }

    function halamanGambar(g, no, sisiAtas) {
      var rasio = g.lebar / g.tinggi;
      var cw = LEBAR - 2 * MARGIN;
      var ch = cw / rasio;
      var maks = TINGGI - 2 * (sisiAtas || 55);
      if (ch > maks) { ch = maks; cw = ch * rasio; }
      buatHalaman(
        'q ' + cw.toFixed(2) + ' 0 0 ' + ch.toFixed(2) + ' ' +
        ((LEBAR - cw) / 2).toFixed(2) + ' ' + ((TINGGI - ch) / 2).toFixed(2) + ' cm /Im0 Do Q',
        no
      );
    }

    // rantai promise supaya urutan objek pasti
    var rantai = Promise.resolve();
    soal.forEach(function (s) {
      rantai = rantai.then(function () {
        return Promise.all([pasangGambar(s.gambarSoal), pasangGambar(s.gambarPilihan)]);
      }).then(function (no) {
        /* --- halaman judul --- */
        var nomor = 'No. ' + s.no;
        var a = aliranTeks([nomor], 135, TINGGI / 2 + 40, 45, 60, ukur, true);
        var isi = [a.isi];
        var y = TINGGI / 2 - 25;
        if (s.tipe) {
          isi.push(aliranTeks([s.tipe], 135, y, 27, 36, ukur, true, [0.25, 0.28, 0.34]).isi);
          y -= 44;
        }
        if (s.tingkat) {
          var w = WARNA_TINGKAT[s.tingkat] || WARNA_TINGKAT.Sedang;
          isi.push(aliranTeks(['Tingkat Kesulitan:  ' + s.tingkat], 135, y, 27, 36, ukur, true, w).isi);
        }
        buatHalaman(isi.join('\n'));

        /* --- halaman gambar soal & halaman pilihan --- */
        halamanGambar(s.gambarSoal, no[0], 70);
        halamanGambar(s.gambarPilihan, no[1], 90);

        /* --- halaman jawaban --- */
        var lebarIsi = LEBAR - 200;
        var judul = 'Jawaban: ' + s.jawaban;
        var bagian = [aliranTeks([judul], 100, TINGGI - 110, 30, 44, ukur, true)];
        var yy = bagian[0].yAkhir - 16;
        var b = aliranTeks(['Pembahasan:'], 100, yy, 22, 34, ukur, true);
        bagian.push(b);
        yy = b.yAkhir - 4;
        (s.pembahasan || []).forEach(function (p) {
          var baris = penggal(p, lebarIsi, ukur, false, 22);
          var c = aliranTeks(baris, 100, yy, 22, 32, ukur, false);
          bagian.push(c);
          yy = c.yAkhir - 10;
        });
        buatHalaman(bagian.map(function (x) { return x.isi; }).join('\n'));
      });
    });

    return rantai.then(function () {
      objek[noKatalog - 1] = '<< /Type /Catalog /Pages ' + noPages + ' 0 R >>';
      objek[noPages - 1] = '<< /Type /Pages /Kids [' +
        halaman.map(function (n) { return n + ' 0 R'; }).join(' ') +
        '] /Count ' + halaman.length + ' >>';

      var bagian = [], panjang = 0;
      function dorong(u8) { bagian.push(u8); panjang += u8.length; }
      function dorongTeks(s) { dorong(enc.encode(s)); }

      dorongTeks('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
      var offset = [];
      objek.forEach(function (isi, i) {
        offset[i] = panjang;
        dorongTeks((i + 1) + ' 0 obj\n');
        if (isi && typeof isi === 'object' && 'aliran' in isi) {
          dorongTeks((isi.kamus || '<< /Length ' + isi.aliran.length + ' >>') + '\nstream\n');
          dorong(isi.aliran);
          dorongTeks('\nendstream\n');
        } else {
          dorongTeks(isi + '\n');
        }
        dorongTeks('endobj\n');
      });

      var awalXref = panjang;
      var xref = 'xref\n0 ' + (objek.length + 1) + '\n0000000000 65535 f \n';
      offset.forEach(function (o) {
        xref += String(o).padStart(10, '0') + ' 00000 n \n';
      });
      dorongTeks(xref);
      dorongTeks('trailer\n<< /Size ' + (objek.length + 1) + ' /Root ' + noKatalog +
        ' 0 R >>\nstartxref\n' + awalXref + '\n%%EOF\n');

      return new Blob(bagian, { type: 'application/pdf' });
    });
  }

  return { buat: buat, LEBAR: LEBAR, TINGGI: TINGGI, penggal: penggal, keLatin1: keLatin1 };
});
