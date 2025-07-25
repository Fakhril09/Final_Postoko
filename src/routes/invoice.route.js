const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const auth = require('../middlewares/auth.middleware.js');
const { successResponse, errorResponse } = require('../utils/response.js');

router.use(auth);

// Get All Invoices
router.get('/', async ( req, res ) => {
    const items = await prisma.invoice.findMany();
    if (items.length === 0) {
        return successResponse(res, `User haven't checkout yet`, items);
    }

    return successResponse(res, 'Get all invoice', items);
});

// Get Invoice By Id
router.get('/:id', async ( req, res ) => {
    const { id } = req.params;
    const items = await prisma.invoice.findUnique({ where: { userId } });
    if (!items) {
        return errorResponse(res, 'Id not found', items, 404);
    } else if (items.length === 0) {
        return successResponse(res, `User with id: ${id} haven't checkout yet`, items);
    }

    return successResponse(res, 'Get invoice by id', items);
});

// Get Invoice By Email
router.get('/email/:email', async ( req, res ) => {
    const { email } = req.params;
    const items = await prisma.invoice.findMany({ where: { email } });
    if (!items) {
        return errorResponse(res, 'Invoice not found', items, 404);
    } else if (items.length === 0) {
        return errorResponse(res, `${email} haven't checkout yet`, items, 404);
    }

    return successResponse(res, 'Get invoice by email', items);
});

module.exports = router;