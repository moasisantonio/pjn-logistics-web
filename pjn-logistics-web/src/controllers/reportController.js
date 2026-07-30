const { PrismaClient } = require('@prisma/client');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const prisma = new PrismaClient();

// 1. Ekspor Laporan Excel Rekap Bulanan
const exportExcelReport = async (req, res) => {
  try {
    const { month, year } = req.query; // misal ?month=7&year=2026
    const startDate = new Date(year || 2026, (month || 7) - 1, 1);
    const endDate = new Date(year || 2026, month || 7, 0, 23, 59, 59);

    const workOrders = await prisma.workOrder.findMany({
      where: {
        transactionDate: {
          gte: startDate,
          lte: endDate
        }
      },
      include: { device: true },
      orderBy: { transactionDate: 'desc' }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Rekap Logistik');

    worksheet.columns = [
      { header: 'No. Form', key: 'formNumber', width: 18 },
      { header: 'Tanggal', key: 'transactionDate', width: 15 },
      { header: 'Serial Number', key: 'serialNumber', width: 20 },
      { header: 'Merk/Tipe', key: 'brandType', width: 18 },
      { header: 'Aksi', key: 'actionType', width: 15 },
      { header: 'Teknisi Lapangan', key: 'fieldTech', width: 20 },
      { header: 'ID Pelanggan', key: 'customerCode', width: 15 },
      { header: 'Area', key: 'areaName', width: 15 },
      { header: 'Catatan', key: 'notes', width: 25 }
    ];

    workOrders.forEach((wo) => {
      worksheet.addRow({
        formNumber: wo.formNumber,
        transactionDate: wo.transactionDate.toISOString().split('T')[0],
        serialNumber: wo.device.serialNumber,
        brandType: wo.device.brandType,
        actionType: wo.actionType,
        fieldTech: wo.fieldTech || '-',
        customerCode: wo.customerCode || '-',
        areaName: wo.areaName || '-',
        notes: wo.notes || '-'
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Rekap_Logistik_${month}_${year}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. Lookup / Search Riwayat Lengkap Per Serial Number
const getDeviceHistory = async (req, res) => {
  try {
    const { sn } = req.params;
    const device = await prisma.device.findUnique({
      where: { serialNumber: sn },
      include: {
        workOrders: {
          orderBy: { transactionDate: 'desc' }
        }
      }
    });

    if (!device) {
      return res.status(404).json({ success: false, error: 'Serial Number tidak ditemukan di database.' });
    }

    return res.status(200).json({ success: true, data: device });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  exportExcelReport,
  getDeviceHistory
};