import mongoose from 'mongoose';
import AdminProfile from '../model/AdminProfile.js';
import AdminTransactionAudit from '../model/AdminTransactionAudit.js';
import Balance from '../model/Addadminbalance.js';
import Transaction from '../model/Transactionmodel.js';
import User from '../model/Usermodel.js';
import {
    ACCOUNT_TYPES,
    NEW_USER_ACCOUNTS,
    SUPPORTED_CURRENCIES,
    maskAccountNumber,
    validateTransactionInput
} from '../Utils/adminConfig.js';

export async function ensureAdminProfile(user) {
    const userId = user?._id;
    if (!userId) throw new Error('Authenticated user is required for account data.');
    const profile = await AdminProfile.findOneAndUpdate(
        { userId },
        {
            $setOnInsert: {
                key: `user-${userId}`,
                userId,
                firstName: user.firstName || user.username || '',
                lastName: user.lastName || '',
                accounts: NEW_USER_ACCOUNTS
            }
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return profile;
}

function publicAccount(account, currency) {
    return {
        id: String(account._id),
        type: account.type,
        accountNumber: maskAccountNumber(account.accountNumber),
        balance: Number(account.balance || 0),
        currency,
        isActive: Boolean(account.isActive)
    };
}

function accountLabel(profile, accountId) {
    if (!accountId) return 'Unassigned';
    const account = profile.accounts.find(
        item => String(item._id) === String(accountId)
    );
    if (!account) return 'Account unavailable';
    const masked = maskAccountNumber(account.accountNumber);
    return masked ? `${account.type} (${masked})` : account.type;
}

function publicTransaction(transaction, source, profile) {
    const item = transaction.toObject ? transaction.toObject() : transaction;
    return {
        _id: String(item._id || item.id),
        date: item.date || item.createdAt,
        description: item.description || (
            item.recipientName ? `Transfer request to ${item.recipientName}` : 'Transfer'
        ),
        amount: Number(item.amount || 0),
        balance: item.balance ?? null,
        status: item.status || 'Processing',
        accountId: item.accountId || '',
        account: accountLabel(profile, item.accountId),
        source,
        isSimulated: item.isSimulated !== false
    };
}

async function getTransactions(user) {
    const userId = user?._id;
    if (!userId) throw new Error('Authenticated user is required for transaction data.');
    const [profile, storedTransactions] = await Promise.all([
        ensureAdminProfile(user),
        Transaction.find({ userId, deletedAt: null }).sort({ date: -1, createdAt: -1, _id: -1 })
    ]);

    const transactions = storedTransactions.map(item => publicTransaction(
        item,
        item.source || (item.recipientName ? 'transfer' : 'admin'),
        profile
    ));
    transactions.sort((left, right) => (
        new Date(right.date).getTime() - new Date(left.date).getTime()
    ));
    return { profile, transactions };
}

function validateProfileName(value, label) {
    if (typeof value !== 'string') return `${label} is required.`;
    const name = value.trim();
    if (!name || name.length > 60 || /[\u0000-\u001f\u007f]/.test(name)) {
        return `${label} must contain between 1 and 60 valid characters.`;
    }
    return '';
}

export async function getPublicProfile(req, res) {
    try {
        const profile = await ensureAdminProfile(req.user);
        return res.json({
            firstName: profile.firstName,
            lastName: profile.lastName,
            currency: profile.currency,
            accounts: profile.accounts
                .filter(account => account.isActive)
                .map(account => publicAccount(account, profile.currency))
        });
    } catch (error) {
        console.error('Failed to fetch public profile:', error);
        return res.status(500).json({ message: 'Unable to load the customer profile.' });
    }
}

export async function getAdminProfile(req, res) {
    try {
        const profile = await ensureAdminProfile(req.user);
        return res.json(profile);
    } catch (error) {
        console.error('Failed to fetch admin profile:', error);
        return res.status(500).json({ message: 'Unable to load the admin profile.' });
    }
}

export async function updateAdminProfile(req, res) {
    try {
        const firstNameError = validateProfileName(req.body?.firstName, 'First name');
        const lastNameError = validateProfileName(req.body?.lastName, 'Last name');
        if (firstNameError || lastNameError) {
            return res.status(400).json({
                message: firstNameError || lastNameError
            });
        }

        const profile = await ensureAdminProfile(req.user);
        profile.firstName = req.body.firstName.trim();
        profile.lastName = req.body.lastName.trim();
        await profile.save();
        await User.updateOne(
            { _id: req.user._id },
            { $set: { firstName: profile.firstName, lastName: profile.lastName } }
        );
        return res.json({
            firstName: profile.firstName,
            lastName: profile.lastName,
            currency: profile.currency
        });
    } catch (error) {
        console.error('Failed to update admin profile:', error);
        return res.status(500).json({ message: 'Unable to save the customer profile.' });
    }
}

export async function updateCurrency(req, res) {
    const currency = req.body?.currency;
    if (typeof currency !== 'string' || !Object.hasOwn(SUPPORTED_CURRENCIES, currency)) {
        return res.status(400).json({ message: 'Select a supported currency.' });
    }

    try {
        const profile = await ensureAdminProfile(req.user);
        profile.currency = currency;
        await profile.save();
        return res.json({ currency: profile.currency });
    } catch (error) {
        console.error('Failed to update profile currency:', error);
        return res.status(500).json({ message: 'Unable to save the profile currency.' });
    }
}

export async function updateAccounts(req, res) {
    const accounts = req.body?.accounts;
    if (!Array.isArray(accounts) || accounts.length !== ACCOUNT_TYPES.length) {
        return res.status(400).json({
            message: 'Provide configuration for all four account types.'
        });
    }

    const submittedTypes = new Set();
    for (const account of accounts) {
        if (!account || !ACCOUNT_TYPES.includes(account.type) || submittedTypes.has(account.type)) {
            return res.status(400).json({ message: 'Account types must be unique and supported.' });
        }
        submittedTypes.add(account.type);
        if (typeof account.isActive !== 'boolean') {
            return res.status(400).json({ message: `Choose whether ${account.type} is enabled.` });
        }
        if (typeof account.accountNumber !== 'string'
            || account.accountNumber.length > 40
            || /[\u0000-\u001f\u007f]/.test(account.accountNumber)) {
            return res.status(400).json({ message: `Enter a valid ${account.type} account number.` });
        }
        if ((typeof account.balance !== 'number' && typeof account.balance !== 'string')
            || account.balance === '') {
            return res.status(400).json({ message: `Enter a valid ${account.type} balance.` });
        }
        const balance = Number(account.balance);
        if (!Number.isFinite(balance) || Math.abs(balance) > 1e12) {
            return res.status(400).json({ message: `Enter a valid ${account.type} balance.` });
        }
    }

    try {
        const profile = await ensureAdminProfile(req.user);
        for (const item of accounts) {
            let account = profile.accounts.find(existing => existing.type === item.type);
            if (!account) {
                profile.accounts.push({ type: item.type });
                account = profile.accounts[profile.accounts.length - 1];
            }
            account.accountNumber = item.accountNumber.trim();
            account.balance = Number(item.balance);
            account.isActive = item.isActive;
        }
        await profile.save();
        return res.json({
            accounts: profile.accounts.map(account => publicAccount(account, profile.currency))
        });
    } catch (error) {
        console.error('Failed to update accounts:', error);
        return res.status(500).json({ message: 'Unable to save account settings.' });
    }
}

export async function getPublicBalance(req, res) {
    try {
        const balance = await Balance.findOne({ userId: req.user._id });
        return res.json({ amount: balance ? balance.amount : 0 });
    } catch (error) {
        console.error('Failed to fetch available balance:', error);
        return res.status(500).json({ message: 'Unable to load the available balance.' });
    }
}

export async function getPublicTransactions(req, res) {
    try {
        const { transactions } = await getTransactions(req.user);
        return res.json(transactions);
    } catch (error) {
        console.error('Failed to fetch active transactions:', error);
        return res.status(500).json({ message: 'Unable to load transactions.' });
    }
}

export async function getAdminTransactions(req, res) {
    try {
        const { transactions } = await getTransactions(req.user);
        return res.json(transactions);
    } catch (error) {
        console.error('Failed to fetch admin transactions:', error);
        return res.status(500).json({ message: 'Unable to load transactions.' });
    }
}

async function validatedTransaction(req, profile) {
    const activeAccountIds = new Set(
        profile.accounts
            .filter(account => account.isActive)
            .map(account => String(account._id))
    );
    return validateTransactionInput(req.body, activeAccountIds);
}

export async function createAdminTransaction(req, res) {
    try {
        const profile = await ensureAdminProfile(req.user);
        const validation = await validatedTransaction(req, profile);
        if (validation.error) {
            return res.status(400).json({ message: validation.error });
        }

        const transaction = await Transaction.create({
            ...validation.value,
            userId: req.user._id,
            source: 'admin',
            isSimulated: true
        });
        return res.status(201).json(publicTransaction(transaction, 'admin', profile));
    } catch (error) {
        console.error('Failed to create admin transaction:', error);
        return res.status(500).json({ message: 'Unable to create the transaction.' });
    }
}

export async function updateAdminTransaction(req, res) {
    const source = req.query.source === 'transfer' ? 'transfer' : 'admin';
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid transaction identifier.' });
    }

    try {
        const profile = await ensureAdminProfile(req.user);
        const validation = await validatedTransaction(req, profile);
        if (validation.error) {
            return res.status(400).json({ message: validation.error });
        }

        const transaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id, deletedAt: null },
            { $set: { ...validation.value, source } },
            { new: true, runValidators: true }
        );
        if (!transaction) {
            return res.status(404).json({ message: 'Active transaction not found.' });
        }
        return res.json(publicTransaction(transaction, source, profile));
    } catch (error) {
        console.error('Failed to update admin transaction:', error);
        return res.status(500).json({ message: 'Unable to update the transaction.' });
    }
}

