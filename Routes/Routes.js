// routes/transactionRoutes.js
import express from 'express';
import { addTransaction, getTransactions } from '../Controller/TransactionController.js';
import { getCurrentUser, loginUser, registerUser } from '../Controller/UserController.js';
import { requireUser } from '../Utils/authMiddleware.js';

const router = express.Router();

router.post('/addtransaction', requireUser, addTransaction);
router.get('/transactions', requireUser, getTransactions);


// Login Route
router.post('/login', loginUser);

// Register Route (optional)
router.post('/register', registerUser);
router.get('/users/me', requireUser, getCurrentUser);

export default router;
