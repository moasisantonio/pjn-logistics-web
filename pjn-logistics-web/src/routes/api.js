const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Mengambil middleware dari src/middlewares/authMiddleware.js
const { verifyToken, allowRoles } = require('../middlewares/authMiddleware');

// ==========================================
// 1. ENDPOINT AUTHENTICATION (LOGIN MOCKUP)
// ==========================================
// Endpoint ini digunakan untuk pengujian / generate token sesuai role
router.post('/login', (req, res) => {
  const { username, role } = req.body;

  if (!username || !role) {
    return res.status(400).json({ 
      success: false, 
      message: 'Username dan role wajib diisi (super_admin, logistik, atau teknisi)' 
    });
  }

  // Buat Token JWT dengan payload role
  const secretKey = process.env.JWT_SECRET || 'secret_key_pjn_logistics_2026';
  const token = jwt.sign({ username, role }, secretKey, { expiresIn: '1d' });

  return res.status(200).json({
    success: true,
    message: `Login berhasil sebagai ${role}`,
    token
  });
});

// ==========================================
// 2. ENDPOINT ROLE-BASED ACCESS CONTROL (RBAC)
// ==========================================

// A. Pasang Pelanggan & Penarikan -> Akses: Super Admin, Logistik, Teknisi
router.post('/pelanggan/pasang', verifyToken, allowRoles('super_admin', 'logistik', 'teknisi'), (req, res) => {
  return res.json({ 
    success: true, 
    message: 'Berhasil memproses pasang pelanggan.',
    user: req.user 
  });
});

router.post('/pelanggan/penarikan', verifyToken, allowRoles('super_admin', 'logistik', 'teknisi'), (req, res) => {
  return res.json({ 
    success: true, 
    message: 'Berhasil memproses penarikan alat/modem.',
    user: req.user 
  });
});

// B. Logistik & Stok -> Akses: Super Admin & Logistik (Teknisi Ditolak / 403)
router.get('/logistik/stok', verifyToken, allowRoles('super_admin', 'logistik'), (req, res) => {
  return res.json({ 
    success: true, 
    message: 'Menampilkan data stok barang & inventaris.',
    user: req.user 
  });
});

// C. System Config / Edit Software -> Akses: Khusus Super Admin (Logistik & Teknisi Ditolak)
router.post('/system/config', verifyToken, allowRoles('super_admin'), (req, res) => {
  return res.json({ 
    success: true, 
    message: 'Konfigurasi sistem berhasil diperbarui.',
    user: req.user 
  });
});

module.exports = router;