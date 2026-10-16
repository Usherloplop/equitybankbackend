// models/Softcode.js
import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const softcodeSchema = new Schema({
    message: {
        type: String,
        required: true
    }
}, {
    timestamps: true // Adds createdAt and updatedAt fields automatically
});

const Softcode = model('Softcode', softcodeSchema);

export default Softcode;
