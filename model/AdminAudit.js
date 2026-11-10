import mongoose from 'mongoose';

const adminAuditSchema = new mongoose.Schema({
    actorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GlobalAdmin',
        required: true,
        index: true
    },
    action: {
        type: String,
        required: true,
        maxlength: 80
    },
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    requestIp: {
        type: String,
        maxlength: 100,
        default: ''
    }
}, { timestamps: true });

const AdminAudit = mongoose.models.AdminAudit
    || mongoose.model('AdminAudit', adminAuditSchema);

export default AdminAudit;
