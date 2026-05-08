import { Router } from 'express';
import v1Routes from './v1';

const router = Router();

/**
 * Main API Router
 */
router.use('/v1', v1Routes);

// Optional: Legacy / API alias for backward compatibility or default version
router.use('/', v1Routes);

export default router;
