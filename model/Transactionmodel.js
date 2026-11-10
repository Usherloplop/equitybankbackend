import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    date: {
        type: Date,
        default: Date.now,
    },

    description: String,

    amount: Number,

    status: {
        type: String,
        enum: ['Completed', 'Pending', 'Processing', 'Failed'],
        default: 'Processing',
    },

    balance: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },

    accountId: {
        type: String,
        default: ''
    },

    source: {
        type: String,
        enum: ['admin', 'transfer']
    },

    isSimulated: {
        type: Boolean,
        default: true
    },

    deletedAt: {
        type: Date,
        default: null
    },

    deletedBy: {
        type: String,
        default: ''
    },

    migrationKey: {
        type: String,
        unique: true,
        sparse: true
    },

    createdAt: {
        type: Date,
        default: Date.now
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

const Transaction = mongoose.models.Transaction
    || mongoose.model('Transaction', transactionSchema);

export default Transaction;