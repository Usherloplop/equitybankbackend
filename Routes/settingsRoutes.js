import express from 'express';
import { getPublicBranding } from '../Controller/GlobalAdminController.js';

const router = express.Router();

router.get('/branding', getPublicBranding);

export default router;
