// controllers/softcodeController.js
import Softcode from '../model/softcodeModel.js';

// Get the current softcode message
export const getSoftcodeMessage = async (req, res) => {
    try {
        const softcode = await Softcode.findOne(); // Get the first softcode document
        if (softcode) {
            res.json({ message: softcode.message });
        } else {
            res.status(404).json({ error: 'Softcode message not found' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch softcode message' });
    }
};

// Update or create a new softcode message
export const updateSoftcodeMessage = async (req, res) => {
    const { newMessage } = req.body;

    try {
        // Check if a softcode already exists
        const softcode = await Softcode.findOne();
        if (softcode) {
            softcode.message = newMessage; // Update the existing message
            await softcode.save();
            res.json({ message: 'Softcode updated successfully', newMessage });
        } else {
            // Create a new softcode document
            const newSoftcode = new Softcode({ message: newMessage });
            await newSoftcode.save();
            res.json({ message: 'Softcode created successfully', newMessage });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to update softcode message' });
    }
};