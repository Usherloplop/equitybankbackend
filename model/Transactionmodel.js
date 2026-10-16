// models/Transaction.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now,
    },
    description: String,
    amount: Number,
    status: {
        type: String,
        enum: ['Completed', 'Processing'],
        default: 'Processing',
    },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
