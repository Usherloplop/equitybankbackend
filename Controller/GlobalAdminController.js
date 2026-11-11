import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import GlobalAdmin from '../model/GlobalAdmin.js';
import User from '../model/Usermodel.js';
import AdminProfile from '../model/AdminProfile.js';
import Balance from '../model/Addadminbalance.js';
import Transaction from '../model/Transactionmodel.js';
import AppSettings from '../model/AppSettings.js';
import AdminAudit from '../model/AdminAudit.js';
import { NEW_USER_ACCOUNTS, SUPPORTED_CURRENCIES } from '../Utils/adminConfig.js';

const failedAdminAttempts = new Map();
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const MAX_AUTH_ATTEMPTS = 5;

function recordFailedAttempt(ip) {
    const now = Date.now();
    const recent = (failedAdminAttempts.get(ip) || [])
        .filter(timestamp => now - timestamp < AUTH_WINDOW_MS);
    recent.push(now);
    failedAdminAttempts.set(ip, recent);
    return recent.length;
}

function failedAttemptCount(ip) {
    const now = Date.now();
    const recent = (failedAdminAttempts.get(ip) || [])
        .filter(timestamp => now - timestamp < AUTH_WINDOW_MS);
    failedAdminAttempts.set(ip, recent);
    return recent.length;
}

function validateText(value, label, maximum) {
    if (typeof value !== 'string') return `${label} is required.`;
    const text = value.trim();
    return !text || text.length > maximum || /[\u0000-\u001f\u007f]/.test(text)
        ? `${label} must contain between 1 and ${maximum} valid characters.`
        : '';
}

function userSummary(user) {
    return {
        id: String(user._id),
        username: user.username,
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        deletedAt: user.deletedAt || null
    };
}

async function writeAudit(req, action, targetUserId = null, details = {}) {
    await AdminAudit.create({
        actorId: req.globalAdmin.id,
        action,
        targetUserId,
        details,
        requestIp: req.ip || ''
    });
}

export async function createGlobalAdminSession(req, res) {
    const configuredEmail = process.env.GLOBAL_ADMIN_EMAIL?.trim().toLowerCase();
    const configuredPassword = process.env.GLOBAL_ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;
    if (!configuredEmail || !configuredPassword || !jwtSecret) {
        return res.status(503).json({
            message: 'Global administrator credentials are not configured on the server.'
        });
    }

    const submittedEmail = typeof req.body?.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : '';
    const submittedPassword = req.body?.password;
    if (!submittedEmail || typeof submittedPassword !== 'string') {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (failedAttemptCount(ip) >= MAX_AUTH_ATTEMPTS) {
        return res.status(429).json({
            message: 'Too many unsuccessful attempts. Try again in 15 minutes.'
        });
    }

    try {
        let admin = await GlobalAdmin.findOne({ email: configuredEmail });
        if (!admin) {
            admin = new GlobalAdmin({ email: configuredEmail });
            await admin.setPassword(configuredPassword);
            try {
                await admin.save();
            } catch (error) {
                if (error.code !== 11000) throw error;
                admin = await GlobalAdmin.findOne({ email: configuredEmail });
            }
        }

        if (!admin || admin.email !== submittedEmail || !admin.isActive
            || !(await admin.matchPassword(submittedPassword))) {
            recordFailedAttempt(ip);
            return res.status(401).json({ message: 'Invalid administrator credentials.' });
        }

        failedAdminAttempts.delete(ip);
        admin.lastLoginAt = new Date();
        await admin.save();
        const token = jwt.sign(
            { id: String(admin._id), role: 'global-admin' },
            jwtSecret,
            { expiresIn: '1h' }
        );
        return res.json({ token, expiresIn: 3600 });
    } catch (error) {
        console.error('Failed to authenticate global administrator:', error);
        return res.status(500).json({ message: 'Unable to sign in as global administrator.' });
    }
}

export async function listUsers(req, res) {
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const status = typeof req.query.status === 'string' ? req.query.status : '';
    const page = Number.parseInt(req.query.page, 10) || 1;
    const pageSize = 100;
    if (page < 1 || page > 100000) {
        return res.status(400).json({ message: 'Choose a valid user-list page.' });
    }
    if (status && !['active', 'suspended', 'disabled', 'archived'].includes(status)) {
        return res.status(400).json({ message: 'Choose a valid user status filter.' });
    }
    const query = {};
    if (status) query.status = status;
    if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const match = new RegExp(escaped, 'i');
        query.$or = [
            { username: match },
            { email: match },
            { firstName: match },
            { lastName: match }
        ];
    }

    try {
        const [users, total] = await Promise.all([
            User.find(query)
                .select('_id username email firstName lastName status createdAt updatedAt deletedAt')
                .sort({ createdAt: -1, _id: -1 })
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .lean(),
            User.countDocuments(query)
        ]);
        return res.json({
            users: users.map(userSummary),
            total,
            page,
            pageSize,
            pages: Math.ceil(total / pageSize)
        });
    } catch (error) {
        console.error('Failed to list managed users:', error);
        return res.status(500).json({ message: 'Unable to load user accounts.' });
    }
}

