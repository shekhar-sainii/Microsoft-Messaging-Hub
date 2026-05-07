import { UserModel, IUser } from '../../models/User';

export class UserRepository {
    async findByMicrosoftId(microsoftId: string): Promise<IUser | null> {
        return UserModel.findOne({ microsoftId });
    }

    async findByEmail(email: string): Promise<IUser | null> {
        return UserModel.findOne({ email });
    }

    async create(userData: Partial<IUser>): Promise<IUser> {
        const user = new UserModel(userData);
        return user.save();
    }

    async update(microsoftId: string, updateData: Partial<IUser>): Promise<IUser | null> {
        return UserModel.findOneAndUpdate({ microsoftId }, updateData, { new: true });
    }

    /**
     * Upsert by microsoftId OR email.
     * Handles the case where a user previously logged in with a different
     * microsoftId (e.g., switching from oid to sub for personal accounts).
     * Also handles MongoDB duplicate key errors gracefully.
     */
    async upsert(microsoftId: string, userData: Partial<IUser>): Promise<IUser> {
        // First try to find by microsoftId
        let existing = await UserModel.findOne({ microsoftId });

        // If not found by microsoftId, try by email (handles ID migration)
        if (!existing && userData.email) {
            existing = await UserModel.findOne({ email: userData.email });
        }

        if (existing) {
            // Update the existing record (also updates microsoftId if it changed)
            Object.assign(existing, userData);
            existing.microsoftId = microsoftId;
            return existing.save();
        }

        // Create new user
        try {
            const user = new UserModel({ ...userData, microsoftId });
            return await user.save();
        } catch (err: any) {
            // Handle race condition duplicate key — fetch and update
            if (err.code === 11000) {
                const filter = err.keyValue?.email
                    ? { email: err.keyValue.email }
                    : { microsoftId };
                const found = await UserModel.findOne(filter);
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
