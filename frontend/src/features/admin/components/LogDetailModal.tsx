import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, User, Calendar, ShieldCheck, Terminal, Code } from 'lucide-react';

interface LogDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    log: any;
}

export const LogDetailModal: React.FC<LogDetailModalProps> = ({ isOpen, onClose, log }) => {
    if (!log) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
                                    log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'
                                }`}>
                                    <Activity size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Event Intelligence</h3>
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Trace ID: {log._id}</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose}
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 transition-all hover:rotate-90"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <ShieldCheck size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Operation</span>
                                    </div>
                                    <p className="text-xs font-black text-slate-900 uppercase">{log.eventType?.replace('_', ' ')}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Calendar size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Timestamp</span>
                                    </div>
                                    <p className="text-xs font-black text-slate-900">{new Date(log.createdAt).toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <User size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Actor ID</span>
                                    </div>
                                    <p className="text-xs font-black text-slate-900 truncate">{log.userId || 'System Daemons'}</p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                    <div className="flex items-center gap-2 text-slate-400">
                                        <Terminal size={14} />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Status Code</span>
                                    </div>
                                    <p className={`text-xs font-black uppercase ${
                                        log.status === 'success' ? 'text-emerald-600' : 'text-red-600'
                                    }`}>{log.status}</p>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="space-y-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Activity size={12} className="text-blue-500" />
                                    Execution Metadata
                                </h4>
                                <div className="p-6 bg-slate-900 rounded-3xl border border-white/5 shadow-inner">
                                    <p className="text-slate-300 text-xs font-medium leading-relaxed italic">
                                        "{log.details}"
                                    </p>
                                </div>
                            </div>

                            {/* Payload Section */}
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Code size={12} className="text-indigo-500" />
                                        Resource Payload
                                    </h4>
                                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 overflow-x-auto">
                                        <pre className="text-[10px] font-bold text-slate-600 leading-normal">
                                            {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-end">
                            <button 
                                onClick={onClose}
                                className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg"
                            >
                                Close Intelligence
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
