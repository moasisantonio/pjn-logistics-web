const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Impor Rute Utama Modul Aplikasi
const deviceRoutes = require('./routes/deviceRoutes');
const workOrderRoutes = require('./routes/workOrderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// 1. MIDDLEWARE GLOBAL
// ==========================================
// Izinkan akses Cross-Origin Resource Sharing (CORS) dari frontend/web
app.use(cors());

// ... di bagian API Routes:
app.use('/api/reports', reportRoutes);

// Middleware untuk membaca request body berformat JSON
app.use(express.json());

// Middleware untuk membaca urlencoded data jika ada pengiriman form
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
// Endpoint Manajemen & Scan Modem/Perangkat Network (/api/devices)
app.use('/api/devices', deviceRoutes);

// Endpoint Transaksi & Log Pekerjaan Teknisi (/api/work-orders)
app.use('/api/work-orders', workOrderRoutes);

// Endpoint Statistik & Ringkasan Dashboard Control Center (/api/dashboard)
app.use('/api/dashboard', dashboardRoutes);

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
// 6. SERVER INITIALIZATION
// ==========================================
app.listen(PORT, () => {
  console.log('==================================================');
  console.log(`🚀 PJN LOGISTICS API SERVER BERJALAN`);
  console.log(`📡 URL API : http://localhost:${PORT}`);
  console.log(`📅 TIME    : ${new Date().toLocaleString('id-ID')}`);
  console.log('==================================================');
});