import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient } from '../../../api/apiClient';
import { useQueryClient } from '@tanstack/react-query';

// ── Zod Schema ────────────────────────────────────────────────────────────────
const scheduleSchema = z.object({
    teamId: z.string().min(1, 'Team is required'),
    channelId: z.string().min(1, 'Channel is required'),
    content: z.string().min(1, 'Message content is required').max(28000, 'Message exceeds 28KB limit'),
    scheduledFor: z.string().min(1, 'Schedule date/time is required').refine(
        (val) => new Date(val) > new Date(),
        { message: 'Scheduled time must be in the future' }
    ),
    recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']),
    recurrenceEndDate: z.string().optional(),
    timezone: z.string(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface ScheduleMessageFormProps {
    selectedChannel?: { teamId: string; channelId: string } | null;
    onSuccess?: () => void;
}

export const ScheduleMessageForm: React.FC<ScheduleMessageFormProps> = ({
    selectedChannel,
    onSuccess,
}) => {
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ScheduleFormData>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            teamId: selectedChannel?.teamId || '',
            channelId: selectedChannel?.channelId || '',
            recurrence: 'none' as const,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
    });

    const recurrence = watch('recurrence');

    const onSubmit = async (data: ScheduleFormData) => {
        try {
            await apiClient.post('/schedule', {
                ...data,
                scheduledFor: new Date(data.scheduledFor).toISOString(),
                recurrenceEndDate: data.recurrenceEndDate
                    ? new Date(data.recurrenceEndDate).toISOString()
                    : undefined,
            });
            toast.success('Message scheduled successfully');
            queryClient.invalidateQueries({ queryKey: ['scheduler'] });
            reset();
            onSuccess?.();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to schedule message');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                Schedule a Message
            </h3>

            {/* Team ID */}
            <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Team ID</label>
                <input
                    {...register('teamId')}
                    placeholder="Team ID"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {errors.teamId && <p className="text-xs text-red-500 mt-1">{errors.teamId.message}</p>}
            </div>

            {/* Channel ID */}
            <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Channel ID</label>
                <input
                    {...register('channelId')}
                    placeholder="Channel ID"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {errors.channelId && <p className="text-xs text-red-500 mt-1">{errors.channelId.message}</p>}
            </div>

            {/* Message Content */}
            <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Message</label>
                <textarea
                    {...register('content')}
                    rows={3}
                    placeholder="Enter your message..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
                {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content.message}</p>}
            </div>

            {/* Schedule Date/Time */}
            <div>
                <label className="text-xs font-bold text-slate-600 block mb-1 flex items-center gap-1">
                    <Clock size={12} />
                    Schedule Date & Time
                </label>
                <input
                    {...register('scheduledFor')}
                    type="datetime-local"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                {errors.scheduledFor && <p className="text-xs text-red-500 mt-1">{errors.scheduledFor.message}</p>}
            </div>

            {/* Timezone */}
            <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Timezone</label>
                <input
                    {...register('timezone')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                    readOnly
                />
            </div>

            {/* Recurrence */}
            <div>
                <label className="text-xs font-bold text-slate-600 block mb-1 flex items-center gap-1">
                    <RefreshCw size={12} />
                    Recurrence
                </label>
                <select
                    {...register('recurrence')}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                    <option value="none">One-time</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
            </div>

            {/* Recurrence End Date */}
            {recurrence !== 'none' && (
                <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Series End Date (optional)</label>
                    <input
                        {...register('recurrenceEndDate')}
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            )}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
                {isSubmitting ? 'Scheduling...' : 'Schedule Message'}
            </button>
        </form>
    );
};
