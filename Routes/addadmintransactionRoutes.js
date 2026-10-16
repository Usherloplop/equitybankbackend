// routes/transactionRoutes.js
import express from 'express';
import {
    createadminTransaction,
    deleteadminTransaction,
  updateadminBalance,
  getadminBalance
} from '../Controller/addadmintransactionController.js';

const router = express.Router();

router.post('/transactions', createadminTransaction);
router.delete('/transactions/:id', deleteadminTransaction);
router.put('/balance', updateadminBalance);
router.get('/balance',  getadminBalance);

export default router;
