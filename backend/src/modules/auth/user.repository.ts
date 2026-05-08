import { BaseRepository } from '../../shared/BaseRepository';
import { UserModel, IUser } from '../../models/User';

export class UserRepository extends BaseRepository<IUser> {
    constructor() {
        super(UserModel);
    }

    async findByMicrosoftId(microsoftId: string) {
        return this.findOne({ microsoftId });
    }

    async findByEmail(email: string) {
        return this.findOne({ email });
    }

    /**
     * Upsert by microsoftId OR email.
     * Handles identity migrations and race conditions.
     */
    async upsert(microsoftId: string, userData: Partial<IUser>): Promise<IUser> {
        let existing = await this.findByMicrosoftId(microsoftId);

        if (!existing && userData.email) {
            existing = await this.findByEmail(userData.email);
        }

        if (existing) {
            Object.assign(existing, userData);
            existing.microsoftId = microsoftId;
            return existing.save();
        }

        try {
            const user = new UserModel({ ...userData, microsoftId });
            return await user.save();
        } catch (err: any) {
            if (err.code === 11000) {
                const filter = err.keyValue?.email
                    ? { email: err.keyValue.email }
                    : { microsoftId };
                const found = await this.findOne(filter);
                if (found) {
                    Object.assign(found, userData);
                    found.microsoftId = microsoftId;
                    return found.save();
                }
            }
            throw err;
        }
    }
}

export const userRepository = new UserRepository();
