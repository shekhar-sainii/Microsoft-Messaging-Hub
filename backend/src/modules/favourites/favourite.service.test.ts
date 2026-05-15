import { favouriteService } from './favourite.service';
import { userRepository } from '../auth/user.repository';
import { auditRepository } from '../analytics/audit.repository';

jest.mock('../auth/user.repository', () => ({
  userRepository: {
    findByMicrosoftId: jest.fn(),
  },
}));

jest.mock('../analytics/audit.repository', () => ({
  auditRepository: {
    log: jest.fn(),
  },
}));

const createUser = () => ({
  favouriteChannels: [{ teamId: 't1', channelId: 'c1', teamName: 'Team', channelName: 'General' }],
  save: jest.fn().mockResolvedValue(undefined),
});

describe('FavouriteService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('adds a new favourite and audits the action', async () => {
    const user = createUser();
    (userRepository.findByMicrosoftId as jest.Mock).mockResolvedValue(user);

    const result = await favouriteService.addFavourite('u1', {
      teamId: 't2',
      channelId: 'c2',
      teamName: 'Ops',
      channelName: 'Alerts',
    });

    expect(result).toHaveLength(2);
    expect(user.save).toHaveBeenCalled();
    expect(auditRepository.log).toHaveBeenCalledWith(expect.objectContaining({
      eventType: 'favourite_added',
      userId: 'u1',
    }));
  });

  it('does not duplicate an existing favourite', async () => {
    const user = createUser();
    (userRepository.findByMicrosoftId as jest.Mock).mockResolvedValue(user);

    const result = await favouriteService.addFavourite('u1', {
      teamId: 't1',
      channelId: 'c1',
      teamName: 'Team',
      channelName: 'General',
    });

    expect(result).toHaveLength(1);
    expect(user.save).not.toHaveBeenCalled();
  });

  it('removes a favourite channel', async () => {
    const user = createUser();
    (userRepository.findByMicrosoftId as jest.Mock).mockResolvedValue(user);

    await expect(favouriteService.removeFavourite('u1', 'c1')).resolves.toEqual([]);
    expect(user.save).toHaveBeenCalled();
  });

  it('throws when the user is missing', async () => {
    (userRepository.findByMicrosoftId as jest.Mock).mockResolvedValue(null);

    await expect(favouriteService.getFavourites('missing')).rejects.toThrow('User not found');
  });
});
