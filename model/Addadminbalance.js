import mongoose from 'mongoose';

const balanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  amount: { type: Number, required: true }
});

export default mongoose.model('Balance', balanceSchema);
