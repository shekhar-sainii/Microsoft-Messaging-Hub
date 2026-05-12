import React, { useState } from 'react';
import { useGetUsersQuery, useUpdateUserRoleMutation, User } from '../../../app/api/usersApi';
import { Shield, User as UserIcon, MoreVertical, Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmationModal } from '../../../components/modals/ConfirmationModal';
import { Pagination } from '../../../components/common/Pagination';
import toast from 'react-hot-toast';

export const UserManagement: React.FC = () => {
    const { data, isLoading, refetch } = useGetUsersQuery();
    const [updateRole, { isLoading: isUpdating }] = useUpdateUserRoleMutation();
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        userId: string;
        userName: string;
        newRole: string;
    }>({ isOpen: false, userId: '', userName: '', newRole: '' });
    
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const openConfirmModal = (id: string, name: string, role: string) => {
        setConfirmModal({
            isOpen: true,
            userId: id,
            userName: name,
            newRole: role
        });
    };

    const handleRoleUpdate = async () => {
        const { userId, newRole } = confirmModal;
        try {
            await updateRole({ id: userId, role: newRole }).unwrap();
            toast.success(`User role updated to ${newRole}`);
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        } catch (error: any) {
            toast.error(error.data?.message || 'Failed to update role');
        }
    };

    if (isLoading) {
        return (
            <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-2xl" />
                ))}
            </div>
        );
    }

    const users = data?.data || [];
    const totalPages = Math.ceil(users.length / pageSize);
    const paginatedUsers = users.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">User Management</h2>
                <p className="text-slate-500 font-medium">Dynamically promote users and manage organization access.</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">User</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Organization</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Role</th>
                            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedUsers.map((user: User) => (
                            <motion.tr 
                                key={user._id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="hover:bg-slate-50/50 transition-colors"
                            >
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900 border border-slate-200">
                                            <UserIcon size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-900">{user.displayName}</span>
                                            <span className="text-xs text-slate-400 font-medium">{user.email}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                                    {user.tenantId}
                                </td>
                                <td className="px-6 py-5">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${
                                        user.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                        user.role === 'manager' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                        'bg-slate-50 text-slate-500 border border-slate-100'
                                    }`}>
                                        {user.role === 'admin' ? <ShieldCheck size={14} /> : user.role === 'manager' ? <Shield size={14} /> : <UserIcon size={14} />}
                                        {user.role}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        {user.role !== 'admin' && (
                                            <button 
                                                onClick={() => openConfirmModal(user._id, user.displayName, 'admin')}
                                                disabled={isUpdating}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Promote to Admin"
                                            >
                                                <ShieldCheck size={18} />
                                            </button>
                                        )}
                                        {user.role === 'admin' && (
                                            <button 
                                                onClick={() => openConfirmModal(user._id, user.displayName, 'member')}
                                                disabled={isUpdating}
                                                className="p-2 text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                                                title="Demote to Member"
                                            >
                                                <UserIcon size={18} />
                                            </button>
                                        )}
                                        {user.role === 'member' && (
                                            <button 
                                                onClick={() => openConfirmModal(user._id, user.displayName, 'manager')}
                                                disabled={isUpdating}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Make Manager"
                                            >
                                                <Shield size={18} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
                
                <Pagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={users.length}
                    onPageChange={setCurrentPage}
                    pageSize={pageSize}
                />
            </div>

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleRoleUpdate}
                title="Update User Role"
                message={`Are you sure you want to change ${confirmModal.userName}'s role to ${confirmModal.newRole.toUpperCase()}? This will update their permissions immediately.`}
                confirmText={`Change to ${confirmModal.newRole}`}
                cancelText="Cancel"
                type={confirmModal.newRole === 'admin' ? 'info' : 'danger'}
            />
        </div>
    );
};
