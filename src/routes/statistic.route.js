const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const auth = require('../middlewares/auth.middleware.js');
const { successResponse, errorResponse } = require('../utils/response.js');

router.use(auth);

// Statistik Range
router.get('/range', async ( req, res ) => {
    const { start, end } = req.query;

    try {
        const data = await prisma.invoice.findMany({
            where: {
                date: {
                    gte: new Date(start),
                    lt: new Date(end)
                }
            }
        })
        
        const totalPesanan = data.reduce((sum, inv) => sum + 1, 0);
        const totalTerbayar = data.reduce((sum, inv) => sum + inv.total, 0);

        return successResponse(res, "Get statistic with range", { totalPesanan, totalTerbayar })
    } catch (err) {
        return errorResponse(res, "Failed to get single statistic", {error: err.message});
    }
});

// Statistik Single
router.get('/single', async ( req, res ) => {
    const { date } = req.query;

    try {
        const target = new Date(date);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const data = await prisma.invoice.findMany({
            where: {
                date: {
                    gte: target,
                    lt: nextDay
                }
            }
        })

        const totalPesanan = data.length;
        const totalTerbayar = data.reduce((sum, inv) => sum + inv.total, 0);

        return successResponse(res, "Get statistic with single", { totalPesanan, totalTerbayar })
    } catch (err) {
        return errorResponse(res, "Failed to get single statistic", {error: err.message});
    }
});

module.exports = router;