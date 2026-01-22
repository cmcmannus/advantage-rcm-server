import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    if (req.path.includes('/api/auth/')) return next(); // Skip authentication for auth routes

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send('Access token is missing');
    if (token === 'null') return res.status(401).send('Access token is null');
    if (token === 'undefined') return res.status(401).send('Access token is undefined');
    if (token === '') return res.status(401).send('Access token is empty');

    jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
        if (err) return res.status(403).send('Invalid access token');
        (req as any).user = user;
        next();
    });
};