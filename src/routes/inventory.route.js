const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const auth = require('../middlewares/auth.middleware.js');
const { successResponse, errorResponse } = require('../utils/response.js');

router.use(auth);

// Get All Inventory
router.get('/', async ( req, res ) => {
    try {
        const items = await prisma.inventory.findMany();
        // Check is there any product
        if (items.length === 0) {
            return successResponse(res, 'No product yet', items)
        }
        return successResponse(res, 'Get all inventory', items);
    } catch (err) {
        return errorResponse(res, 'Failed to get all inventory', {error: err.message}, 500);
    }
});

// Get Inventory By Id
router.get('/:id', async ( req, res ) => {
    const { id } = req.params;

    try {
        const items = await prisma.inventory.findUnique({ where: { id } });
        // Check available id
        if (!items) {
            return errorResponse(res, 'Id not found', items, 404);
        }

        return successResponse(res, 'Get inventory by id', items);
    } catch (err) {
        return errorResponse(res, 'Failed to get inventory by id', {error: err.message}, 500);
    }
});

// Create Inventory
router.post('/', async ( req, res ) => {
    const { name, description } = req.body;

    try {
        // Check is there existed inventory
        const existedInventory = await prisma.inventory.findFirst({ where: { name: name } });
        if (existedInventory) {
            return errorResponse(res, `${name} already existed`, 400);
        }
        const items = await prisma.inventory.create({ data: {name, description }});

        return successResponse(res, 'Inventory created', items);
    } catch (err) {
        return errorResponse(res, 'Failed to create inventory', {error: err.message}, 500);
    }
});

// Update Inventory
router.put('/:id', async ( req, res ) => {
    const { id } = req.params;
    const { name, description } = req.body;

    try {
        // Check existed data inventory with id
        const existedId = await prisma.inventory.findUnique({ where: { id }});
        if (!existedId) {
            return errorResponse(res, 'Inventory not found', 404);
        }

        // Check is there existed inventory
        const existedInventory = await prisma.inventory.findFirst({ where: { name: name } });
        if (existedInventory) {
            return errorResponse(res, `${name} already existed`, 400);
        }

        // Update existed data inventory
        const items = await prisma.inventory.update({
            where: { id },
            data: { name, description }
        });
        return successResponse( res, 'Inventory updated', items)
    } catch (err) {
        return errorResponse(res, 'Failed to update inventory', { error: err.message }, 500);
    }
});

// Delete Inventory
router.delete('/:id', async ( req, res ) => {
    const { id } = req.params;

    try {
        // Check existed data inventory with id
        const existedId = await prisma.inventory.findUnique({ where: { id }});
        if (!existedId) {
            return errorResponse(res, 'Inventory not found', 404);
        }

        // Delete data inventory
        const items = await prisma.inventory.delete({ where: { id }});
        return successResponse(res, 'Inventory deleted', items);
    } catch (err) {
        return errorResponse(res, 'Failed to delete inventory', { error: err.message }, 500);
    }
});

module.exports = router;