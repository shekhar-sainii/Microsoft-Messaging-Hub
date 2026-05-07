import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../../auth/authMiddleware';
import { UserModel } from '../../models/User';
import { AuditLogModel } from '../../models/AuditLog';

const router = Router();
router.use(authMiddleware);

/**
 * POST /api/favourites
 * Add a channel to the user's favourites (persisted in User.favouriteChannels)
 */
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { channelId, teamId, channelName = '', teamName = '' } = req.body;

        if (!channelId || !teamId) {
            return res.status(400).json({ error: 'channelId and teamId are required' });
        }

        const user = await UserModel.findOne({ microsoftId: req.user.microsoftId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Avoid duplicates
        const alreadyFav = user.favouriteChannels.some(f => f.channelId === channelId);
        if (!alreadyFav) {
            user.favouriteChannels.push({ teamId, channelId, teamName, channelName });
            await user.save();
        }

        await AuditLogModel.create({
            eventType: 'favourite_added',
            details: `Channel ${channelName || channelId} added to favourites`,
            status: 'success',
            userId: req.user.microsoftId,
            metadata: { teamId, channelId },
        });

        res.json({ success: true, favouriteChannels: user.favouriteChannels });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/favourites/:channelId
 * Remove a channel from the user's favourites
 */
router.delete('/:channelId', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { channelId } = req.params;

        const user = await UserModel.findOne({ microsoftId: req.user.microsoftId });
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.favouriteChannels = user.favouriteChannels.filter(f => f.channelId !== channelId);
        await user.save();

        res.json({ success: true, favouriteChannels: user.favouriteChannels });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/favourites
 * Get all favourite channels for the current user
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = await UserModel.findOne({ microsoftId: req.user.microsoftId });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user.favouriteChannels);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
