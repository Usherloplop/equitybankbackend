import jwt from 'jsonwebtoken';
import User from '../model/Usermodel.js';

function generateToken(userId) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured.');
    return jwt.sign({ id: String(userId), role: 'user' }, secret, { expiresIn: '30d' });
}

function publicUser(user) {
    return {
        _id: String(user._id),
        username: user.username,
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        status: user.status
    };
}

function cleanRequiredText(value, label, maximum = 120) {
    if (typeof value !== 'string') return `${label} is required.`;
    const cleaned = value.trim();
    if (!cleaned || cleaned.length > maximum || /[\u0000-\u001f\u007f]/.test(cleaned)) {
        return `${label} must contain between 1 and ${maximum} valid characters.`;
    }
    return '';
}

export async function loginUser(req, res) {
    if (!process.env.JWT_SECRET) {
        return res.status(503).json({ message: 'User authentication is not configured.' });
    }
    const login = typeof req.body?.username === 'string'
        ? req.body.username.trim().toLowerCase()
        : '';
    const password = req.body?.password;
    if (!login || typeof password !== 'string') {
        return res.status(400).json({ message: 'Username/email and password are required.' });
    }

    try {
        const escaped = login.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const user = await User.findOne({
            $or: [
                { username: new RegExp(`^${escaped}$`, 'i') },
                { email: new RegExp(`^${escaped}$`, 'i') }
            ]
        });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid username/email or password.' });
        }
        if (user.status !== 'active') {
            return res.status(403).json({ message: 'This account is currently unavailable. Contact the administrator.' });
        }
        return res.json({ ...publicUser(user), token: generateToken(user._id) });
    } catch (error) {
        console.error('Failed to authenticate user:', error);
        return res.status(500).json({ message: 'Unable to sign in.' });
    }
}

export async function registerUser(req, res) {
    if (!process.env.JWT_SECRET) {
        return res.status(503).json({ message: 'User authentication is not configured.' });
    }
    const usernameError = cleanRequiredText(req.body?.username, 'Username');
    const password = req.body?.password;
    if (usernameError) return res.status(400).json({ message: usernameError });
    if (typeof password !== 'string' || password.length < 10 || password.length > 200) {
        return res.status(400).json({ message: 'Password must be between 10 and 200 characters.' });
    }

    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (email && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)) {
        return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    const firstName = typeof req.body.firstName === 'string' ? req.body.firstName.trim() : '';
    const lastName = typeof req.body.lastName === 'string' ? req.body.lastName.trim() : '';
    for (const [value, label] of [[firstName, 'First name'], [lastName, 'Last name']]) {
        if (value.length > 60 || /[\u0000-\u001f\u007f]/.test(value)) {
            return res.status(400).json({ message: `${label} is invalid.` });
        }
    }

    try {
        const user = await User.create({
            username: req.body.username.trim(),
            email: email || undefined,
            password,
            firstName,
            lastName
        });
        return res.status(201).json({ ...publicUser(user), token: generateToken(user._id) });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'That username or email is already in use.' });
        }
        console.error('Failed to register user:', error);
        return res.status(500).json({ message: 'Unable to create the account.' });
    }
}

export async function getCurrentUser(req, res) {
    return res.json(publicUser(req.user));
}
