const express = require('express');
const router = express.Router();
const workOrderController = require('../controllers/workOrderController');

router.get('/', workOrderController.getAllWorkOrders);
router.post('/', workOrderController.createWorkOrder);

module.exports = router;