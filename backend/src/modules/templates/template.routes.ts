import { Router } from 'express';
import { templateController } from './template.controller';
import { authMiddleware } from '../../auth/authMiddleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /templates:
 *   post:
 *     summary: Save a new message template
 *     tags: [Templates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageTemplate'
 *     responses:
 *       200:
 *         description: Template saved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MessageTemplate'
 *   get:
 *     summary: List templates (own + public org templates)
 *     tags: [Templates]
 *     responses:
 *       200:
 *         description: Array of templates
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MessageTemplate'
 *
 * /templates/{id}:
 *   patch:
 *     summary: Update a template
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MessageTemplate'
 *     responses:
 *       200:
 *         description: Updated template
 *   delete:
 *     summary: Delete a template
 *     tags: [Templates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Template deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/', templateController.save);
router.get('/', templateController.list);
router.patch('/:id', templateController.update);
router.delete('/:id', templateController.delete);

export default router;

