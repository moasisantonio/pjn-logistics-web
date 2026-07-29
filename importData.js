const XLSX = require('xlsx');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const FILE_PATH = path.join(__dirname, 'database_lama.xlsx');

/**
 * Konversi tanggal Excel ke Format ISO DateTime (Diperlukan oleh Prisma DateTime)
 */
function parseExcelDateToISO(excelDate) {
  if (!excelDate) return new Date().toISOString();
  
  // Jika format angka serial dari Excel
  if (typeof excelDate === 'number') {
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }
  
  // Jika format String tanggal
  const parsed = new Date(excelDate);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }
  
  return new Date().toISOString();
}

/**
 * Ekstraktor ID Pelanggan (PB...) & Ticket (PJN-...)
 */
function parseCustomerAndTicket(rawText) {
  let customerCode = null;
  let ticketNumber = null;

  if (rawText && typeof rawText === 'string') {
    const matchID = rawText.match(/PB\d+/i);
    if (matchID) customerCode = matchID[0].toUpperCase();

    const matchTicket = rawText.match(/PJN-\d+/i);
    if (matchTicket) ticketNumber = matchTicket[0].toUpperCase();
  }

  return { customerCode, ticketNumber };
}

/**
 * Normalisasi Action Type sesuai enum Prisma / Controller
 */
function normalizeActionType(rawAction) {
  if (!rawAction) return 'MAINTENANCE';
  const act = rawAction.toString().toUpperCase().trim();
  
  if (act.includes('AKTIVASI') || act.includes('PASANG')) return 'AKTIVASI';
  if (act.includes('DISMANTLE') || act.includes('TARIK') || act.includes('PUTUS')) return 'DISMANTLE';
  if (act.includes('GANTI') || act.includes('REPLACE')) return 'REPLACE';
  
  return 'MAINTENANCE';
}

/**
 * Helper pencarian nilai kolom yang sangat fleksibel
 */
function getColumnValue(row, possibleNames) {
  for (const name of possibleNames) {
    const foundKey = Object.keys(row).find(
      (k) => k.trim().toLowerCase() === name.toLowerCase()
    );
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
      const val = row[foundKey].toString().trim();
      if (val !== '') return val;
    }
  }
  return '';
}

async function runImporter() {
  console.log(`📂 Membaca file: ${FILE_PATH}...`);

  try {
    const workbook = XLSX.readFile(FILE_PATH);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Read 2D matrix untuk mencari baris header
    const rawMatrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    let headerRowIndex = -1;
    for (let r = 0; r < Math.min(15, rawMatrix.length); r++) {
      const rowCells = rawMatrix[r].map(c => c.toString().toUpperCase().trim());
      if (rowCells.some(cell => cell.includes('SN') || cell.includes('P-SN') || cell.includes('BARANG'))) {
        headerRowIndex = r;
        break;
      }
    }

    if (headerRowIndex === -1) headerRowIndex = 2; // Default baris ke-3

    console.log(`🔍 Header kolom terdeteksi di baris ke-${headerRowIndex + 1}.\n`);

    const rawRows = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: "" });

    let successCount = 0;
    let failCount = 0;
    let skippedEmptyCount = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];

      const serialNumber = getColumnValue(row, ['SN', 'P-SN', 'No SN', 'Serial Number']);
      const parentSn = getColumnValue(row, ['P-SN']);
      const brandType = getColumnValue(row, ['Nama Barang', 'Barang']) || 'ZTE GPON F609';
      const tanggalRaw = getColumnValue(row, ['Tanggal', 'Tgl']);
      const noForm = getColumnValue(row, ['No Form', 'No. Form']) || 'FM/000/LOG/2026';
      const poNumber = getColumnValue(row, ['No. PO', 'PO']);
      const doNumber = getColumnValue(row, ['No. DO', 'DO']);
      const rawCustomerTicket = getColumnValue(row, ['ID pelanggan/ No Ticket', 'ID pelanggan / No Ticket']);
      const area = getColumnValue(row, ['Area', 'Wilayah']) || 'Batam';
      const teknisiPenerima = getColumnValue(row, ['Teknisi Penerima', 'Penerima']) || 'Admin';
      const teknisiLapangan = getColumnValue(row, ['Teknisi', 'Teknisi Lapangan']) || teknisiPenerima;
      const rawAksi = getColumnValue(row, ['Keterangan', 'Aksi']);
      const alamat = getColumnValue(row, ['Alamat Pemasangan', 'Alamat']);
      const kondisiRaw = getColumnValue(row, ['Kondisi']) || 'SECOND';

      // Abaikan jika tidak ada SN valid
      if (!serialNumber || serialNumber.toLowerCase() === 'sn' || serialNumber.length < 3) {
        skippedEmptyCount++;
        continue;
      }

      const { customerCode, ticketNumber } = parseCustomerAndTicket(rawCustomerTicket);
      const isNew = kondisiRaw.toUpperCase().includes('BARU') || kondisiRaw.toUpperCase().includes('NEW');

      // 1. Pastikan Device terdaftar terlebih dahulu
      try {
        await axios.post(`${API_BASE_URL}/devices`, {
          serialNumber: serialNumber,
          parentSn: parentSn !== serialNumber && parentSn !== '' ? parentSn : null,
          brandType: brandType,
          poNumber: poNumber || null,
          doNumber: doNumber || null,
          condition: isNew ? 'NEW' : 'SECOND',
          status: 'IN_STOCK'
        });
      } catch (devErr) {
        // Abaikan jika errornya karena SN sudah terdaftar (duplicate)
      }

      // 2. Buat Record Work Order
      const payloadWO = {
        formNumber: noForm,
        ticketNumber: ticketNumber,
        customerCode: customerCode,
        transactionDate: parseExcelDateToISO(tanggalRaw),
        serialNumber: serialNumber,
        areaName: area,
        receiverTech: teknisiPenerima,
        fieldTech: teknisiLapangan,
        actionType: normalizeActionType(rawAksi),
        notes: `Excel. Ket: ${rawAksi || '-'}. Alamat: ${alamat || '-'}`
      };

      try {
        const response = await axios.post(`${API_BASE_URL}/work-orders`, payloadWO);
        if (response.data.success || response.status === 200 || response.status === 201) {
          console.log(`✅ [Baris #${i + 4}] Sukses | SN: ${serialNumber} | Form: ${noForm}`);
          successCount++;
        }
      } catch (apiError) {
        failCount++;
        console.error(`❌ [Baris #${i + 4}] Gagal SN ${serialNumber}:`);
        if (apiError.response) {
          console.error(`   HTTP ${apiError.response.status}:`, apiError.response.data);
        } else {
          console.error(`   Error:`, apiError.message);
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    console.log('\n========================================');
    console.log('🎉 MIGRASI DATA LAMA SELESAI!');
    console.log(`BERHASIL DIPROSES : ${successCount} baris`);
    console.log(`GAGAL DIPROSES    : ${failCount} baris`);
    console.log(`SKIPPED / BLANK   : ${skippedEmptyCount} baris`);
    console.log('========================================');

  } catch (error) {
    console.error('💥 Error membaca file Excel:', error.message);
  }
}

runImporter();