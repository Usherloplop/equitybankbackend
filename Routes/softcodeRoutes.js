// routes/softcodeRoutes.js
import express from 'express';
import { getSoftcodeMessage, updateSoftcodeMessage } from '../Controller/softcodeController.js';
import { requireAdmin } from '../Utils/adminAuth.js';

const router = express.Router();

router.get('/getSoftcode', requireAdmin, getSoftcodeMessage);
router.post('/updateSoftcode', requireAdmin, updateSoftcodeMessage);

export default router;
