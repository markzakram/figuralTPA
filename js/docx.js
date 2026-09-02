/*
 * docx.js — penyusun berkas Word (.docx) tanpa pustaka luar.
 *
 * Sebuah .docx adalah arsip ZIP berisi XML. Karena itu berkasnya disusun dua
 * lapis: penulis ZIP di bawah (header lokal, direktori pusat, EOCD, CRC-32),
 * dan penyusun WordprocessingML di atasnya.
 *
 * Berbeda dari PDF yang teksnya harus Latin-1, Word menyimpan teks sebagai UTF-8
 * sehingga panah "->" dan tanda kali tetap tertulis sebagaimana adanya.
 *
 * Satu soal menempati DUA halaman: halaman soal (judul + gambar soal + pilihan
 * A-E) dan halaman pembahasan (kunci + gambar bernomor + uraian). PDF memakai
 * empat halaman karena formatnya layar 16:9; untuk berkas yang akan disunting,
 * dua halaman A4 lebih ringkas tanpa kehilangan isi.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Docx = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var enc = new TextEncoder();

  // A4 melintang. Satuan Word: twip (1/1440 inci) untuk halaman, EMU
  // (1/914400 inci) untuk gambar.
  var HAL_LEBAR = 16838, HAL_TINGGI = 11906, TEPI = 1134;   // tepi 2 cm
  var TWIP_KE_EMU = 635;
  var ISI_LEBAR = (HAL_LEBAR - TEPI * 2) * TWIP_KE_EMU;
  var ISI_TINGGI = (HAL_TINGGI - TEPI * 2) * TWIP_KE_EMU;

  var WARNA_TINGKAT = { Mudah: '2E7D32', Sedang: 'B36B00', Sulit: 'B32620' };

  // ---------------------------------------------------------------- ZIP

  var TABEL_CRC = null;
  function crc32(u8) {
    if (!TABEL_CRC) {
      TABEL_CRC = new Uint32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        TABEL_CRC[n] = c >>> 0;
      }
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < u8.length; i++) crc = TABEL_CRC[(crc ^ u8[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  /**
   * Deflate mentah (metode ZIP 8) lewat CompressionStream bawaan peramban.
   * Kalau tidak tersedia, isinya disimpan apa adanya (metode 0) — berkasnya
   * tetap sah, hanya lebih besar. Gambar PNG sudah termampat sehingga
   * selisihnya kecil.
   */
  function kempis(u8) {
    if (typeof CompressionStream !== 'function') return Promise.resolve(null);
    try {
      var aliran = new Blob([u8]).stream().pipeThrough(new CompressionStream('deflate-raw'));
      return new Response(aliran).arrayBuffer()
        .then(function (buf) { return new Uint8Array(buf); })
        .catch(function () { return null; });
    } catch (e) {
      return Promise.resolve(null);
    }
  }

  function penulisBiner() {
    var bagian = [], panjang = 0;
    function dorong(u8) { bagian.push(u8); panjang += u8.length; }
    return {
      get panjang() { return panjang; },
      byte: function () { dorong(new Uint8Array(arguments)); },
      u16: function (v) { dorong(new Uint8Array([v & 0xFF, (v >>> 8) & 0xFF])); },
      u32: function (v) {
        dorong(new Uint8Array([v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]));
      },
      data: dorong,
      gabung: function () { return bagian; }
    };
  }

  /**
   * Susun arsip ZIP dari daftar { nama, data:Uint8Array }.
   * Waktu berkas dipatok tetap supaya keluaran dapat diulang persis.
   */
  function zip(berkas) {
    var WAKTU = 0, TANGGAL = ((2024 - 1980) << 9) | (1 << 5) | 1;   // 1 Januari 2024
    return Promise.all(berkas.map(function (f) {
      return kempis(f.data).then(function (padat) {
        var pakai = padat && padat.length < f.data.length;
        return {
          nama: enc.encode(f.nama),
          mentah: f.data,
          isi: pakai ? padat : f.data,
          metode: pakai ? 8 : 0,
          crc: crc32(f.data)
        };
      });
    })).then(function (entri) {
      var w = penulisBiner(), pusatEntri = [];

      entri.forEach(function (e) {
        e.offset = w.panjang;
        w.u32(0x04034B50);
        w.u16(20);            // versi minimum
        w.u16(0x0800);        // nama berkas UTF-8
        w.u16(e.metode);
        w.u16(WAKTU); w.u16(TANGGAL);
        w.u32(e.crc);
        w.u32(e.isi.length);
        w.u32(e.mentah.length);
        w.u16(e.nama.length);
        w.u16(0);
        w.data(e.nama);
        w.data(e.isi);
      });

      var awalPusat = w.panjang;
      entri.forEach(function (e) {
        w.u32(0x02014B50);
        w.u16(20); w.u16(20);
        w.u16(0x0800);
        w.u16(e.metode);
        w.u16(WAKTU); w.u16(TANGGAL);
        w.u32(e.crc);
        w.u32(e.isi.length);
        w.u32(e.mentah.length);
        w.u16(e.nama.length);
        w.u16(0); w.u16(0); w.u16(0);
        w.u16(0); w.u32(0);
        w.u32(e.offset);
        w.data(e.nama);
      });
      var ukuranPusat = w.panjang - awalPusat;

      w.u32(0x06054B50);
      w.u16(0); w.u16(0);
      w.u16(entri.length); w.u16(entri.length);
      w.u32(ukuranPusat); w.u32(awalPusat);
      w.u16(0);

      return new Blob(w.gabung(), {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
    });
  }

  // ---------------------------------------------------------------- WordprocessingML

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /**
   * Ukuran piksel sebuah PNG: petak IHDR menyimpan lebar pada byte 16-19 dan
   * tinggi pada byte 20-23 (setelah tanda tangan 8 byte dan kepala petak 8 byte).
   */
  function ukuranPng(u8) {
    var v = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    return { lebar: v.getUint32(16), tinggi: v.getUint32(20) };
  }

  /** Skalakan gambar agar muat dalam kotak yang tersedia, nisbahnya terjaga. */
  function pasGambar(lebarPx, tinggiPx, maksLebar, maksTinggi) {
    var k = Math.min(maksLebar / lebarPx, maksTinggi / tinggiPx);
    return { cx: Math.round(lebarPx * k), cy: Math.round(tinggiPx * k) };
  }

  /**
   * @param teks isi paragraf
   * @param o    { ukuran (pt), tebal, warna (RRGGBB), rata, jarakSesudah (twip) }
   */
  function paragraf(teks, o) {
    o = o || {};
    var pPr = '<w:pPr>' +
      (o.rata ? '<w:jc w:val="' + o.rata + '"/>' : '') +
      '<w:spacing w:after="' + (o.jarakSesudah == null ? 120 : o.jarakSesudah) + '" w:line="264" w:lineRule="auto"/>' +
      '</w:pPr>';
    var rPr = '<w:rPr>' +
      '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>' +
      (o.tebal ? '<w:b/>' : '') +
      (o.warna ? '<w:color w:val="' + o.warna + '"/>' : '') +
      '<w:sz w:val="' + Math.round((o.ukuran || 11) * 2) + '"/>' +
      '<w:szCs w:val="' + Math.round((o.ukuran || 11) * 2) + '"/>' +
      '</w:rPr>';
    if (teks === '') return '<w:p>' + pPr + '</w:p>';
    return '<w:p>' + pPr + '<w:r>' + rPr +
      '<w:t xml:space="preserve">' + esc(teks) + '</w:t></w:r></w:p>';
  }

  function pemisahHalaman() {
    return '<w:p><w:pPr><w:spacing w:after="0"/></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>';
  }

  /** Paragraf berisi satu gambar sebaris (inline), rata tengah. */
  function paragrafGambar(idGambar, rid, cx, cy, nama) {
    return '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="160"/></w:pPr><w:r><w:drawing>' +
      '<wp:inline distT="0" distB="0" distL="0" distR="0">' +
      '<wp:extent cx="' + cx + '" cy="' + cy + '"/>' +
      '<wp:effectExtent l="0" t="0" r="0" b="0"/>' +
      '<wp:docPr id="' + idGambar + '" name="' + esc(nama) + '"/>' +
      '<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>' +
      '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
      '<pic:pic>' +
      '<pic:nvPicPr><pic:cNvPr id="' + idGambar + '" name="' + esc(nama) + '"/><pic:cNvPicPr/></pic:nvPicPr>' +
      '<pic:blipFill><a:blip r:embed="' + rid + '"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
      '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm>' +
      '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
      '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
  }

  var KEPALA_XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

  function berkasContentTypes() {
    return KEPALA_XML +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Default Extension="png" ContentType="image/png"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '</Types>';
  }

  function berkasRels() {
    return KEPALA_XML +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>';
  }

  function berkasRelsDokumen(gambar) {
    return KEPALA_XML +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      gambar.map(function (g) {
        return '<Relationship Id="' + g.rid +
          '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/' +
          g.nama + '"/>';
      }).join('') +
      '</Relationships>';
  }

  function berkasDokumen(isi) {
    return KEPALA_XML +
      '<w:document ' +
      'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
      'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
      'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
      'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
      '<w:body>' + isi +
      '<w:sectPr>' +
      '<w:pgSz w:w="' + HAL_LEBAR + '" w:h="' + HAL_TINGGI + '" w:orient="landscape"/>' +
      '<w:pgMar w:top="' + TEPI + '" w:right="' + TEPI + '" w:bottom="' + TEPI + '" w:left="' + TEPI +
      '" w:header="708" w:footer="708" w:gutter="0"/>' +
      '</w:sectPr>' +
      '</w:body></w:document>';
  }

  // ---------------------------------------------------------------- API

  /**
   * @param {Array} soal daftar soal:
   *        { no, tipe, tingkat, jawaban, pembahasan:[string],
   *          gambarSoal, gambarPilihan, gambarPembahasan }
   *        gambar* = Uint8Array berisi PNG (boleh null)
   * @param {object} opsi { judul }
   * @returns {Promise<Blob>}
   */
  function buat(soal, opsi) {
    opsi = opsi || {};
    var gambar = [], isi = [];

    /** Daftarkan satu PNG, kembalikan paragraf gambarnya. */
    function sisipkan(png, maksTinggiBagian, nama) {
      if (!png || !png.length) return '';
      var uk = ukuranPng(png);
      var no = gambar.length + 1;
      var rid = 'rId' + (no + 10);
      gambar.push({ rid: rid, nama: 'gambar' + no + '.png', data: png });
      var d = pasGambar(uk.lebar, uk.tinggi, ISI_LEBAR, maksTinggiBagian);
      return paragrafGambar(no, rid, d.cx, d.cy, nama);
    }

    if (opsi.judul) {
      isi.push(paragraf(opsi.judul, { ukuran: 20, tebal: true, rata: 'center', jarakSesudah: 240 }));
    }

    soal.forEach(function (s, i) {
      if (i || opsi.judul) isi.push(pemisahHalaman());

      /* --- halaman soal --- */
      isi.push(paragraf('No. ' + s.no, { ukuran: 20, tebal: true, jarakSesudah: 80 }));
      if (s.tipe) isi.push(paragraf(s.tipe, { ukuran: 12, warna: '3F4655', jarakSesudah: 60 }));
      if (s.tingkat) {
        isi.push(paragraf('Tingkat Kesulitan: ' + s.tingkat,
          { ukuran: 12, tebal: true, warna: WARNA_TINGKAT[s.tingkat] || WARNA_TINGKAT.Sedang, jarakSesudah: 160 }));
      }
      // dua gambar berbagi tinggi halaman; judul di atas memakan sekitar seperlima
      isi.push(sisipkan(s.gambarSoal, ISI_TINGGI * 0.40, 'Soal ' + s.no));
      isi.push(sisipkan(s.gambarPilihan, ISI_TINGGI * 0.34, 'Pilihan soal ' + s.no));

      /* --- halaman pembahasan --- */
      isi.push(pemisahHalaman());
      isi.push(paragraf('Jawaban: ' + s.jawaban, { ukuran: 18, tebal: true, jarakSesudah: 80 }));
      isi.push(paragraf('Pembahasan:', { ukuran: 13, tebal: true, jarakSesudah: 120 }));
      isi.push(sisipkan(s.gambarPembahasan, ISI_TINGGI * 0.42, 'Pembahasan soal ' + s.no));
      (s.pembahasan || []).forEach(function (p) {
        isi.push(paragraf(p, { ukuran: 11, jarakSesudah: 100 }));
      });
    });

    var berkas = [
      { nama: '[Content_Types].xml', data: enc.encode(berkasContentTypes()) },
      { nama: '_rels/.rels', data: enc.encode(berkasRels()) },
      { nama: 'word/_rels/document.xml.rels', data: enc.encode(berkasRelsDokumen(gambar)) },
      { nama: 'word/document.xml', data: enc.encode(berkasDokumen(isi.join(''))) }
    ];
    gambar.forEach(function (g) {
      berkas.push({ nama: 'word/media/' + g.nama, data: g.data });
    });
    return zip(berkas);
  }

  return { buat: buat, zip: zip, crc32: crc32, ukuranPng: ukuranPng };
});
