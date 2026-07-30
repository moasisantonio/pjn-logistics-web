const express = require('express');
const router = express.Router();
const { verifyToken, allowRoles } = require('../middlewares/authMiddleware');

// Semua endpoint di bawah wajib menyertakan verifyToken

// 1. Fitur Pasang Pelanggan & Penarikan -> BISA DIAKSES: super_admin, logistik, teknisi
router.post('/pelanggan/pasang', verifyToken, allowRoles('super_admin', 'logistik', 'teknisi'), (req, res) => {
  res.json({ message: 'Berhasil memproses pasang pelanggan.' });
});

router.post('/pelanggan/penarikan', verifyToken, allowRoles('super_admin', 'logistik', 'teknisi'), (req, res) => {
  res.json({ message: 'Berhasil memproses penarikan alat.' });
});

// 2. Fitur Logistik & Stok -> BISA DIAKSES: super_admin, logistik (Teknisi Ditolak)
router.get('/logistik/stok', verifyToken, allowRoles('super_admin', 'logistik'), (req, res) => {
  res.json({ message: 'Menampilkan data stok barang.' });
});

// 3. Fitur Edit Software / System Config -> HANYA: super_admin
router.post('/system/config', verifyToken, allowRoles('super_admin'), (req, res) => {
  res.json({ message: 'Konfigurasi sistem berhasil diperbarui.' });
});

module.exports = router;