// routes/transferRoutes.js
import express from 'express';
import { downloadTransferReceipt, processTransfer } from '../Controller/TransferController.js';
import { requireUser } from '../Utils/authMiddleware.js';

const router = express.Router();

router.post('/process-transfer', requireUser, processTransfer);
router.get('/receipts/:id', requireUser, downloadTransferReceipt);

export default router;
