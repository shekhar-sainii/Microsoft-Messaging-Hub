import { Response } from 'express';
import { queueService } from './queue.service';
import { AuthenticatedRequest } from '../../auth/authMiddleware';
import ScheduledMessageModel from '../../models/ScheduledMessage';

export class SchedulerController {
  async schedule(req: AuthenticatedRequest, res: Response) {
    try {
      const { teamId, channelId, content, scheduledFor, recurrence, recurrenceEndDate } = req.body;
      const result = await queueService.scheduleMessage(
        req.user.microsoftId,
        teamId,
        channelId,
        content,
        new Date(scheduledFor),
        recurrence || 'none',
        recurrenceEndDate ? new Date(recurrenceEndDate) : undefined
      );
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const messages = await queueService.getScheduledMessages(req.user.microsoftId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
        const id = req.params.id as string;
        const content = req.body.content as string;
        const scheduledFor = req.body.scheduledFor;
        
        const message = await ScheduledMessageModel.findOne({ _id: id, userId: req.user.microsoftId });
        if (!message) return res.status(404).json({ error: 'Message not found' });
        if (message.status !== 'pending') return res.status(400).json({ error: 'Only pending messages can be updated' });

        if (scheduledFor) {
            await queueService.cancelMessage(id);
            const newMessage = await queueService.scheduleMessage(
                req.user.microsoftId,
                message.teamId,
                message.channelId,
                content || message.content,
                new Date(scheduledFor)
            );
            return res.json(newMessage);
        }

        message.content = content || message.content;
        await message.save();
        res.json(message);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
  }

  async cancel(req: AuthenticatedRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const cancelSeries = req.query.cancelSeries === 'true';
      const result = await queueService.cancelMessage(id, cancelSeries);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const schedulerController = new SchedulerController();
