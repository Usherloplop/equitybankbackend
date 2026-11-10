import express from 'express';
import {
    createAdminTransaction,
    deleteAdminTransaction,
    getAdminProfile,
    getAdminTransactions,
    getPublicBalance,
    getPublicProfile,
    getPublicTransactions,
    getTransactionAudit,
    updateAccounts,
    updateAdminProfile,
    updateAdminTransaction,
    updateAvailableBalance,
    updateCurrency
} from '../Controller/AdminController.js';
import { createAdminSession, requireAdmin } from '../Utils/adminAuth.js';
import { requireUser } from '../Utils/authMiddleware.js';

const router = express.Router();

router.post('/admin/session', requireUser, createAdminSession);
router.get('/profile', requireUser, getPublicProfile);
router.get('/accounts', requireUser, getPublicProfile);
router.get('/transactions', requireUser, getPublicTransactions);
router.get('/balance', requireUser, getPublicBalance);

router.get('/admin/profile', requireAdmin, getAdminProfile);
router.put('/admin/profile', requireAdmin, updateAdminProfile);
router.put('/admin/currency', requireAdmin, updateCurrency);
router.put('/admin/accounts', requireAdmin, updateAccounts);
router.get('/admin/transactions', requireAdmin, getAdminTransactions);
router.get('/admin/transaction-audit', requireAdmin, getTransactionAudit);

router.post('/transactions', requireAdmin, createAdminTransaction);
router.put('/transactions/:id', requireAdmin, updateAdminTransaction);
router.delete('/transactions/:id', requireAdmin, deleteAdminTransaction);
router.put('/balance', requireAdmin, updateAvailableBalance);

export default router;
