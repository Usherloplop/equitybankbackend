// models/Softcode.js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const softcodeSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        sparse: true
    },
    message: {
        type: String,
        required: true,
        maxlength: 2000
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

const Softcode = mongoose.models.Softcode || model('Softcode', softcodeSchema);

export default Softcode;
