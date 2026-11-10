import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../model/Usermodel.js';

const failedAttempts = new Map();
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getAttempts(ip, now = Date.now()) {
    const recent = (failedAttempts.get(ip) || [])
        .filter(timestamp => now - timestamp < ATTEMPT_WINDOW_MS);
    failedAttempts.set(ip, recent);
    return recent;
}

export async function createAdminSession(req, res) {
    const configuredCode = process.env.ADMIN_ACCESS_CODE;
    const jwtSecret = process.env.JWT_SECRET;
    if (!configuredCode || !jwtSecret) {
        return res.status(503).json({
            message: 'Admin access is not configured on the server.'
        });
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const attempts = getAttempts(ip);
    if (attempts.length >= MAX_ATTEMPTS) {
        return res.status(429).json({
            message: 'Too many unsuccessful attempts. Try again in 15 minutes.'
        });
    }

    const authorization = req.get('Authorization') || '';
    const [scheme, userToken] = authorization.split(' ');
    let userClaims;
    try {
        if (scheme !== 'Bearer' || !userToken) throw new Error('Missing user token');
        userClaims = jwt.verify(userToken, jwtSecret);
    } catch {
        return res.status(401).json({ message: 'Sign in before unlocking account administration.' });
    }
    if (userClaims.role !== 'user' || !mongoose.isValidObjectId(userClaims.id)) {
        return res.status(403).json({ message: 'A customer account session is required.' });
    }

    const submittedCode = req.body?.code;
    const submittedBuffer = Buffer.from(
        typeof submittedCode === 'string' ? submittedCode : ''
    );
    const expectedBuffer = Buffer.from(configuredCode);
    const valid = submittedBuffer.length === expectedBuffer.length
        && crypto.timingSafeEqual(submittedBuffer, expectedBuffer);

    if (!valid) {
        attempts.push(Date.now());
        failedAttempts.set(ip, attempts);
        return res.status(401).json({ message: 'Invalid admin access code.' });
    }

    const user = await User.findById(userClaims.id).select('_id status');
    if (!user || user.status !== 'active') {
        return res.status(403).json({ message: 'This customer account is not active.' });
    }

    failedAttempts.delete(ip);
    const token = jwt.sign(
        { role: 'account-admin', purpose: 'admin-panel', id: String(user._id) },
        jwtSecret,
        { expiresIn: '1h' }
    );
    return res.json({ token, expiresIn: 3600 });
}

export async function requireAdmin(req, res, next) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        return res.status(503).json({
            message: 'Admin authorization is not configured on the server.'
        });
    }

    const authorization = req.get('Authorization') || '';
    const [scheme, token] = authorization.split(' ');
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Admin authorization is required.' });
    }

    try {
        const claims = jwt.verify(token, jwtSecret);
        if (claims.role !== 'account-admin' || claims.purpose !== 'admin-panel'
            || !mongoose.isValidObjectId(claims.id)) {
            return res.status(403).json({ message: 'Account administrator access is required.' });
        }
        const user = await User.findById(claims.id).select(
            '_id username firstName lastName email status'
        );
        if (!user || user.status !== 'active') {
            return res.status(403).json({ message: 'This customer account is not active.' });
        }
        req.user = user;
        req.admin = { role: claims.role, userId: String(user._id) };
        return next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Admin session is invalid or expired.' });
        }
        console.error('Failed to validate account administrator session:', error);
        return res.status(500).json({ message: 'Unable to validate the admin session.' });
    }
}
