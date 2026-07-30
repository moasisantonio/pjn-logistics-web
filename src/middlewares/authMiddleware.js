// src/middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');

// 1. Verifikasi Token Login
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak ditemukan.' });
  }

  try {
    // Tambahkan fallback key agar selalu sama dengan yang ada di rute login
    const secretKey = process.env.JWT_SECRET || 'secret_key_pjn_logistics_2026';
    const decoded = jwt.verify(token, secretKey);
    
    req.user = decoded; // Berisi: { username, role }
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token tidak valid atau expired.' });
  }
};

// 2. Verifikasi Hak Akses (Role-Based)
const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Akses ditolak. Fitur ini tidak dapat diakses oleh role: ${req.user?.role || 'Guest'}` 
      });
    }
    next();
  };
};

module.exports = { verifyToken, allowRoles };