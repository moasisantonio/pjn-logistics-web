const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ==========================================
// IMPOR RUTE MODUL APLIKASI
// ==========================================
const apiRoutes = require('./routes/api');
const deviceRoutes = require('./routes/deviceRoutes');
const workOrderRoutes = require('./routes/workOrderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 0. TRUST PROXY (Penting untuk SSL / Cloudflare / Nginx)
// ==========================================
app.set('trust proxy', 1);

// ==========================================
// 1. MIDDLEWARE GLOBAL (CORS & BODY PARSER)
// ==========================================
// Konfigurasi CORS Komprehensif untuk Frontend & Production
const allowedOrigins = [
  'https://proxinet.store',
  'http://proxinet.store',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000'
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Izinkan request tanpa origin (seperti Postman, cURL, atau mobile app)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        // Izinkan subdomain wildcard jika ada (contoh: app.proxinet.store)
        if (origin.endsWith('.proxinet.store')) {
          callback(null, true);
        } else {
          callback(new Error(`CORS Error: Origin '${origin}' tidak diizinkan.`));
        }
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    optionsSuccessStatus: 200
  })
);

// Body parser WAJIB dipanggil SEBELUM pendaftaran rute API
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==========================================
// 2. HEALTH CHECK & ROOT ENDPOINT
// ==========================================
app.get('/', (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'PJN Logistics API Server is Running',
    version: '1.0.0',
    protocol: req.protocol,
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 3. REGISTRASI API ROUTES
// ==========================================
// Endpoint Login & Pengujian Hak Akses Role (RBAC)
app.use('/api', apiRoutes);

// Endpoint Manajemen & Import Excel Modem/Perangkat
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
  console.error('💥 Server Error Unhandled Exception:', err.stack || err.message);

  // Tangkap spesifik CORS error agar tidak crash
  if (err.message && err.message.startsWith('CORS Error')) {
    return res.status(403).json({
      success: false,
      error: err.message
    });
  }

  return res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Terjadi kesalahan internal pada server.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ==========================================
// 6. PROCESS ERROR LISTENERS
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