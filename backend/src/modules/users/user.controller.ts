import { Request, Response } from 'express';
import { userRepository } from '../auth/user.repository';
import { logger } from '../../utils/logger';
import { auditRepository } from '../analytics/audit.repository';

export class UserController {
    async getAllUsers(req: Request, res: Response) {
        try {
            const users = await userRepository.find({}, { createdAt: -1 });
            res.json({ success: true, data: users });
        } catch (error: any) {
            logger.error('Failed to fetch users', { error: error.message });
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    async updateUserRole(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { role } = req.body;

            if (!['admin', 'manager', 'member'].includes(role)) {
                return res.status(400).json({ success: false, message: 'Invalid role' });
            }

            // Safety Check: Prevent demoting the last admin
            const targetUser = await userRepository.findOne({ _id: id });
            if (!targetUser) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            if (targetUser.role === 'admin' && role !== 'admin') {
                const adminCount = await (userRepository as any).model.countDocuments({ role: 'admin' });
                if (adminCount <= 1) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Action Blocked: You cannot demote the last administrator. Please promote another user first.' 
                    });
                }
            }

            const user = await userRepository.update({ _id: id }, { role });
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            await auditRepository.log({
                eventType: 'user_role_updated',
                details: `Updated role for user ${user.email} to ${role}`,
                status: 'success',
                userId: (req as any).user.id,
                metadata: { targetUserId: id, newRole: role }
            });

            res.json({ success: true, data: user });
        } catch (error: any) {
            logger.error('Failed to update user role', { error: error.message });
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
}

export const userController = new UserController();
