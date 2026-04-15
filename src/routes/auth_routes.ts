import express from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { getUsers, loginUser, resetPassword, setResetToken, validateResetToken } from '../services/users.js';
import { generateResetToken, tokenExpiry } from '../utils/token.js';
import { Emailer } from '../services/email.js';

const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await loginUser({ email, password });

        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const accessToken = jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: '15m' });
        const refreshToken = jwt.sign(user, process.env.JWT_REFRESH_SECRET!, { expiresIn: '30d' });

        res.json({ accessToken, user, refreshToken });

    } catch (err) {
        res.status(500).json({ message: 'Login error' });
    }
});

router.post('/refresh-token', (req, res) => {
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    try {
        const user = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as JwtPayload;

        delete user.exp;
        delete user.iat;

        const newAccessToken = jwt.sign(user, process.env.JWT_SECRET!, { expiresIn: '1h' });
        const newRefreshToken = jwt.sign(user, process.env.JWT_REFRESH_SECRET!, { expiresIn: '30d' });
        res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (ex) {
        return res.status(401).send({ message: 'Invalid refresh token' });
    }
});

// Get Password Reset Token
router.post('/get-password-reset-token', async (req, res) => {
    const { email } = req.body;

    const token = generateResetToken();
    const expiry = tokenExpiry(0.25); // 15m expiry

    const user = await getUsers({ email });
    if (!user || user.length === 0) return res.status(500).json({ message: 'Error setting reset token' });

    try {
        await setResetToken(user[0].id, token, expiry);

        const mailer = new Emailer();
        await mailer.sendPasswordResetEmail(email, token);

        res.json({ message: 'Password reset token set and sent', token });
    } catch (err) {
        res.status(500).json({ message: 'Error setting reset token' });
    }
});

// Reset Password
router.post('/validate-reset-token', async (req, res) => {
    const { token } = req.body;

    if (!token) return res.status(404);

    const isValid = await validateResetToken(token);

    return res.status(200).json({
        isValid
    });
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) return res.status(400).json({
        message: 'Token and new password required'
    });

    const isValid = await validateResetToken(token);

    if (!isValid) return res.status(401).json({
        message: 'Invalid Password Reset Token'
    });

    const response = await resetPassword({
        token,
        newPassword: password
    });

    let message, code, email;
    if (response)
        message = 'Password reset success!', code = 200, email = response;
    else
        message = 'Password reset unsuccessful', code = 500;

    return res.status(200).json({
        message,
        code,
        email
    });
});

router.post('/verify-reset-token', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Token required' });

    try {
        const verified = await validateResetToken(token);
        res.sendStatus(200).json({ verified });
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

router.post('/logout', (req, res) => {
    res.sendStatus(200);
});

export default router;