export async function getManagedUser(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid user identifier.' });
    }
    try {
        const [user, profile, balance, transactionCount] = await Promise.all([
            User.findById(req.params.id)
                .select('_id username email firstName lastName status createdAt updatedAt deletedAt')
                .lean(),
            AdminProfile.findOne({ userId: req.params.id }).lean(),
            Balance.findOne({ userId: req.params.id }).select('amount').lean(),
            Transaction.countDocuments({ userId: req.params.id, deletedAt: null })
        ]);
        if (!user) return res.status(404).json({ message: 'User account not found.' });
        return res.json({
            user: userSummary(user),
            profile: profile ? {
                firstName: profile.firstName,
                lastName: profile.lastName,
                currency: profile.currency,
                currencyInfo: SUPPORTED_CURRENCIES[profile.currency],
                accounts: profile.accounts.map(account => ({
                    type: account.type,
                    accountNumber: account.accountNumber,
                    balance: account.balance,
                    isActive: account.isActive
                }))
            } : null,
            availableBalance: balance?.amount ?? null,
            activeTransactionCount: transactionCount
        });
    } catch (error) {
        console.error('Failed to load managed user:', error);
        return res.status(500).json({ message: 'Unable to load user account details.' });
    }
}

export async function createManagedUser(req, res) {
    const usernameError = validateText(req.body?.username, 'Username', 120);
    const firstNameError = validateText(req.body?.firstName, 'First name', 60);
    const lastNameError = validateText(req.body?.lastName, 'Last name', 60);
    const password = req.body?.password;
    if (usernameError || firstNameError || lastNameError) {
        return res.status(400).json({
            message: usernameError || firstNameError || lastNameError
        });
    }
    if (typeof password !== 'string' || password.length < 10 || password.length > 200) {
        return res.status(400).json({ message: 'Password must be between 10 and 200 characters.' });
    }
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) {
        return res.status(400).json({ message: 'Enter a valid email address.' });
    }

    let createdUser;
    try {
        const user = await User.create({
            username: req.body.username.trim(),
            email: email || undefined,
            password,
            firstName: req.body.firstName.trim(),
            lastName: req.body.lastName.trim(),
            status: 'active'
        });
        createdUser = user;
        await AdminProfile.create({
            key: `user-${user._id}`,
            userId: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            currency: 'USD',
            accounts: NEW_USER_ACCOUNTS
        });
        await Balance.create({ userId: user._id, amount: 0 });
        await writeAudit(req, 'user.created', user._id, {
            username: user.username,
            email: user.email || ''
        });
        return res.status(201).json(userSummary(user));
    } catch (error) {
        if (createdUser) {
            try {
                await Promise.all([
                    AdminProfile.deleteOne({ userId: createdUser._id }),
                    Balance.deleteOne({ userId: createdUser._id }),
                    User.deleteOne({ _id: createdUser._id })
                ]);
            } catch (cleanupError) {
                console.error('Failed to clean up incomplete user creation:', cleanupError);
            }
        }
        if (error.code === 11000 && !createdUser) {
            return res.status(409).json({ message: 'That username or email is already in use.' });
        }
        console.error('Failed to create managed user:', error);
        return res.status(500).json({ message: 'Unable to create the user account.' });
    }
}

