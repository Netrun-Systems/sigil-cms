/**
 * Events Routes
 *
 * CRUD routes for artist events (shows, festivals, livestreams)
 */

import { Router } from 'express';
import { EventsController } from '../controllers/EventsController.js';
import { authenticate, requireRole, tenantContext, validateUuidParam } from '../middleware/index.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(tenantContext);

router.get('/', EventsController.list);
router.post('/', requireRole('admin', 'editor'), EventsController.create);
router.get('/:id', validateUuidParam('id'), EventsController.get);
router.put('/:id', validateUuidParam('id'), requireRole('admin', 'editor'), EventsController.update);
router.delete('/:id', validateUuidParam('id'), requireRole('admin', 'editor'), EventsController.delete);

export default router;
