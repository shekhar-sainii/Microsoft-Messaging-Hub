import { userRepository } from '../auth/user.repository';
import { auditRepository } from '../analytics/audit.repository';

export class FavouriteService {
    async addFavourite(microsoftId: string, data: { teamId: string; channelId: string; teamName: string; channelName: string }) {
        const user = await userRepository.findByMicrosoftId(microsoftId);
        if (!user) throw new Error('User not found');

        const alreadyFav = user.favouriteChannels.some(f => f.channelId === data.channelId);
        if (!alreadyFav) {
            user.favouriteChannels.push(data);
            await user.save();
        }

        await auditRepository.log({
            eventType: 'favourite_added',
            details: `Channel ${data.channelName || data.channelId} added to favourites`,
            status: 'success',
            userId: microsoftId,
            metadata: { teamId: data.teamId, channelId: data.channelId },
        });

        return user.favouriteChannels;
    }

    async removeFavourite(microsoftId: string, channelId: string) {
        const user = await userRepository.findByMicrosoftId(microsoftId);
        if (!user) throw new Error('User not found');

        user.favouriteChannels = user.favouriteChannels.filter(f => f.channelId !== channelId);
        await user.save();

        return user.favouriteChannels;
    }

    async getFavourites(microsoftId: string) {
        const user = await userRepository.findByMicrosoftId(microsoftId);
        if (!user) throw new Error('User not found');
        return user.favouriteChannels;
    }
}

export const favouriteService = new FavouriteService();
