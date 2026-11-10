// controllers/softcodeController.js
import Softcode from '../model/softcodeModel.js';

export const getSoftcodeMessage = async (req, res) => {
    try {
        const softcode = await Softcode.findOne({ userId: req.user._id })
            .select('message')
            .lean();
        return res.json({ message: softcode?.message || '' });
    } catch (error) {
        console.error('Failed to fetch user Soft Code message:', error);
        return res.status(500).json({ message: 'Failed to fetch Soft Code message.' });
    }
};

export const updateSoftcodeMessage = async (req, res) => {
    const message = req.body?.newMessage;
    if (typeof message !== 'string' || message.trim().length > 2000
        || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(message)) {
        return res.status(400).json({ message: 'Soft Code message must be valid text up to 2,000 characters.' });
    }

    try {
        const softcode = await Softcode.findOneAndUpdate(
            { userId: req.user._id },
            {
                $set: { message: message.trim() },
                $setOnInsert: { userId: req.user._id }
            },
            { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );
        return res.json({
            message: 'Soft Code message updated successfully.',
            newMessage: softcode.message
        });
    } catch (error) {
        console.error('Failed to update user Soft Code message:', error);
        return res.status(500).json({ message: 'Failed to update Soft Code message.' });
    }
};