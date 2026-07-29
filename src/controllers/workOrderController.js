const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET All Work Orders
exports.getAllWorkOrders = async (req, res) => {
  try {
    const workOrders = await prisma.workOrder.findMany({
      include: { device: true },
      orderBy: { transactionDate: 'desc' }
    });
    res.json({ success: true, data: workOrders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST Create Work Order (Dengan Otomatisasi Update Status Device)
exports.createWorkOrder = async (req, res) => {
  try {
    const {
      formNumber,
      ticketNumber,
      transactionDate,
      serialNumber, // Input via scan atau pilihan
      customerCode,
      areaName,
      receiverTech,
      fieldTech,
      actionType,
      notes
    } = req.body;

    // 1. Cari device berdasarkan SN
    let device = await prisma.device.findUnique({ where: { serialNumber } });

    // Jika device belum ada di database, buat otomatis (Auto-register)
    if (!device) {
      device = await prisma.device.create({
        data: {
          serialNumber,
          brandType: 'UNKNOWN',
          condition: 'SECOND',
          status: 'IN_STOCK'
        }
      });
    }

    // 2. Tentukan status baru perangkat berdasarkan aksi
    let newDeviceStatus = device.status;
    if (['AKTIVASI', 'RECONNECT', 'MAINTENANCE'].includes(actionType.toUpperCase())) {
      newDeviceStatus = 'DEPLOYED';
    } else if (['DIKEMBALIKAN', 'RUSAK'].includes(actionType.toUpperCase())) {
      newDeviceStatus = actionType.toUpperCase() === 'RUSAK' ? 'SCRAP' : 'RETURNED';
    }

    // 3. Gunakan Database Transaction untuk memastikan konsistensi data
    const result = await prisma.$transaction(async (tx) => {
      // Update status device
      await tx.device.update({
        where: { id: device.id },
        data: { status: newDeviceStatus }
      });

      // Buat Work Order
      const workOrder = await tx.workOrder.create({
        data: {
          formNumber,
          ticketNumber,
          transactionDate: new Date(transactionDate),
          deviceId: device.id,
          customerCode,
          areaName,
          receiverTech,
          fieldTech,
          actionType,
          notes
        },
        include: { device: true }
      });

      return workOrder;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};