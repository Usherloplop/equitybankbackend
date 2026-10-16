import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  description: String,
  amount: Number,
  status: { type: String, enum: ['Completed', 'Pending'], default: 'Pending' },
  balance: String,
  createdAt: { type: Date, default: Date.now }
});

// ✅ This line prevents OverwriteModelError
export default mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
