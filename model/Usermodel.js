// Usermodel.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: 120
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: 254
    },
    password: {
        type: String,
        required: true,
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
    status: {
        type: String,
        enum: ['active', 'suspended', 'disabled', 'archived'],
        default: 'active',
        index: true
    },
    deletedAt: {
        type: Date,
        default: null
    },
    legacyDataClaimedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

userSchema.index(
    { email: 1 },
    { unique: true, partialFilterExpression: { email: { $type: 'string', $gt: '' } } }
);

userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
