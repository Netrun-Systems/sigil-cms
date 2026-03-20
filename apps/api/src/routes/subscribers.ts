/**
 * Subscribers Routes
 *
 * Site-scoped mailing list management
 *
 * Admin (JWT-protected):
 *   GET    /api/v1/sites/:siteId/subscribers       — list
 *   GET    /api/v1/sites/:siteId/subscribers/stats  — counts
 *   POST   /api/v1/sites/:siteId/subscribers/broadcast — send to all
 *   DELETE /api/v1/sites/:siteId/subscribers/:id    — remove
 *
 * Public (registered via public router):
 *   POST   /api/v1/public/subscribe/:siteSlug
 *   GET    /api/v1/public/unsubscribe/:token
 */

import { Router } from 'express';
import type { Router as RouterType } from 'express';
import { SubscribersController } from '../controllers/SubscribersController.js';
import { authenticate, requireRole, tenantContext, validateUuidParam } from '../middleware/index.js';

const router: RouterType = Router({ mergeParams: true });

router.use(authenticate);
router.use(tenantContext);

router.get('/', SubscribersController.list);
router.get('/stats', SubscribersController.stats);
router.post('/broadcast', requireRole('admin', 'editor'), SubscribersController.broadcast);
router.delete('/:id', validateUuidParam('id'), requireRole('admin', 'editor'), SubscribersController.delete);

export default router;
