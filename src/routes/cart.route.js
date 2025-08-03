const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const auth = require('../middlewares/auth.middleware.js');
const { successResponse, errorResponse } = require('../utils/response.js');

router.use(auth);

// Add to cart
router.post('/', async ( req, res ) => {
    const { productId, quantity } = req.body;

    try {
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return errorResponse(res, "Product not found", product, 404)
        }

        const total = product.price * quantity;

        const cart = await prisma.cart.create({
            data:{
                productId,
                quantity,
                total,
                userId: req.user.userId // Ambil dari token
            }
        })

        return successResponse(res, "Add to cart", cart);
    } catch (err) {
        console.log(err);
        
        return errorResponse(res, "Failed to add cart", { error: err.message });
    }
});

// Get All Carts
router.get('/', async ( req, res ) => {
    try {
        const cart = await prisma.cart.findMany({
            where: { userId: req.user.userId },
            include: { product: true }
        });
        if (!cart) {
            return successResponse(res, "User haven't add cart yet", cart);
        }
        return successResponse(res, "Get all carts", cart);
    } catch (err) {
        return errorResponse(res, "Failed to get all carts", { error: err.message });
    }
});

router.post('/checkout', async ( req, res ) => {
    const { email, name, phone } = req.body;

    try {
        const checkout = await prisma.cart.findMany({
            where:{ userId: req.user.userId },
            include: { product: true }
        });
        if (checkout.length === 0) {
            return successResponse(res, "Cart is empty", checkout);
        }

        const items = checkout.map(c => `${c.product.name} = ${c.quantity}`).join(', ');
        const total = checkout.reduce((sum, item) => sum + item.total, 0);

        const invoice = await prisma.invoice.create({
            data: {
                email,
                name,
                phone,
                date: new Date(),
                items,
                total,
                userId: req.user.userId
            }
        });

        await prisma.cart.deleteMany({
            where: { userId: req.user.userId }
        });

        return successResponse(res, "Checkout successed", invoice);
    } catch (err) {
        return errorResponse(res, "Failed to checkout", {error: err.message})
    }
});

module.exports = router;