import React, { useState, useCallback, useEffect } from 'react';
import { Palette } from './Palette';
import { CardPreview } from './CardPreview';
import { JsonEditor } from './JsonEditor';
import { INITIAL_CARD_JSON } from '../constants';
import {
    Send, Trash2, Code2, Eye, PenTool, LayoutTemplate,
    X, Layers, ChevronRight, Smartphone, Monitor, CheckCircle2,
    AlertTriangle, Download, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemplates } from '../../../hooks/useTemplatesData';
import toast from 'react-hot-toast';

type PreviewMode = 'desktop' | 'mobile';

export const BuilderLayout = () => {
    const [cardJson, setCardJson] = useState<any>(INITIAL_CARD_JSON);
    const [jsonString, setJsonString] = useState(JSON.stringify(INITIAL_CARD_JSON, null, 2));
    const [showGallery, setShowGallery] = useState(false);
    const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
    const [isDragOver, setIsDragOver] = useState(false);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const { data: templates } = useTemplates();

    // Enforce v1.4
    useEffect(() => {
        if (cardJson?.version && parseFloat(cardJson.version) > 1.4) {
            toast.error('Graph API max version is 1.4 — reverted', { id: 'version-warn' });
            const fixed = { ...cardJson, version: '1.4' };
            setCardJson(fixed);
            setJsonString(JSON.stringify(fixed, null, 2));
        }
    }, [cardJson]);

    const updateCard = useCallback((newCard: any) => {
        setCardJson(newCard);
        setJsonString(JSON.stringify(newCard, null, 2));
        setJsonError(null);
    }, []);

    const handleJsonChange = useCallback((value: string | undefined) => {
        if (!value) return;
        setJsonString(value);
        try {
            const parsed = JSON.parse(value);
            setCardJson(parsed);
            setJsonError(null);
        } catch (e: any) {
            setJsonError('Invalid JSON');
        }
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        try {
            const elementData = JSON.parse(e.dataTransfer.getData('application/json'));
            const isAction = elementData.type?.startsWith('Action.');
            const newCard = {
                ...cardJson,
                body: isAction ? (cardJson.body || []) : [...(cardJson.body || []), elementData],
                actions: isAction
                    ? [...(cardJson.actions || []), elementData]
                    : (cardJson.actions || []),
            };
            updateCard(newCard);
            toast.success(`Added ${elementData.type}`, { icon: '✅' });
        } catch {
            toast.error('Drop failed');
        }
    }, [cardJson, updateCard]);

    const removeBodyItem = (index: number) => {
        const newCard = { ...cardJson, body: cardJson.body.filter((_: any, i: number) => i !== index) };
        updateCard(newCard);
    };

    const removeAction = (index: number) => {
        const newCard = { ...cardJson, actions: cardJson.actions.filter((_: any, i: number) => i !== index) };
        updateCard(newCard);
    };

    const copyJson = () => {
        navigator.clipboard.writeText(jsonString);
        toast.success('JSON copied to clipboard');
    };

    const downloadJson = () => {
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'adaptive-card.json';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Downloaded adaptive-card.json');
    };

    const selectTemplate = (template: any) => {
        try {
            const content = typeof template.content === 'string'
                ? JSON.parse(template.content)
                : template.content;
            updateCard(content);
            setShowGallery(false);
            toast.success(`Loaded: ${template.name}`);
        } catch {
            toast.error('Failed to load template');
        }
    };

    const elementCount = (cardJson?.body?.length || 0) + (cardJson?.actions?.length || 0);

    return (
        <div className="flex flex-col h-full bg-slate-50 overflow-hidden -m-10">

            {/* ── Top Bar ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <PenTool size={18} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-800 tracking-tight">Adaptive Card Designer</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-medium">Graph API</span>
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">v1.4 MAX</span>
                            <span className="text-[10px] text-slate-300">•</span>
                            <span className="text-[10px] text-slate-400">{elementCount} element{elementCount !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Preview mode toggle */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-1 gap-1">
                        <button
                            onClick={() => setPreviewMode('desktop')}
                            className={`p-1.5 rounded-md transition-all ${previewMode === 'desktop' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Desktop preview"
                        >
                            <Monitor size={14} />
                        </button>
                        <button
                            onClick={() => setPreviewMode('mobile')}
                            className={`p-1.5 rounded-md transition-all ${previewMode === 'mobile' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Mobile preview"
                        >
                            <Smartphone size={14} />
                        </button>
                    </div>

                    <div className="w-px h-6 bg-slate-200" />

                    <button
                        onClick={() => setShowGallery(true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold transition-all"
                    >
                        <LayoutTemplate size={14} />
                        Templates
                    </button>

                    <button
                        onClick={copyJson}
                        className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-bold transition-all"
                    >
                        <Copy size={14} />
                        Copy JSON
                    </button>

                    <button
                        onClick={downloadJson}
                        className="flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs font-bold transition-all"
                    >
                        <Download size={14} />
                        Export
                    </button>

                    <button
                        onClick={() => updateCard({ ...INITIAL_CARD_JSON })}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Clear canvas"
                    >
                        <Trash2 size={16} />
                    </button>

                    <button
                        onClick={() => toast.success('Select a channel from the sidebar to send')}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-black hover:bg-blue-700 shadow-md shadow-blue-200 transition-all active:scale-95"
                    >
                        <Send size={14} />
                        Send to Teams
                    </button>
                </div>
            </div>

            {/* ── Main 3-Panel Layout ──────────────────────────────────────── */}
            <div className="flex flex-1 overflow-hidden">

                {/* Left: Element Palette */}
                <div className="w-60 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Layers size={14} className="text-blue-600" />
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">Elements</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Drag onto canvas to add</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                        <Palette />
                    </div>
                </div>

                {/* Center: Canvas */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-100">
                    <div className="flex items-center justify-between px-5 py-2.5 bg-white border-b border-slate-200">
                        <div className="flex items-center gap-2">
                            <Eye size={14} className="text-slate-400" />
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Live Preview</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {jsonError ? (
                                <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold">
                                    <AlertTriangle size={12} />
                                    {jsonError}
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-green-600 text-[10px] font-bold">
                                    <CheckCircle2 size={12} />
                                    Valid
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Drop Zone */}
                    <div
                        className="flex-1 overflow-y-auto p-6 custom-scrollbar"
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={onDrop}
                    >
                        <div className={`mx-auto transition-all duration-200 ${previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-[600px]'}`}>

                            {/* Teams-like card wrapper */}
                            <div className={`bg-white rounded-2xl shadow-lg border-2 transition-all duration-200 overflow-hidden ${isDragOver ? 'border-blue-400 shadow-blue-100 shadow-xl' : 'border-slate-200'}`}>
                                {/* Teams message header */}
                                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                                        TH
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-slate-700">Teams Hub Bot</p>
                                        <p className="text-[10px] text-slate-400">Just now · #general</p>
                                    </div>
                                </div>

                                {/* Card preview */}
                                <div className="p-4">
                                    <CardPreview cardJson={cardJson} />
                                </div>
                            </div>

                            {/* Drop hint */}
                            {isDragOver && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-3 p-3 border-2 border-dashed border-blue-400 rounded-xl bg-blue-50 text-center"
                                >
                                    <p className="text-xs font-bold text-blue-600">Drop to add element</p>
                                </motion.div>
                            )}

                            {/* Element list (body) */}
                            {cardJson?.body?.length > 0 && (
                                <div className="mt-4 space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Body Elements</p>
                                    {cardJson.body.map((item: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-100 group hover:border-blue-200 transition-all">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-blue-50 flex items-center justify-center">
                                                    <span className="text-[9px] font-black text-blue-600">{i + 1}</span>
                                                </div>
                                                <span className="text-xs font-bold text-slate-600">{item.type}</span>
                                                {item.text && <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{item.text}</span>}
                                            </div>
                                            <button
                                                onClick={() => removeBodyItem(i)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all rounded"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Actions list */}
                            {cardJson?.actions?.length > 0 && (
                                <div className="mt-3 space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Actions</p>
                                    {cardJson.actions.map((action: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-100 group hover:border-blue-200 transition-all">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-green-50 flex items-center justify-center">
                                                    <ChevronRight size={10} className="text-green-600" />
                                                </div>
                                                <span className="text-xs font-bold text-slate-600">{action.title || action.type}</span>
                                                <span className="text-[10px] text-slate-400">{action.type}</span>
                                            </div>
                                            <button
                                                onClick={() => removeAction(i)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all rounded"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Empty state */}
                            {elementCount === 0 && !isDragOver && (
                                <div className="mt-4 p-8 border-2 border-dashed border-slate-200 rounded-xl text-center">
                                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <Layers size={24} className="text-slate-300" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-400">Drag elements here</p>
                                    <p className="text-xs text-slate-300 mt-1">or load a template to get started</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: JSON Editor */}
                <div className="w-[380px] flex-shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <Code2 size={14} className="text-slate-400" />
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-widest">JSON Schema</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {jsonError ? (
                                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">Error</span>
                            ) : (
                                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">Valid JSON</span>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <JsonEditor value={jsonString} onChange={handleJsonChange} />
                    </div>
                </div>
            </div>

            {/* ── Template Gallery Modal ───────────────────────────────────── */}
            <AnimatePresence>
                {showGallery && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ duration: 0.15 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[75vh] flex flex-col overflow-hidden border border-slate-200"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">Template Gallery</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Pick a template to start from</p>
                                </div>
                                <button
                                    onClick={() => setShowGallery(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 custom-scrollbar">
                                {templates && templates.length > 0 ? (
                                    templates.map((template: any) => (
                                        <button
                                            key={template._id}
                                            onClick={() => selectTemplate(template)}
                                            className="text-left p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-all group"
                                        >
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all mb-3">
                                                <LayoutTemplate size={18} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                                                {template.name}
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                                                {template.description || template.category}
                                            </p>
                                        </button>
                                    ))
                                ) : (
                                    <div className="col-span-full py-16 text-center">
                                        <LayoutTemplate size={32} className="text-slate-200 mx-auto mb-3" />
                                        <p className="text-sm font-bold text-slate-400">No templates yet</p>
                                        <p className="text-xs text-slate-300 mt-1">Run the seed script to add sample templates</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
