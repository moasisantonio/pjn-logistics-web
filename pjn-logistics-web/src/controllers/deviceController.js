const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all devices (Support filter status & search SN)
exports.getAllDevices = async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status) where.status = status;
    if (search) {
      where.OR = [
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { brandType: { contains: search, mode: 'insensitive' } }
      ];
    }

    const devices = await prisma.device.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: devices });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET device by Serial Number (Penting untuk Barcode Scan)
exports.getDeviceBySN = async (req, res) => {
  try {
    const { sn } = req.params;
    const device = await prisma.device.findUnique({
      where: { serialNumber: sn },
      include: { workOrders: { take: 5, orderBy: { createdAt: 'desc' } } }
    });

    if (!device) {
      return res.status(404).json({ success: false, message: 'Device/SN tidak ditemukan' });
    }
    res.json({ success: true, data: device });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST Create new device
exports.createDevice = async (req, res) => {
  try {
    const { serialNumber, parentSn, brandType, poNumber, doNumber, condition, status } = req.body;
    
    // Check SN duplicate
    const existing = await prisma.device.findUnique({ where: { serialNumber } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Serial Number sudah terdaftar!' });
    }

    const newDevice = await prisma.device.create({
      data: { serialNumber, parentSn, brandType, poNumber, doNumber, condition, status }
    });
    res.status(201).json({ success: true, data: newDevice });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT Update Device Condition/Status
exports.updateDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.device.update({
      where: { id: Number(id) },
      data: req.body
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};