export async function updateManagedUser(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid user identifier.' });
    }
    const allowed = ['username', 'email', 'firstName', 'lastName', 'status', 'password'];
    const updates = req.body;
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)
        || Object.keys(updates).some(key => !allowed.includes(key))) {
        return res.status(400).json({ message: 'Only profile, status, and password fields may be updated.' });
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User account not found.' });
        if (user.status === 'archived') {
            return res.status(409).json({ message: 'Archived accounts cannot be changed.' });
        }

        for (const field of ['username', 'firstName', 'lastName']) {
            if (updates[field] !== undefined) {
                const maximum = field === 'username' ? 120 : 60;
                const validationError = validateText(updates[field], field, maximum);
                if (validationError) return res.status(400).json({ message: validationError });
                user[field] = updates[field].trim();
            }
        }
        if (updates.email !== undefined) {
            if (typeof updates.email !== 'string') {
                return res.status(400).json({ message: 'Email must be text.' });
            }
            const email = updates.email.trim().toLowerCase();
            if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) {
                return res.status(400).json({ message: 'Enter a valid email address.' });
            }
            user.email = email || undefined;
        }
        if (updates.status !== undefined) {
            if (!['active', 'suspended', 'disabled'].includes(updates.status)) {
                return res.status(400).json({ message: 'Choose active, suspended, or disabled status.' });
            }
            user.status = updates.status;
        }
        if (updates.password !== undefined) {
            if (typeof updates.password !== 'string'
                || updates.password.length < 10 || updates.password.length > 200) {
                return res.status(400).json({ message: 'Password must be between 10 and 200 characters.' });
            }
            user.password = updates.password;
        }

        await user.save();
        if (updates.firstName !== undefined || updates.lastName !== undefined) {
            await AdminProfile.updateOne(
                { userId: user._id },
                { $set: { firstName: user.firstName, lastName: user.lastName } }
            );
        }
        await writeAudit(req, 'user.updated', user._id, {
            fields: Object.keys(updates).filter(field => field !== 'password')
        });
        return res.json(userSummary(user));
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'That username or email is already in use.' });
        }
        console.error('Failed to update managed user:', error);
        return res.status(500).json({ message: 'Unable to update the user account.' });
    }
}

export async function archiveManagedUser(req, res) {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid user identifier.' });
    }
    if (String(req.params.id) === req.globalAdmin.id) {
        return res.status(400).json({ message: 'The current administrator cannot archive this account.' });
    }
    try {
        const user = await User.findOneAndUpdate(
            { _id: req.params.id, status: { $ne: 'archived' } },
            { $set: { status: 'archived', deletedAt: new Date() } },
            { new: true }
        );
        if (!user) return res.status(404).json({ message: 'Active user account not found.' });
        await writeAudit(req, 'user.archived', user._id, {
            username: user.username,
            retention: 'Personal records retained and inaccessible pending retention policy.'
        });
        return res.json({ message: 'Account archived; associated records were retained.' });
    } catch (error) {
        console.error('Failed to archive managed user:', error);
        return res.status(500).json({ message: 'Unable to archive the user account.' });
    }
}

export async function getPublicBranding(req, res) {
    try {
        const settings = await AppSettings.findOneAndUpdate(
            { key: 'global' },
            { $setOnInsert: { key: 'global', applicationName: 'Crystaline International Group' } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        return res.json({ applicationName: settings.applicationName });
    } catch (error) {
        console.error('Failed to load application branding:', error);
        return res.status(500).json({ message: 'Unable to load application settings.' });
    }
}

export async function updateBranding(req, res) {
    const applicationName = req.body?.applicationName;
    const validationError = validateText(applicationName, 'Application name', 100);
    if (validationError) return res.status(400).json({ message: validationError });

    try {
        const settings = await AppSettings.findOneAndUpdate(
            { key: 'global' },
            { $set: { applicationName: applicationName.trim() } },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );
        await writeAudit(req, 'branding.updated', null, {
            applicationName: settings.applicationName
        });
        return res.json({ applicationName: settings.applicationName });
    } catch (error) {
        console.error('Failed to update application branding:', error);
        return res.status(500).json({ message: 'Unable to update application settings.' });
    }
}

export async function listAdminAudit(req, res) {
    try {
        const entries = await AdminAudit.find()
            .sort({ createdAt: -1 })
            .limit(500)
            .populate('targetUserId', 'username email')
            .lean();
        return res.json(entries);
    } catch (error) {
        console.error('Failed to load administrator audit log:', error);
        return res.status(500).json({ message: 'Unable to load the administrator audit log.' });
    }
}
