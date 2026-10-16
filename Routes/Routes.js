// routes/transactionRoutes.js
import express from 'express';
import { addTransaction, getTransactions } from '../Controller/TransactionController.js';
import { loginUser, registerUser } from '../Controller/UserController.js';

const router = express.Router();

router.post('/addtransaction', addTransaction);
router.get('/transactions', getTransactions);


// Login Route
router.post('/login', loginUser);

// Register Route (optional)
router.post('/register', registerUser);

export default router;
