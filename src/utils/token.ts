import crypto from 'crypto';

export function generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export function tokenExpiry(hours = 1): Date {
    return new Date(Date.now() + hours * 60 * 60 * 1000);
}
