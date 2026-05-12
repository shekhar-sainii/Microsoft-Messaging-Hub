import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, RefreshCw, Send, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCreateScheduleMutation } from '../schedulerApi';

// ── Zod Schema ────────────────────────────────────────────────────────────────
const scheduleSchema = z.object({
    teamId: z.string().min(1, 'Team ID is required'),
    channelId: z.string().min(1, 'Channel ID is required'),
    content: z.string().min(1, 'Content cannot be empty').max(28000, 'Payload exceeds limits'),
    scheduledFor: z.string().min(1, 'Target date/time required').refine(
        (val) => new Date(val) > new Date(),
        { message: 'Must specify a future timestamp' }
    ),
    recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']),
    recurrenceEndDate: z.string().optional(),
    timezone: z.string(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface ScheduleMessageFormProps {
    selectedChannel?: { teamId: string; channelId: string } | null;
    onSuccess?: () => void;
    initialContent?: string;
}

export const ScheduleMessageForm: React.FC<ScheduleMessageFormProps> = ({
    selectedChannel,
    onSuccess,
    initialContent = ''
}) => {
    const [createSchedule, { isLoading: isScheduling }] = useCreateScheduleMutation();

    // Safely auto-detect last visited channel from persistence if no prop provided
    const getCachedChannel = () => {
        if (selectedChannel) return selectedChannel;
        try {
            const cached = localStorage.getItem('selectedChannel');
            return cached ? JSON.parse(cached) : null;
        } catch {
            return null;
        }
    };

    const activeChannel = getCachedChannel();

    const {
        register,
        handleSubmit,
        watch,
        reset,
        setValue,
        formState: { errors },
    } = useForm<ScheduleFormData>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            teamId: activeChannel?.teamId || '',
            channelId: activeChannel?.channelId || '',
            content: initialContent,
            recurrence: 'none' as const,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
    });

    // Sync content if initialContent changes dynamically
    useEffect(() => {
        if (initialContent) {
            setValue('content', initialContent);
        }
    }, [initialContent, setValue]);

    const recurrence = watch('recurrence');

    const onSubmit = async (data: ScheduleFormData) => {
        try {
            await createSchedule({
                teamId: data.teamId,
                channelId: data.channelId,
                content: data.content,
                scheduledFor: new Date(data.scheduledFor).toISOString(),
                recurrence: data.recurrence,
                recurrenceEndDate: data.recurrenceEndDate
                    ? new Date(data.recurrenceEndDate).toISOString()
                    : undefined,
            }).unwrap();

            toast.success('Mission countdown initiated successfully', {
                icon: '⏱️',
                style: { borderRadius: '1rem', background: '#0f172a', color: '#fff' }
            });
            reset();
            onSuccess?.();
        } catch (error: any) {
            toast.error(error?.data?.error || error?.message || 'Failed to initialize dispatch schedule');
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-gradient-to-b from-white to-slate-50/50 rounded-[1.5rem] border border-slate-100 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-1.5 italic">
                    <Calendar size={14} className="text-amber-500" />
                    Mission Flight Plan
                </h3>
                {activeChannel && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100">
                        <Sparkles size={8} /> Target Locked
                    </span>
                )}
            </div>

            {/* Team ID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target Team ID</label>
                    <input
                        {...register('teamId')}
                        placeholder="e.g. 7a8d66fa-..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 outline-none placeholder:text-slate-300 bg-white"
                    />
                    {errors.teamId && <p className="text-[9px] text-red-500 font-bold mt-1">{errors.teamId.message}</p>}
                </div>

                {/* Channel ID */}
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Target Channel ID</label>
                    <input
                        {...register('channelId')}
                        placeholder="e.g. 19:b3UK..."
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 outline-none placeholder:text-slate-300 bg-white"
                    />
                    {errors.channelId && <p className="text-[9px] text-red-500 font-bold mt-1">{errors.channelId.message}</p>}
                </div>
            </div>

            {/* Message Content */}
            <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Broadcast Payload</label>
                <textarea
                    {...register('content')}
                    rows={3}
                    placeholder="Type initial mission dispatch template or plain message..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 outline-none resize-none placeholder:text-slate-300 bg-white"
                />
                {errors.content && <p className="text-[9px] text-red-500 font-bold mt-1">{errors.content.message}</p>}
            </div>

            {/* Schedule Date/Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
                        <Clock size={10} /> Launch Window
                    </label>
                    <input
                        {...register('scheduledFor')}
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 outline-none bg-white text-slate-800"
                    />
                    {errors.scheduledFor && <p className="text-[9px] text-red-500 font-bold mt-1">{errors.scheduledFor.message}</p>}
                </div>

                {/* Recurrence */}
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
                        <RefreshCw size={10} /> Mission Cadence
                    </label>
                    <select
                        {...register('recurrence')}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 outline-none bg-white text-slate-800"
                    >
                        <option value="none">Single Launch</option>
                        <option value="daily">Daily Pulse</option>
                        <option value="weekly">Weekly Sync</option>
                        <option value="monthly">Monthly Cycle</option>
                    </select>
                </div>
            </div>

            {/* Recurrence End Date */}
            {recurrence !== 'none' && (
                <div className="pt-1 animate-fadeIn">
                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block mb-1">Series Terminus Window (Optional)</label>
                    <input
                        {...register('recurrenceEndDate')}
                        type="datetime-local"
                        className="w-full px-3 py-2 border border-indigo-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none bg-indigo-50/20 text-indigo-900"
                    />
                </div>
            )}

            {/* Timezone hint */}
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400 px-1">
                <span>Relay Zone</span>
                <span className="text-slate-600 italic">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
            </div>

            <button
                type="submit"
                disabled={isScheduling}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:from-amber-600 hover:to-amber-700 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
                {isScheduling ? (
                    <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Transmitting sequence...
                    </>
                ) : (
                    <>
                        <Send size={12} /> Engage Schedule Relay
                    </>
                )}
            </button>
    </form>
  );
};
