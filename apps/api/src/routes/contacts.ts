/**
 * Contact Submissions Routes
 *
 * Site-scoped contact form and booking inquiry management
 *
 * Admin (JWT-protected):
 *   GET    /api/v1/sites/:siteId/contacts       — list (filter by ?status=&type=)
 *   GET    /api/v1/sites/:siteId/contacts/stats  — counts by status
 *   PATCH  /api/v1/sites/:siteId/contacts/:id    — update status/notes
 *   DELETE /api/v1/sites/:siteId/contacts/:id    — delete
 *
 * Public (registered via public router):
 *   POST   /api/v1/public/contact/:siteSlug
 */

import { Router } from 'express';
import type { Router as RouterType } from 'express';
import { ContactController } from '../controllers/ContactController.js';
import { authenticate, requireRole, tenantContext, validateUuidParam } from '../middleware/index.js';

const router: RouterType = Router({ mergeParams: true });

router.use(authenticate);
router.use(tenantContext);

router.get('/', ContactController.list);
router.get('/stats', ContactController.stats);
router.patch('/:id', validateUuidParam('id'), requireRole('admin', 'editor'), ContactController.update);
router.delete('/:id', validateUuidParam('id'), requireRole('admin', 'editor'), ContactController.delete);

export default router;
