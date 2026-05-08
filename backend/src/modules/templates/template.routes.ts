import { Router } from 'express';
import { templateController } from './template.controller';
import { authMiddleware } from '../../auth/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/', templateController.saveTemplate);
router.get('/', templateController.listTemplates);
router.put('/:id', templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);

export default router;
