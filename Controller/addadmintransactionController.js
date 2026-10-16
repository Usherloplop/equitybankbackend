// controllers/addadmintransactionController.js 
import Transaction from '../model/Addadmintransaction.js';
import Balance from '../model/Addadminbalance.js';

export const createadminTransaction = async (req, res) => {
  try {
    const tx = await Transaction.create(req.body);
    res.status(201).json(tx);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteadminTransaction = async (req, res) => {
  try {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateadminBalance = async (req, res) => {
  try {
    let balanceDoc = await Balance.findOne();
    if (!balanceDoc) balanceDoc = new Balance({ amount: req.body.amount });
    else balanceDoc.amount = req.body.amount;
    await balanceDoc.save();
    res.json(balanceDoc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getadminBalance = async (req, res) => {
  try {
    const balanceDoc = await Balance.findOne();
    res.json(balanceDoc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
