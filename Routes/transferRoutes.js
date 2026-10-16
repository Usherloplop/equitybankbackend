// routes/transferRoutes.js
import express from 'express';
import { processTransfer } from '../Controller/TransferController.js';

const router = express.Router();

router.post('/process-transfer', processTransfer);

export default router;
