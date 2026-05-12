import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Hash, PenTool, Globe, Clock, MessageSquare, ArrowRight, ShieldCheck, Zap, X } from 'lucide-react';
import { MessageComposer } from '../features/composer/components/MessageComposer';
import { useSendMessageMutation } from '../features/messages/messagesApi';
import { useGetTeamMembersQuery } from '../features/teams/teamsApi';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { ScheduleMessageForm } from '../features/scheduler/components/ScheduleMessageForm';

export const WorkspacePage: React.FC = () => {
    const { teamId, channelId } = useParams<{ teamId: string, channelId: string }>();
    const navigate = useNavigate();
    const [sendMessage] = useSendMessageMutation();
    const { data: teamMembers } = useGetTeamMembersQuery(teamId || skipToken);
    const [scheduleModal, setScheduleModal] = React.useState<{ isOpen: boolean; content: string }>({
        isOpen: false,
        content: '',
    });

    if (!teamId || !channelId) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-8 py-20">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative"
                >
                    <div className="absolute inset-0 bg-blue-500 blur-[60px] opacity-20 rounded-full animate-pulse" />
                    <div className="w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center relative z-10 border border-slate-100 group">
                         <MessageSquare size={40} className="text-blue-600 group-hover:rotate-12 transition-transform duration-500" />
                    </div>
                </motion.div>

                <div className="text-center space-y-2 max-w-xl px-6 relative z-10">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Ready to connect?</h3>
                    <p className="text-slate-400 font-bold text-sm leading-relaxed">
                        Select a workspace and channel from the navigator to begin broadcasting.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl px-6">
                    {[
                        { icon: Zap, title: "Real-time", desc: "Instant MS Teams Sync" },
                        { icon: ShieldCheck, title: "Secure", desc: "Enterprise Encryption" },
                        { icon: Globe, title: "Global", desc: "Multi-tenant Broadcast" }
                    ].map((feature, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 + 0.3 }}
                            className="bg-white p-4 rounded-2xl flex flex-col items-center text-center space-y-2 border border-slate-100 shadow-sm"
                        >
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                                <feature.icon size={16} />
                            </div>
                            <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-widest">{feature.title}</h4>
                            <p className="text-[10px] text-slate-400 font-bold leading-tight">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-[9px] bg-blue-50 px-4 py-2 rounded-full border border-blue-100"
                >
                    <ArrowRight size={12} className="animate-pulse" />
                    Use the sidebar to explore your network
                </motion.div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-8">
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-xl"
            >
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[40%] bg-blue-500 rounded-full blur-[100px]" />
                </div>
                
                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white/5 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-500">
                            <Hash size={32} className="text-blue-400" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded text-[8px] font-black uppercase tracking-widest">Active Node</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            </div>
                            <h3 className="text-xl font-black tracking-tight leading-none uppercase italic text-white">Communication Channel</h3>
                            <p className="text-slate-300 font-bold text-[10px] tracking-widest uppercase flex items-center gap-2">
                                <Globe size={12} className="text-blue-400" />
                                Microsoft Graph Sync Operational
                            </p>
                        </div>
                    </div>
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate('/builder')}
                        className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black hover:bg-slate-50 transition-all shadow-xl text-xs flex items-center gap-2"
                    >
                        <PenTool size={18} />
                        Card Designer
                    </motion.button>
                </div>
            </motion.div>
            
            <div className="max-w-4xl mx-auto w-full">
                <MessageComposer 
                    teamMembers={teamMembers || []}
                    onSend={(html, mentions, options) => {
                        if (teamId && channelId) {
                            sendMessage({
                                teamId,
                                channelId,
                                content: html,
                                mentions,
                                ...options
                            });
                        }
                    }}
                    onSchedule={(html) => {
                        setScheduleModal({ isOpen: true, content: html });
                    }}
                />
            </div>

            <div className="flex items-center justify-center gap-3 text-slate-300 font-black uppercase tracking-[0.3em] text-[9px] pt-8">
                <Zap size={12} className="text-amber-500" />
                Live Broadcast Node Operational
            </div>

            {/* Modal Overlay for Instant Scheduling from Composer */}
            <AnimatePresence>
                {scheduleModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
                            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden relative border border-slate-100 max-h-[90vh] flex flex-col"
                        >
                            <button
                                onClick={() => setScheduleModal({ isOpen: false, content: '' })}
                                className="absolute top-5 right-5 z-20 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                <X size={16} />
                            </button>
                            <div className="overflow-y-auto custom-scrollbar p-1">
                                <ScheduleMessageForm 
                                    selectedChannel={{ teamId: teamId || '', channelId: channelId || '' }}
                                    initialContent={scheduleModal.content}
                                    onSuccess={() => setScheduleModal({ isOpen: false, content: '' })} 
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
