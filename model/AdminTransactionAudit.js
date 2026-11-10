import mongoose from 'mongoose';

const auditSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    transactionId: {
        type: String,
        required: true,
        index: true
    },
    source: {
        type: String,
        enum: ['admin', 'transfer'],
        required: true
    },
    deletedAt: {
        type: Date,
        default: Date.now
    },
    deletedBy: {
        type: String,
        default: 'admin'
    },
    requestIp: {
        type: String,
        default: ''
    },
    snapshot: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    }
}, { timestamps: true });

const AdminTransactionAudit = mongoose.models.AdminTransactionAudit
    || mongoose.model('AdminTransactionAudit', auditSchema);

export default AdminTransactionAudit;
