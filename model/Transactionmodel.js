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


    // ==========================================
    // OPTIONAL RECIPIENT AND BANK INFORMATION
    // ==========================================

    recipientName: {
        type: String,
        trim: true
    },

    recipientAccount: {
        type: String,
        trim: true
    },

    bankIdentifierType: {
        type: String,
        trim: true
    },

    bankIdentifier: {
        type: String,
        trim: true
    },

    bankName: {
        type: String,
        trim: true
    },

    recipientEmail: {
        type: String,
        trim: true
    },

    recipientPhone: {
        type: String,
        trim: true
    }

});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;