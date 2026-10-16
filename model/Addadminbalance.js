import mongoose from 'mongoose';

const balanceSchema = new mongoose.Schema({
  amount: { type: Number, required: true }
});

export default mongoose.model('Balance', balanceSchema);
