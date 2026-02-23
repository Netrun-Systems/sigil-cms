/**
 * Releases Routes
 *
 * CRUD routes for artist releases (singles, albums, EPs)
 */

import { Router } from 'express';
import { ReleasesController } from '../controllers/ReleasesController.js';
import { authenticate, requireRole, tenantContext, validateUuidParam } from '../middleware/index.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(tenantContext);

router.get('/', ReleasesController.list);
router.post('/', requireRole('admin', 'editor'), ReleasesController.create);
router.get('/:id', validateUuidParam('id'), ReleasesController.get);
router.put('/:id', validateUuidParam('id'), requireRole('admin', 'editor'), ReleasesController.update);
router.delete('/:id', validateUuidParam('id'), requireRole('admin', 'editor'), ReleasesController.delete);

export default router;
