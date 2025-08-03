const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const auth = require('../middlewares/auth.middleware.js');
const { successResponse, errorResponse } = require('../utils/response.js');

router.use(auth);

// Get All Invoices
router.get('/', async ( req, res ) => {
    try {
        const items = await prisma.invoice.findMany();
        if (items.length === 0) {
            return successResponse(res, `User haven't checkout yet`, items);
        }

        return successResponse(res, 'Get all invoice', items);
    } catch (err) {
        return errorResponse(res, "Failed to get all invoice", { error: err.message });
    }
});

// Get Invoice By Id
router.get('/:id', async ( req, res ) => {
    const { id } = req.params;

    try {
        const items = await prisma.invoice.findUnique({ where: { id } });
        if (!items) {
            return errorResponse(res, 'Id not found', items, 404);
        }

        return successResponse(res, 'Get invoice by id', items);
    } catch (err) {
        return errorResponse(res, "Failed to get invoice by id", { error: err.message });
    }
});

// Get Invoice By Email
router.get('/email/:email', async ( req, res ) => {
    const { email } = req.params;

    try {
        const items = await prisma.invoice.findMany({ where: { email } });
        if (!items) {
            return errorResponse(res, 'Email not found', items, 404);
        }

        return successResponse(res, 'Get invoice by email', items);
    } catch (err) {
        return errorResponse(res, "Failed to get invoice by email", { error: err.message });
    }
});

module.exports = router;