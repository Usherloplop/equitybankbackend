import mongoose from 'mongoose';

const appSettingsSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        default: 'global'
    },
    applicationName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
        default: 'Crystaline International Group'
    }
}, { timestamps: true });

const AppSettings = mongoose.models.AppSettings
    || mongoose.model('AppSettings', appSettingsSchema);

export default AppSettings;
