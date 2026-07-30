const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const { verifyToken, allowRoles } = require('../middlewares/authMiddleware');
const { parseExcelDatabase } = require('../services/excelImporter');

// Buat folder uploads otomatis jika belum ada
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ 
  dest: uploadDir,
  limits: { fileSize: 20 * 1024 * 1024 } // Max 20MB
});

// 1. GET /api/devices (Healthcheck / Test Endpoint)
router.get('/', (req, res) => {
  return res.json({ 
    success: true, 
    message: 'Endpoint Device Management Aktif' 
  });
});

// 2. POST /api/devices/import-excel (Upload & Parse File Excel)
router.post('/import-excel', 
  verifyToken, 
  allowRoles('super_admin', 'logistik'), 
  upload.single('file'), 
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'File Excel (.xlsx) wajib diunggah!' 
        });
      }

      const filePath = req.file.path;

      // Parse seluruh sheet dari Excel
      const resultData = await parseExcelDatabase(filePath);

      // Hapus file temporary setelah selesai dibaca
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return res.status(200).json({
        success: true,
        message: 'File Excel berhasil diproses dan diimpor.',
        summary: {
          totalPjnSecond: resultData.pjnSecond.length,
          totalPjnNew: resultData.pjnNew.length,
          totalMitraNew: resultData.mitraNew.length,
          totalStockProxi: resultData.stockProxi.length,
          totalStockMitra: resultData.stockMitra.length
        },
        data: resultData
      });

    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      next(error);
    }
  }
);

module.exports = router;