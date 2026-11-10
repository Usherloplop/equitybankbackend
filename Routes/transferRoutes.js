// routes/transferRoutes.js
import express from 'express';
import { processTransfer } from '../Controller/TransferController.js';
import { requireUser } from '../Utils/authMiddleware.js';

const router = express.Router();

router.post('/process-transfer', requireUser, processTransfer);

export default router;
