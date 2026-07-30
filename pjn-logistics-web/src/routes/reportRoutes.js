const express = require('express');
const router = express.Router();
const { exportExcelReport, getDeviceHistory } = require('../controllers/reportController');

router.get('/export/excel', exportExcelReport);
router.get('/history/:sn', getDeviceHistory);

module.exports = router;