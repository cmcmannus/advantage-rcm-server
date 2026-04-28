import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface AuthenticatedUser {
    id: number;
    email: string;
    accessLevel: number;
    salesRep: number;
    active: number;
}

export interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
}

export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.path.includes('/api/auth/')) return next();

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).send('Access token is missing');

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).send('Access token is missing');

    jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
        if (err) return res.status(403).send('Invalid access token');
        req.user = user as AuthenticatedUser;
        next();
    });
};