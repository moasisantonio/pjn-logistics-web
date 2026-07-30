// src/services/excelImporter.js
const ExcelJS = require('exceljs');

/**
 * Membaca file Excel dan mengembalikan data terstruktur dari semua sheet
 * @param {string} filePath - Path lokasi file temp excel yang diupload
 */
async function parseExcelDatabase(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const parsedResult = {
    pjnSecond: [],
    pjnNew: [],
    mitraNew: [],
    stockProxi: [],
    stockMitra: []
  };

  // ----------------------------------------------------
  // 1. Parsing Sheet PJN.SECOND
  // ----------------------------------------------------
  const secondSheet = workbook.getWorksheet('PJN.SECOND');
  if (secondSheet) {
    secondSheet.eachRow((row, rowNumber) => {
      // Baris 1 & 2 adalah header/judul di file Excel
      if (rowNumber > 2) {
        const sn = row.getCell(8).text?.trim();
        if (sn) { // Hanya proses jika SN terisi
          parsedResult.pjnSecond.push({
            tanggal: row.getCell(2).text,
            namaBarang: row.getCell(3).text,
            noForm: row.getCell(4).text,
            noPO: row.getCell(5).text,
            noDO: row.getCell(6).text,
            pSN: row.getCell(7).text,
            sn: sn,
            kondisi: row.getCell(9).text || 'SECOND',
            teknisiPenerima: row.getCell(10).text,
            alamatPemasangan: row.getCell(11).text,
            area: row.getCell(12).text,
            idPelanggan: row.getCell(13).text,
            keterangan: row.getCell(14).text,
            teknisi: row.getCell(15).text
          });
        }
      }
    });
  }

  // ----------------------------------------------------
  // 2. Parsing Sheet PJN.NEW & MITRA.NEW
  // ----------------------------------------------------
  const processNewSheet = (sheetName) => {
    const sheet = workbook.getWorksheet(sheetName);
    const dataList = [];
    if (!sheet) return dataList;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 2) {
        const snMasuk = row.getCell(9).text?.trim();
        const snKeluar = row.getCell(17).text?.trim();

        if (snMasuk || snKeluar) {
          dataList.push({
            // Data Masuk / Pembelian
            tanggalPembelian: row.getCell(2).text,
            namaBarang: row.getCell(3).text,
            supplier: row.getCell(4).text,
            kondisi: row.getCell(5).text || 'NEW',
            noPO: row.getCell(6).text,
            noDO: row.getCell(7).text,
            pSN: row.getCell(8).text,
            sn: snMasuk,
            statusBarang: row.getCell(10).text,

            // Data Keluar / Pemasangan Pelanggan
            tanggalKeluar: row.getCell(12).text,
            teknisiPenerima: row.getCell(13).text,
            noForm: row.getCell(14).text,
            snKeluar: snKeluar,
            alamatPemasangan: row.getCell(18).text,
            idPelanggan: row.getCell(19).text,
            area: row.getCell(20).text,
            keterangan: row.getCell(21).text,
            teknisi: row.getCell(22).text
          });
        }
      }
    });
    return dataList;
  };

  parsedResult.pjnNew = processNewSheet('PJN.NEW');
  parsedResult.mitraNew = processNewSheet('MITRA.NEW');

  // ----------------------------------------------------
  // 3. Parsing Stock Opname (Proxi & Mitra)
  // ----------------------------------------------------
  const processStockOpname = (sheetName) => {
    const sheet = workbook.getWorksheet(sheetName);
    const stockList = [];
    if (!sheet) return stockList;

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 2) {
        const item = row.getCell(2).text?.trim();
        if (item) {
          stockList.push({
            item: item,
            quantity: parseFloat(row.getCell(3).value) || 0,
            price: parseFloat(row.getCell(4).value) || 0,
            quantityOpName: parseFloat(row.getCell(5).value) || 0,
            pcs: row.getCell(6).text,
            overridePrice: parseFloat(row.getCell(7).value) || 0,
            noteDetail: row.getCell(8).text
          });
        }
      }
    });
    return stockList;
  };

  parsedResult.stockProxi = processStockOpname('STOCK OPNAME PROXI');
  parsedResult.stockMitra = processStockOpname('STOCK OPNAME MITRA');

  return parsedResult;
}

module.exports = { parseExcelDatabase };