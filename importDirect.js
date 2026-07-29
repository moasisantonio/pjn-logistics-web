const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config();

const prisma = new PrismaClient();
const FILE_PATH = path.join(__dirname, 'database_lama.xlsx');

/**
 * Konversi tanggal Excel yang AMAN dan Akurat
 */
function parseExcelDate(excelDate) {
  if (!excelDate) return new Date();

  // 1. Jika sudah bertipe Date Javascript (dibaca langsung oleh xlsx)
  if (excelDate instanceof Date && !isNaN(excelDate.getTime())) {
    return excelDate;
  }

  // 2. Jika berbentuk Angka Serial khas Excel (misal 45200 s/d 46000)
  if (typeof excelDate === 'number' && excelDate > 20000 && excelDate < 60000) {
    const date = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    return isNaN(date.getTime()) ? new Date() : date;
  }

  // 3. Jika berbentuk String (misal "2025-10-20", "20/10/2025", "20-10-2025")
  if (typeof excelDate === 'string') {
    const str = excelDate.trim();
    // Jika format DD/MM/YYYY atau DD-MM-YYYY
    const dmyMatch = str.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      const parsedDate = new Date(year, month, day);
      if (!isNaN(parsedDate.getTime())) return parsedDate;
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000 && parsed.getFullYear() < 2100) {
      return parsed;
    }
  }

  // Fallback jika tanggal di Excel kosong/invalid
  return new Date();
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
 * Helper pencarian nilai kolom
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

async function runDirectImport() {
  console.log(`📂 Membaca file Excel: ${FILE_PATH}...`);

  try {
    const workbook = XLSX.readFile(FILE_PATH, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Deteksi baris header
    const rawMatrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
    let headerRowIndex = -1;
    for (let r = 0; r < Math.min(15, rawMatrix.length); r++) {
      const rowCells = rawMatrix[r].map(c => c.toString().toUpperCase().trim());
      if (rowCells.some(cell => cell.includes('SN') || cell.includes('P-SN') || cell.includes('BARANG'))) {
        headerRowIndex = r;
        break;
      }
    }

    if (headerRowIndex === -1) headerRowIndex = 2;

    console.log(`🔍 Header terdeteksi di baris ke-${headerRowIndex + 1}. Memulai migrasi langsung ke Database Neon Cloud...\n`);

    const rawRows = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex, defval: "" });

    let successCount = 0;
    let failCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];

      const serialNumber = getColumnValue(row, ['SN', 'P-SN', 'No SN', 'Serial Number']);
      const parentSn = getColumnValue(row, ['P-SN']);
      const brandType = getColumnValue(row, ['Nama Barang', 'Barang']) || 'ZTE GPON F609';
      const tanggalRaw = row['Tanggal'] || getColumnValue(row, ['Tanggal', 'Tgl']);
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

      if (!serialNumber || serialNumber.toLowerCase() === 'sn' || serialNumber.length < 3) {
        skippedCount++;
        continue;
      }

      const { customerCode, ticketNumber } = parseCustomerAndTicket(rawCustomerTicket);
      const isNew = kondisiRaw.toUpperCase().includes('BARU') || kondisiRaw.toUpperCase().includes('NEW');
      const validDate = parseExcelDate(tanggalRaw);

      try {
        // 1. Upsert Device (Buat baru jika belum ada)
        const device = await prisma.device.upsert({
          where: { serialNumber: serialNumber },
          update: {
            parentSn: parentSn !== serialNumber && parentSn !== '' ? parentSn : undefined,
            brandType: brandType,
            status: 'DEPLOYED'
          },
          create: {
            serialNumber: serialNumber,
            parentSn: parentSn !== serialNumber && parentSn !== '' ? parentSn : null,
            brandType: brandType,
            poNumber: poNumber || null,
            doNumber: doNumber || null,
            condition: isNew ? 'NEW' : 'SECOND',
            status: 'DEPLOYED'
          }
        });

        // 2. Insert Work Order
        await prisma.workOrder.create({
          data: {
            formNumber: noForm,
            ticketNumber: ticketNumber,
            customerCode: customerCode,
            transactionDate: validDate,
            deviceId: device.id,
            areaName: area,
            receiverTech: teknisiPenerima,
            fieldTech: teknisiLapangan,
            actionType: rawAksi.toUpperCase() || 'MAINTENANCE',
            notes: `Alamat: ${alamat || '-'}`
          }
        });

        console.log(`✅ [Baris #${i + 4}] Sukses | SN: ${serialNumber} | Form: ${noForm} | Tgl: ${validDate.toISOString().split('T')[0]}`);
        successCount++;
      } catch (dbError) {
        console.error(`❌ [Baris #${i + 4}] Gagal DB SN ${serialNumber}:`, dbError.message);
        failCount++;
      }
    }

    console.log('\n========================================');
    console.log('🎉 MIGRASI DIRECT DATABASE SELESAI!');
    console.log(`BERHASIL DIPROSES : ${successCount} baris`);
    console.log(`GAGAL DIPROSES    : ${failCount} baris`);
    console.log(`SKIPPED / BLANK   : ${skippedCount} baris`);
    console.log('========================================');

  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

runDirectImport();