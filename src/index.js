const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth.route.js'));
app.use('/api/inventory', require('./routes/inventory.route.js'));
app.use('/api/products', require('./routes/product.route.js'));
app.use('/api/carts', require('./routes/cart.route.js'));
app.use('/api/invoices', require('./routes/invoice.route.js'));
app.use('/api/statistics', require('./routes/statistic.route.js'));

app.get('/', (req, res, next) => {
    res.send("PosToko API is Running...");
});

// Check if there is any image
app.use('/uploads', (req, res, next) => {
    const filePath = path.join(__dirname, '..', 'uploads', req.path);
    
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({
            success: false,
            message: `Image not found: ${req.path}`
        });
    }
    next();
});

// Serve static file upload
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});