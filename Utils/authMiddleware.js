import jwt from 'jsonwebtoken';
import User from '../model/Usermodel.js';
import AdminProfile from '../model/AdminProfile.js';
import Balance from '../model/Addadminbalance.js';
import AdminTransactionAudit from '../model/AdminTransactionAudit.js';
import Transaction from '../model/Transactionmodel.js';
import Softcode from '../model/softcodeModel.js';

async function claimConfiguredLegacyData(user) {
    const configuredOwner = process.env.LEGACY_DATA_OWNER_USERNAME?.trim().toLowerCase();
    if (!configuredOwner || configuredOwner !== user.username || user.legacyDataClaimedAt) {
        return;
    }

    const legacyProfile = await AdminProfile.findOne({ key: 'primary' }).select('_id userId');
    if (!legacyProfile || (legacyProfile.userId
        && String(legacyProfile.userId) !== String(user._id))) {
        return;
    }

    if (!legacyProfile.userId) {
        const claimed = await AdminProfile.updateOne(
            {
                _id: legacyProfile._id,
                $or: [{ userId: { $exists: false } }, { userId: null }]
            },
            { $set: { userId: user._id } }
        );
        if (!claimed.modifiedCount) {
            const refreshed = await AdminProfile.findById(legacyProfile._id).select('userId');
            if (String(refreshed?.userId || '') !== String(user._id)) return;
        }
    }

    const ownerFilter = { $or: [{ userId: { $exists: false } }, { userId: null }] };
    const ownerUpdate = { $set: { userId: user._id } };
    await Promise.all([
        Balance.updateMany(ownerFilter, ownerUpdate),
        AdminTransactionAudit.updateMany(ownerFilter, ownerUpdate),
        Transaction.updateMany(ownerFilter, ownerUpdate)
    ]);
    if (!await Softcode.exists({ userId: user._id })) {
        await Softcode.updateOne(ownerFilter, ownerUpdate);
    }
    user.legacyDataClaimedAt = new Date();
    await user.save();
}

export async function requireUser(req, res, next) {
    const authorization = req.get('Authorization') || '';
    const [scheme, token] = authorization.split(' ');
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(503).json({ message: 'User authentication is not configured.' });
    }
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Sign in is required.' });
    }

    try {
        const claims = jwt.verify(token, secret);
        if (claims.role !== 'user' || !claims.id) {
            return res.status(401).json({ message: 'User session is invalid.' });
        }
        const user = await User.findById(claims.id).select(
            '_id username email firstName lastName status legacyDataClaimedAt'
        );
        if (!user || user.status !== 'active') {
            return res.status(403).json({ message: 'This account is not active.' });
        }
        await claimConfiguredLegacyData(user);
        req.user = user;
        return next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'User session is invalid or expired.' });
        }
        console.error('Failed to validate user session:', error);
        return res.status(500).json({ message: 'Unable to validate the user session.' });
    }
}

export function requireGlobalAdmin(req, res, next) {
    const authorization = req.get('Authorization') || '';
    const [scheme, token] = authorization.split(' ');
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        return res.status(503).json({ message: 'Admin authorization is not configured.' });
    }
    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Global administrator authorization is required.' });
    }

    try {
        const claims = jwt.verify(token, secret);
        if (claims.role !== 'global-admin' || !claims.id) {
            return res.status(403).json({ message: 'Global administrator access is required.' });
        }
        req.globalAdmin = { id: claims.id };
        return next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Global administrator session is invalid or expired.' });
        }
        console.error('Failed to validate global administrator session:', error);
        return res.status(500).json({ message: 'Unable to validate the administrator session.' });
    }
}
