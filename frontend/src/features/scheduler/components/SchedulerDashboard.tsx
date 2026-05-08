import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, CheckCircle2, XCircle, Trash2, Send, Activity, Timer, Layers } from 'lucide-react';
import { useGetScheduledMessagesQuery, useCancelScheduleMutation } from '../schedulerApi';
import toast from 'react-hot-toast';

const RECURRENCE_LABELS: Record<string, string> = {
    none: 'One-time',
    daily: 'Daily Sync',
    weekly: 'Weekly Pulse',
    monthly: 'Monthly Report',
};

export const SchedulerDashboard: React.FC = () => {
    const { data: schedules, isLoading } = useGetScheduledMessagesQuery();
    const [cancelSchedule] = useCancelScheduleMutation();

    const handleCancel = (schedule: any) => {
        const isSeries = schedule.recurrence && schedule.recurrence !== 'none';

        if (isSeries) {
            const choice = window.confirm(
                'This is a recurring series.\n\nOK = Cancel ENTIRE series\nCancel = Cancel ONLY this occurrence'
            );
            cancelSchedule({ id: schedule._id, cancelSeries: choice })
                .unwrap()
                .then(() => toast.success(choice ? 'Series terminated' : 'Occurrence cancelled'))
                .catch(() => toast.error('Termination failed'));
        } else {
            if (window.confirm('Are you sure you want to cancel this scheduled delivery?')) {
                cancelSchedule({ id: schedule._id, cancelSeries: false })
                    .unwrap()
                    .then(() => toast.success('Delivery cancelled'))
                    .catch(() => toast.error('Failed to cancel'));
            }
        }
    };

    const stats = [
        { label: 'Active Tasks', value: schedules?.filter((s: any) => s.status === 'pending').length || 0, icon: Timer, color: 'blue' },
        { label: 'Successful', value: schedules?.filter((s: any) => s.status === 'sent').length || 0, icon: CheckCircle2, color: 'green' },
        { label: 'Recurring', value: schedules?.filter((s: any) => s.recurrence && s.recurrence !== 'none').length || 0, icon: Layers, color: 'indigo' }
    ];

    return (
        <div className="w-full space-y-8 pb-32">
            {/* Compact Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-amber-100">
                        <Send size={10} />
                        Automated Dispatch
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Mission Control</h2>
                    <p className="text-slate-400 font-bold text-sm max-w-xl">
                        Orchestrate future communications with precision.
                    </p>
                </div>
            </div>

            {/* Compact Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm"
                    >
                        <div className={`w-10 h-10 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl flex items-center justify-center shadow-inner`}>
                            <stat.icon size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            <p className="text-lg font-black text-slate-900 tracking-tight">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Schedule List */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-2">
                    <Activity size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Schedule Queue</span>
                </div>

                {isLoading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Querying...</p>
                    </div>
                ) : schedules?.length === 0 ? (
                    <div className="py-20 text-center bg-white border-2 border-dashed border-slate-100 rounded-[2rem]">
                        <Calendar className="mx-auto text-slate-200 mb-4" size={48} />
                        <h3 className="text-xl font-black text-slate-800 tracking-tight italic uppercase">No Active Missions</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {schedules?.map((schedule: any, i: number) => (
                            <motion.div
                                key={schedule._id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="group relative"
                            >
                                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 flex flex-col lg:flex-row items-center gap-6 relative z-10 transition-all duration-300 hover:border-slate-200 hover:shadow-xl hover:shadow-slate-50">
                                    
                                    {/* Status Indicator */}
                                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500 ${
                                        schedule.status === 'pending'
                                            ? 'bg-amber-50 text-amber-500'
                                            : schedule.status === 'sent'
                                            ? 'bg-green-50 text-green-500'
                                            : 'bg-red-50 text-red-500'
                                    }`}>
                                        {schedule.status === 'pending' ? (
                                            <Timer size={24} />
                                        ) : schedule.status === 'sent' ? (
                                            <CheckCircle2 size={24} />
                                        ) : (
                                            <XCircle size={24} />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-3 text-center lg:text-left">
                                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                                            <div className="px-3 py-1 bg-slate-900 text-white rounded-full text-[8px] font-black uppercase tracking-widest">
                                                {schedule.status}
                                            </div>
                                            {schedule.recurrence && schedule.recurrence !== 'none' && (
                                                <div className="px-3 py-1 bg-blue-600 text-white rounded-full text-[8px] font-black uppercase tracking-widest">
                                                    {RECURRENCE_LABELS[schedule.recurrence]}
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            <h4 className="text-sm font-black text-slate-800 tracking-tight flex flex-col lg:flex-row lg:items-center gap-2 uppercase">
                                                <span className="text-slate-400">Scheduled for</span>
                                                {new Date(schedule.scheduledFor).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                            </h4>
                                            <div
                                                className="text-xs text-slate-500 font-medium line-clamp-1 prose prose-sm max-w-none italic"
                                                dangerouslySetInnerHTML={{ __html: schedule.content || 'No message content' }}
                                            />
                                        </div>

                                        {schedule.recurrenceEndDate && (
                                            <p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest flex items-center justify-center lg:justify-start gap-1.5">
                                                <Calendar size={10} />
                                                Ends: {new Date(schedule.recurrenceEndDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    {schedule.status === 'pending' && (
                                        <div className="lg:border-l lg:border-slate-50 lg:pl-6">
                                            <button
                                                onClick={() => handleCancel(schedule)}
                                                className="px-6 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-xl text-[10px] font-black transition-all flex items-center gap-2 border border-red-50"
                                            >
                                                <Trash2 size={16} />
                                                Terminate
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
