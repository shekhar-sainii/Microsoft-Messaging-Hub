import { Router } from 'express';
import { userController } from './user.controller';
import { authMiddleware, authorize } from '../../auth/authMiddleware';

const router = Router();

// All user management routes are protected and require Admin role
router.use(authMiddleware);
router.use(authorize(['admin']));

router.get('/', userController.getAllUsers);
router.patch('/:id/role', userController.updateUserRole);

export default router;
