import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const globalAdminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: 254
    },
    passwordHash: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLoginAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

globalAdminSchema.methods.setPassword = async function (password) {
    this.passwordHash = await bcrypt.hash(password, 12);
};

globalAdminSchema.methods.matchPassword = function (password) {
    return bcrypt.compare(password, this.passwordHash);
};

const GlobalAdmin = mongoose.models.GlobalAdmin
    || mongoose.model('GlobalAdmin', globalAdminSchema);

export default GlobalAdmin;
