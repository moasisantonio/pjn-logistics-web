const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * GET /api/dashboard/stats
 * Mengambil ringkasan statistik stok, status perangkat, dan performa teknisi
 */
const getDashboardStats = async (req, res) => {
  try {
    // 1. Hitung Status Perangkat
    const [totalDevices, statusCounts, conditionCounts] = await Promise.all([
      prisma.device.count(),
      prisma.device.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      prisma.device.groupBy({
        by: ['condition'],
        _count: { condition: true }
      })
    ]);

    // Format objek status counts
    const statusMap = {
      IN_STOCK: 0,
      DEPLOYED: 0,
      RETURNED: 0,
      SCRAP: 0
    };
    statusCounts.forEach((item) => {
      statusMap[item.status] = item._count.status;
    });

    // Format objek condition counts
    const conditionMap = {
      NEW: 0,
      SECOND: 0,
      DAMAGED: 0
    };
    conditionCounts.forEach((item) => {
      conditionMap[item.condition] = item._count.condition;
    });

    // 2. Top 5 Teknisi Lapangan (Pekerjaan Terbanyak)
    const topFieldTechs = await prisma.workOrder.groupBy({
      by: ['fieldTech'],
      _count: { id: true },
      where: { fieldTech: { not: null } },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    // 3. Top 5 Distribusi Wilayah (Area Performance)
    const areaDistribution = await prisma.workOrder.groupBy({
      by: ['areaName'],
      _count: { id: true },
      where: { areaName: { not: null } },
      orderBy: { _count: { id: 'desc' } },
      take: 5
    });

    // 4. Total Transaksi Pekerjaan Teknisi
    const totalWorkOrders = await prisma.workOrder.count();

    // Response JSON
    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalDevices,
          inStock: statusMap.IN_STOCK,
          deployed: statusMap.DEPLOYED,
          returned: statusMap.RETURNED,
          scrap: statusMap.SCRAP,
          totalWorkOrders
        },
        conditions: {
          new: conditionMap.NEW,
          second: conditionMap.SECOND,
          damaged: conditionMap.DAMAGED
        },
        topTechnicians: topFieldTechs.map((item) => ({
          name: item.fieldTech || 'Tidak Teridentifikasi',
          totalJobs: item._count.id
        })),
        areaStats: areaDistribution.map((item) => ({
          area: item.areaName || 'Lainnya',
          totalOrders: item._count.id
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Gagal mengambil statistik dashboard'
    });
  }
};

module.exports = {
  getDashboardStats
};