export async function deleteAdminTransaction(req, res) {
    const source = req.query.source === 'transfer' ? 'transfer' : 'admin';
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: 'Invalid transaction identifier.' });
    }

    try {
        const transaction = await Transaction.findOne({
            _id: req.params.id,
            userId: req.user._id,
            deletedAt: null
        });
        if (!transaction) {
            return res.status(404).json({ message: 'Active transaction not found.' });
        }

        const audit = await AdminTransactionAudit.create({
            userId: req.user._id,
            transactionId: String(transaction._id),
            source,
            deletedBy: 'admin',
            requestIp: req.ip || '',
            snapshot: transaction.toObject()
        });

        try {
            const deleted = await Transaction.findOneAndUpdate(
                { _id: req.params.id, userId: req.user._id, deletedAt: null },
                { $set: { deletedAt: audit.deletedAt, deletedBy: 'admin' } },
                { new: true }
            );
            if (!deleted) {
                await audit.deleteOne();
                return res.status(404).json({ message: 'Active transaction not found.' });
            }
        } catch (error) {
            await audit.deleteOne();
            throw error;
        }

        return res.json({ message: 'Transaction deleted from active history.' });
    } catch (error) {
        console.error('Failed to delete admin transaction:', error);
        return res.status(500).json({ message: 'Unable to delete the transaction.' });
    }
}

export async function getTransactionAudit(req, res) {
    try {
        const audits = await AdminTransactionAudit.find({ userId: req.user._id })
            .sort({ deletedAt: -1 })
            .limit(500)
            .lean();
        return res.json(audits);
    } catch (error) {
        console.error('Failed to load transaction audit:', error);
        return res.status(500).json({ message: 'Unable to load the transaction audit.' });
    }
}

export async function updateAvailableBalance(req, res) {
    if ((typeof req.body?.amount !== 'number' && typeof req.body?.amount !== 'string')
        || req.body.amount === '') {
        return res.status(400).json({ message: 'Enter a valid available balance.' });
    }
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || Math.abs(amount) > 1e12) {
        return res.status(400).json({ message: 'Enter a valid available balance.' });
    }

    try {
        let balance = await Balance.findOne({ userId: req.user._id });
        if (!balance) balance = new Balance({ userId: req.user._id, amount });
        else balance.amount = amount;
        await balance.save();
        return res.json({ amount: balance.amount });
    } catch (error) {
        console.error('Failed to update available balance:', error);
        return res.status(500).json({ message: 'Unable to update the available balance.' });
    }
}
