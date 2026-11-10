import express from 'express';
import {
    archiveManagedUser,
    createGlobalAdminSession,
    createManagedUser,
    getManagedUser,
    listAdminAudit,
    listUsers,
    updateBranding,
    updateManagedUser
} from '../Controller/GlobalAdminController.js';
import { requireGlobalAdmin } from '../Utils/authMiddleware.js';

const router = express.Router();

router.post('/session', createGlobalAdminSession);
router.get('/users', requireGlobalAdmin, listUsers);
router.post('/users', requireGlobalAdmin, createManagedUser);
router.get('/users/:id', requireGlobalAdmin, getManagedUser);
router.put('/users/:id', requireGlobalAdmin, updateManagedUser);
router.delete('/users/:id', requireGlobalAdmin, archiveManagedUser);
router.get('/audit', requireGlobalAdmin, listAdminAudit);
router.put('/branding', requireGlobalAdmin, updateBranding);

export default router;
