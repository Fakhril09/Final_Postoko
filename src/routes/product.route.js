const router = require('express').Router();
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const auth = require('../middlewares/auth.middleware.js');
const { successResponse, errorResponse } = require('../utils/response.js');
const upload = require('../utils/upload.js');

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const BASE_URL = process.env.BASE_URL || 'http://localhost:5025';

// Helper: Clean Image URL
const cleanImageUrl = ( base, imagePath ) => 
    base.replace(/\/$/, '') + '/' + imagePath.replace(/^\//, '');

// All Routes Below Reqiure Authhentication
router.use(auth);

// Get All Product
router.get('/', async ( req, res ) => {
    const products = await prisma.product.findMany();

    if (!products || products.length === 0) {
        return successResponse(res, 'No product yet', products);
    } 

    const base = `${req.protocol}://${req.get('host')}`;
    const productWithImageUrl = products.map(product => ({
        ...product,
        image: product.image ? cleanImageUrl( base, product.image ) : null
    }));

    return successResponse(res, 'Get all products', productWithImageUrl);
});

// Get Product By Id
router.get('/:id', async ( req, res) => {
    const { id } = req.params;
    const product = await prisma.product.findUnique({ where: { id }});

    if (!product) {
        return errorResponse(res, 'No product found', 404);
    }

    const base = `${req.protocol}://${req.get('host')}`;
    const productWithImageUrl = {
        ...product,
        image: product.image ? cleanImageUrl( base, product.image ) : null
    };

    return successResponse(res, 'Get product by id', productWithImageUrl);
});

// Create Product
router.post('/', upload.single('image'), async ( req, res ) => {
    const { name, price, description, stock, inventoryId} = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : null

    try {
        const inventory = await prisma.inventory.findUnique({ where: { id: inventoryId} });

        // Check is there any inventoryid
        if (!inventory) {
            return errorResponse(res, `Inventory with id ${inventoryId} not found`, 404);
        }

        // Check is there existed product
        const existedProduct = await prisma.product.findFirst({ where: { name } });
        if (existedProduct) {
            return errorResponse(res, `${name} already existed`, 400);
        }

        // Check is there any image
        if (!image) {
            return errorResponse(res, 'Product image is required', 400);
        }

        const product = await prisma.product.create({
            data: {
                name,
                image,
                price: parseInt(price),
                description,
                stock: parseInt(stock),
                inventoryId
            }
        });

        return successResponse(res, "Product created", {
            ...product,
            image: product.image ? cleanImageUrl( BASE_URL, product.image) : null
        });
    } catch (err) {
        return errorResponse( res, 'Failed to create product', { error: err.message}, 500);
    }
});

// Update Product
router.put('/:id', upload.single('image'), async ( req, res ) => {
    const { id } = req.params;
    const { name, price, description, stock, inventoryId } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : undefined;

    try {
        // Check is there any inventoryid
        const inventory = await prisma.inventory.findUnique({ where: { id: inventoryId } });
        if (!inventory) {
            return errorResponse(res, `Inventory with id ${inventoryId} not found`, inventory, 404);
        }

        // Check is there existed product
        const existedProduct = await prisma.product.findUnique({ where: { id } });
        if (!existedProduct) {
            return errorResponse(res, "inventory not found", 404);
        }

        // Check is there any image
        if (!image) {
            return errorResponse(res, 'Product image is required', 400);
        }

        // Check is there sama product
        const sameProduct = await prisma.product.findFirst({ where: { name } });
        if (sameProduct) {
            return errorResponse(res, `${name} already existed`, 400);
        }

        if (image && existedProduct.image) {
            const oldImagePath = path.join(__dirname, '..', '..', 'uploads', path.basename(existedProduct.image));
            fs.unlink(oldImagePath, (err) => {
                if (err) {
                    console.warn(`Failed to delete Old image: ${oldImagePath}`);
                } else {
                    console.log(`Old Image Deleted: ${oldImagePath}`);
                }
            });
        }

        const updateData = {
            name,
            price: parseInt(price),
            description,
            stock: parseInt(stock),
            inventoryId
        };
        if (image) updateData.image = image;

        const updateProduct = await prisma.product.update({
            where: { id },
            data: updateData
        });

        return successResponse( res, 'Product updated', {
            ...updateProduct,
            image: updateProduct.image ? cleanImageUrl( BASE_URL, updateProduct.image) : null
        });
    } catch (err) {
        return errorResponse( res, 'Failed to Update', { error: err.message }, 500);
    }
});

// Delete Product
router.delete('/:id', async ( req, res ) => {
    const { id } = req.params;

    try {
        const product = await prisma.product.findUnique({ where: { id } });
        if (!product) {
            return errorResponse(res, 'Product not found', 404);
        }

        if (product.image) {
            const imagePath = path.join(__dirname, '..', '..', 'uploads', path.basename(product.image));
            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.warn(`Failed to delete image: ${imagePath}`);
                } else {
                    console.log(`Image Deleted: ${imagePath}`);
                }
            });
        }

        const items = await prisma.Product.delete({ where: { id } });
        return successResponse(res, 'Product deleted', items);
    } catch (err) {
        return errorResponse(res, 'Delete failed', { error: err.message }, 500);
    }
});

module.exports = router;