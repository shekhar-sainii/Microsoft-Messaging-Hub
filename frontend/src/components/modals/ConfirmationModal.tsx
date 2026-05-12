import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, Check, Trash2 } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger'
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl shadow-slate-900/20 border border-white overflow-hidden"
                    >
                        {/* Header Decoration */}
                        <div className={`h-2 w-full ${type === 'danger' ? 'bg-red-500' : type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                        
                        <div className="p-8">
                            <div className="flex items-start gap-5">
                                <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${type === 'danger' ? 'bg-red-50 text-red-600' : type === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                    <AlertCircle size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">{title}</h3>
                                    <p className="mt-2 text-sm text-slate-500 font-medium leading-relaxed">
                                        {message}
                                    </p>
                                </div>
                                <button 
                                    onClick={onClose}
                                    className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="mt-10 flex flex-col sm:flex-row-reverse gap-3">
                                <button
                                    onClick={() => {
                                        onConfirm();
                                        onClose();
                                    }}
                                    className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                        type === 'danger' 
                                        ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-200' 
                                        : type === 'warning'
                                        ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                                    }`}
                                >
                                    {type === 'danger' && <Trash2 size={14} />}
                                    {confirmText}
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                >
                                    {cancelText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
