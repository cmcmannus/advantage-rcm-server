import express from 'express';
import jwt from 'jsonwebtoken';
import { loginUser } from '../services/users';

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await loginUser({ email, password });

        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const accessToken = jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: '1h' });
        const refreshToken = jwt.sign(user, process.env.JWT_REFRESH_SECRET!, { expiresIn: '30d' });

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

        const newAccessToken = jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: '15m' });
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

export default router;