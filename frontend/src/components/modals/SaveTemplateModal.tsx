import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, FileText } from 'lucide-react';

interface SaveTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; description: string }) => void;
    initialData?: { name?: string; description?: string };
    isSaving?: boolean;
}

export const SaveTemplateModal: React.FC<SaveTemplateModalProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    isSaving = false
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(initialData?.name || '');
            setDescription(initialData?.description || '');
            setError('');
        }
    }, [isOpen, initialData]);

    const handleSave = () => {
        if (!name.trim()) {
            setError('Template name is required');
            return;
        }
        if (name.length < 3) {
            setError('Name must be at least 3 characters long');
            return;
        }
        
        onSave({ name: name.trim(), description: description.trim() });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isSaving ? onClose : undefined}
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
                        <div className="h-2 w-full bg-indigo-500" />
                        
                        <div className="p-8">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600">
                                        <Save size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Save Asset</h3>
                                        <p className="text-xs text-slate-500 font-medium">Store template to repository</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={!isSaving ? onClose : undefined}
                                    className="text-slate-400 hover:text-slate-600 transition-colors p-1 disabled:opacity-50"
                                    disabled={isSaving}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Asset Name <span className="text-red-500">*</span></label>
                                    <div className="relative">
                                        <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => {
                                                setName(e.target.value);
                                                if (error) setError('');
                                            }}
                                            disabled={isSaving}
                                            placeholder="e.g., Daily Standup Report"
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-70"
                                            autoFocus
                                        />
                                    </div>
                                    {error && <p className="text-xs text-red-500 mt-1.5 ml-1 font-medium">{error}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Documentation (Optional)</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        disabled={isSaving}
                                        placeholder="Brief description of when and how to use this asset..."
                                        rows={3}
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none disabled:opacity-70"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 flex flex-col sm:flex-row-reverse gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <span className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Saving...
                                        </span>
                                    ) : (
                                        <>
                                            <Save size={14} />
                                            Save to Repository
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={onClose}
                                    disabled={isSaving}
                                    className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
