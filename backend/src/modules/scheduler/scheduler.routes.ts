import { Router } from 'express';
import { schedulerController } from './scheduler.controller';
import { authMiddleware } from '../../auth/authMiddleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /schedule:
 *   post:
 *     summary: Create a scheduled or recurring message
 *     description: Creates a BullMQ delayed job. On execution, the worker uses a client-credentials token to post the message via Graph.
 *     tags: [Scheduler]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScheduleMessageRequest'
 *     responses:
 *       200:
 *         description: Job created successfully
 *   get:
 *     summary: List scheduled messages
 *     description: Returns own scheduled messages. Admin role sees all.
 *     tags: [Scheduler]
 *     responses:
 *       200:
 *         description: Array of scheduled message jobs
 *
 * /schedule/{id}:
 *   patch:
 *     summary: Update a pending scheduled message
 *     tags: [Scheduler]
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
 *             type: object
 *             properties:
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated job
 *   delete:
 *     summary: Cancel a scheduled message
 *     description: Removes the BullMQ job and marks the DB record as cancelled.
 *     tags: [Scheduler]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.post('/', schedulerController.schedule);
router.get('/', schedulerController.list);
router.patch('/:id', schedulerController.update);
router.delete('/:id', schedulerController.cancel);

export default router;

