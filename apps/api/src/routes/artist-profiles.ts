/**
 * Artist Profiles Routes
 *
 * Single profile per site — get and upsert pattern
 */

import { Router } from 'express';
import { ArtistProfilesController } from '../controllers/ArtistProfilesController.js';
import { authenticate, requireRole, tenantContext } from '../middleware/index.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(tenantContext);

router.get('/', ArtistProfilesController.get);
router.put('/', requireRole('admin', 'editor'), ArtistProfilesController.upsert);
router.delete('/', requireRole('admin'), ArtistProfilesController.delete);

export default router;
