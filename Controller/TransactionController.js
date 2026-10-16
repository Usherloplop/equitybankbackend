// controllers/transactionController.js
import Transaction from '../model/Transactionmodel.js';

export const addTransaction = async (req, res) => {
    try {
        const { description, amount, status } = req.body;
        const newTransaction = new Transaction({ description, amount, status });
        await newTransaction.save();
        res.status(201).json({ message: 'Transaction added successfully', transaction: newTransaction });
    } catch (error) {
        res.status(500).json({ message: 'Error adding transaction', error });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ date: -1 }); // Most recent first
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions', error });
    }
};
