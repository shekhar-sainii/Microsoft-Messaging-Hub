import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import { useScheduledMessages, useCancelSchedule } from '../../../hooks/useSchedulerData';
import toast from 'react-hot-toast';

const RECURRENCE_LABELS: Record<string, string> = {
    none: '',
    daily: '🔁 Daily',
    weekly: '🔁 Weekly',
    monthly: '🔁 Monthly',
};

export const SchedulerDashboard: React.FC = () => {
    const { data: schedules, isLoading } = useScheduledMessages();
    const { mutate: cancelSchedule } = useCancelSchedule();

    const handleCancel = (schedule: any) => {
        const isSeries = schedule.recurrence && schedule.recurrence !== 'none';

        if (isSeries) {
            const choice = window.confirm(
                'This is a recurring message.\n\nOK = Cancel entire series\nCancel = Cancel only this occurrence'
            );
            cancelSchedule(
                { id: schedule._id, cancelSeries: choice },
                {
                    onSuccess: () => toast.success(choice ? 'Recurring series cancelled' : 'Occurrence cancelled'),
                    onError: () => toast.error('Failed to cancel'),
                }
            );
        } else {
            if (window.confirm('Cancel this scheduled message?')) {
                cancelSchedule(
                    { id: schedule._id, cancelSeries: false },
                    {
                        onSuccess: () => toast.success('Message cancelled'),
                        onError: () => toast.error('Failed to cancel'),
                    }
                );
            }
        }
    };

    return (
        <div className="w-full space-y-8 pb-20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Scheduled Messages</h2>
                    <p className="text-slate-500 font-medium text-lg mt-1">
                        Manage messages queued for future delivery. Supports daily, weekly, and monthly recurrence.
                    </p>
                </div>
            </div>

            <div className="glass-card rounded-[2.5rem] p-8">
                {isLoading ? (
                    <div className="py-20 text-center">
                        <Clock className="mx-auto animate-spin text-blue-500 mb-4" size={32} />
                        <p className="text-slate-500 font-medium">Loading schedules...</p>
                    </div>
                ) : schedules?.length === 0 ? (
                    <div className="py-20 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
                            <Calendar size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">No Pending Schedules</h3>
                        <p className="text-slate-400 mt-2 font-medium">
                            You don't have any messages scheduled for the future.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {schedules?.map((schedule: any, i: number) => (
                            <motion.div
                                key={schedule._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group"
                            >
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                        schedule.status === 'pending'
                                            ? 'bg-amber-50 text-amber-500'
                                            : schedule.status === 'sent'
                                            ? 'bg-green-50 text-green-500'
                                            : 'bg-red-50 text-red-500'
                                    }`}
                                >
                                    {schedule.status === 'pending' ? (
                                        <Clock size={24} />
                                    ) : schedule.status === 'sent' ? (
                                        <CheckCircle2 size={24} />
                                    ) : (
                                        <XCircle size={24} />
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap justify-between items-start gap-2 mb-1">
                                        <h4 className="text-base font-bold text-slate-800 truncate pr-4">
                                            Delivery: {new Date(schedule.scheduledFor).toLocaleString()}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            {schedule.recurrence && schedule.recurrence !== 'none' && (
                                                <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                                    {RECURRENCE_LABELS[schedule.recurrence]}
                                                </span>
                                            )}
                                            <span
                                                className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                                                    schedule.status === 'pending'
                                                        ? 'bg-amber-100 text-amber-700'
                                                        : schedule.status === 'sent'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-red-100 text-red-700'
                                                }`}
                                            >
                                                {schedule.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        className="text-sm text-slate-600 line-clamp-1 prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: schedule.content || 'No content' }}
                                    />
                                    {schedule.recurrenceEndDate && (
                                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                                            Series ends: {new Date(schedule.recurrenceEndDate).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>

                                {schedule.status === 'pending' && (
                                    <div className="flex items-center gap-2 sm:ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleCancel(schedule)}
                                            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 size={16} />
                                            {schedule.recurrence !== 'none' ? 'Cancel Series' : 'Cancel'}
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
