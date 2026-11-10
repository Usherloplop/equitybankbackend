import Transaction from '../model/Transactionmodel.js';
import { ensureAdminProfile } from './AdminController.js';
import { getPublicTransactions } from './AdminController.js';


// ==========================================
// ADD TRANSACTION
// ==========================================

export const addTransaction = async (req, res) => {

    try {

        const {

            description,

            amount,

            status,

            recipientName,

            recipientAccount,

            bankIdentifierType,

            bankIdentifier,

            bankName,

            recipientEmail,
            recipientPhone,
            date,
            balance,
            accountId
        } = req.body;

        const numericAmount = Number(amount);
        if (!description || typeof description !== 'string'
            || !Number.isFinite(numericAmount)
            || Math.abs(numericAmount) > 1e12) {
            return res.status(400).json({
                message: 'A description and valid transaction amount are required.'
            });
        }

        const transactionDate = date ? new Date(date) : new Date();
        if (Number.isNaN(transactionDate.getTime())) {
            return res.status(400).json({ message: 'Enter a valid transaction date.' });
        }

        if (accountId) {
            const profile = await ensureAdminProfile(req.user);
            const account = profile?.accounts.find(
                item => String(item._id) === String(accountId) && item.isActive
            );
            if (!account) {
                return res.status(400).json({ message: 'Select an active account.' });
            }
        }


        const newTransaction = new Transaction({
            userId: req.user._id,
            source: 'transfer',
            description,

            amount: numericAmount,

            status,

            date: transactionDate,

            balance: balance ?? null,

            accountId: accountId || '',

            isSimulated: true,

            recipientName,

            recipientAccount,

            bankIdentifierType,

            bankIdentifier,

            bankName,

            recipientEmail,

            recipientPhone

        });


        await newTransaction.save();


        res.status(201).json({

            message: 'Transaction added successfully',

            transaction: newTransaction

        });

    } catch (error) {

        console.error('Error adding transaction:', error);

        res.status(500).json({

            message: 'Error adding transaction',

            error: error.message

        });

    }

};


// ==========================================
// GET TRANSACTIONS
// ==========================================

export const getTransactions = async (req, res) => {
    return getPublicTransactions(req, res);
};