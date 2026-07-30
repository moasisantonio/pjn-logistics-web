const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ==========================================
// IMPOR RUTE MODUL APLIKASI
// ==========================================
const apiRoutes = require('./routes/api'); // Rute Auth Login & RBAC (Teknisi, Logistik, Super Admin)
const deviceRoutes = require('./routes/deviceRoutes');
const workOrderRoutes = require('./routes/workOrderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 1. MIDDLEWARE GLOBAL
// ==========================================
// Izinkan akses Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Body parser WAJIB dipanggil sebelum registrasi rute API
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 2. HEALTH CHECK & ROOT ENDPOINT
// ==========================================
app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'PJN Logistics API Server is Running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 3. REGISTRASI API ROUTES
// ==========================================
// Endpoint Login & Pengujian Hak Akses Role (RBAC)
app.use('/api', apiRoutes);

// Endpoint Manajemen & Scan Perangkat/Modem
app.use('/api/devices', deviceRoutes);

// Endpoint Work Order / Pekerjaan Teknisi
app.use('/api/work-orders', workOrderRoutes);

// Endpoint Ringkasan Dashboard Control Center
app.use('/api/dashboard', dashboardRoutes);

// Endpoint Laporan PDF & Excel
app.use('/api/reports', reportRoutes);

// ==========================================
// 4. HANDLING ROUTE 404 (NOT FOUND)
// ==========================================
app.use((req, res, next) => {
  return res.status(404).json({
    success: false,
    error: `Resource endpoint '${req.originalUrl}' tidak ditemukan.`
  });
});

// ==========================================
// 5. GLOBAL ERROR HANDLING MIDDLEWARE
// ==========================================
app.use((err, req, res, next) => {
  console.error('💥 Server Error Unhandled Exception:', err.stack);
  
  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Terjadi kesalahan internal pada server.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==========================================
// 6. PROCESS ERROR LISTENERS
// (Menangkap error tersembunyi agar server tidak 'clean exit')
// ==========================================
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection pada Promise:', promise, 'alasan:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception terdeteksi:', err.message);
  console.error(err.stack);
});

// ==========================================
// 7. INISIALISASI SERVER LISTENING
// ==========================================
const server = app.listen(PORT, () => {
  console.log('==================================================');
  console.log(`🚀 PJN LOGISTICS API SERVER BERJALAN`);
  console.log(`📡 URL API : http://localhost:${PORT}`);
  console.log(`📅 TIME    : ${new Date().toLocaleString('id-ID')}`);
  console.log('==================================================');
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`💥 Port ${PORT} sedang digunakan oleh proses lain!`);
  } else {
    console.error('💥 Error saat menjalankan server:', err.message);
  }
});