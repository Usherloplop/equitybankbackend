import mongoose from 'mongoose';
import {
    ACCOUNT_TYPES,
    NEW_USER_ACCOUNTS,
    SUPPORTED_CURRENCIES
} from '../Utils/adminConfig.js';

const accountSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ACCOUNT_TYPES
    },
    accountNumber: {
        type: String,
        trim: true,
        maxlength: 40,
        default: ''
    },
    balance: {
        type: Number,
        min: -1e12,
        max: 1e12,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const adminProfileSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
        sparse: true,
        index: true
    },
    firstName: {
        type: String,
        trim: true,
        maxlength: 60,
        default: ''
    },
    lastName: {
        type: String,
        trim: true,
        maxlength: 60,
        default: ''
    },
    currency: {
        type: String,
        enum: Object.keys(SUPPORTED_CURRENCIES),
        default: 'USD'
    },
    accounts: {
        type: [accountSchema],
        default: () => NEW_USER_ACCOUNTS
    },
    legacyTransactionsMigrated: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const AdminProfile = mongoose.models.AdminProfile
    || mongoose.model('AdminProfile', adminProfileSchema);

export default AdminProfile;
