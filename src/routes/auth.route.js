const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const { successResponse, errorResponse } = require('../utils/response.js');
const cookieOptions = require('../utils/cookieOptions.js');

router.post('/register', async ( req, res ) => {
    const { email, password } = req.body;

    try {
        // Check existed email
        const existedEmail = await prisma.user.findUnique({ where: { email }});

        if (existedEmail) {
            return errorResponse(res, 'Email is already existed', null, 400);
        }

        // Hash password & create user
        const hashed = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: { email, password: hashed }
        });

        // Send response success
        return successResponse(res, 'Register successful', {
            id: user.id,
            email: user.email
        });
    } catch (err) {
        console.error('Register Error:', err);
        return errorResponse(res, 'Failed to registration', { error: err.message }, 500);
    }
});

router.post('/login', async ( req, res ) => {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !await bcrypt.compare(password, user.password)) {
        return errorResponse(res, 'Invalid Credentials', null, 401);
    }

    const token = jwt.sign({ userId: user.id}, process.env.JWT_SECRET, { expiresIn: '1d'});

    res.cookie('token', token, cookieOptions(req));
    return successResponse(res, 'Login Successful', { userid: user.id, email: email, token: token})
});

router.post('/logout', ( req, res ) => {
    res.clearCookie('token', {
        ...cookieOptions(req),
        maxAge: undefined
    });

    return successResponse(res, 'Logout successful');
});

module.exports = router;

