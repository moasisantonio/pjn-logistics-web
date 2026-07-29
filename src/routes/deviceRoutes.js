const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/deviceController');

router.get('/', deviceController.getAllDevices);
router.get('/scan/:sn', deviceController.getDeviceBySN); // Dedicated endpoint scan barcode
router.post('/', deviceController.createDevice);
router.put('/:id', deviceController.updateDevice);

module.exports = router;