import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../utils/db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        const user = rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '15m' });
        const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        res.json({ accessToken });

    } catch (err) {
        res.status(500).json({ message: 'Login error' });
    }
});

router.post('/refresh-token', (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!, (err: any, user: any) => {
        if (err) return res.sendStatus(403);

        const newAccessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: '15m' });
        res.json({ accessToken: newAccessToken });
    });
});

router.post('/logout', (req, res) => {
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
    });
    res.sendStatus(200);
});

router.get('/', authenticateToken, async (req, res) => {
    res.json({ message: `Hello ${(req as any).user.email}, welcome to your authenticated route!` });
});

export default router;