import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Palette } from './Palette';
import { CardPreview } from './CardPreview';
import { JsonEditor } from './JsonEditor';
import { INITIAL_CARD_JSON } from '../constants';
import {
    Send, Trash2, Code2, Eye, PenTool, LayoutTemplate,
    X, Layers, ChevronRight, Smartphone, Monitor, CheckCircle2,
    AlertTriangle, Download, Copy, Search, MousePointer2, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemplates } from '../../../hooks/useTemplatesData';
import toast from 'react-hot-toast';

type PreviewMode = 'desktop' | 'mobile';

export const BuilderLayout = () => {
    const location = useLocation();
    const [cardJson, setCardJson] = useState<any>(INITIAL_CARD_JSON);
    const [jsonString, setJsonString] = useState(JSON.stringify(INITIAL_CARD_JSON, null, 2));
    const [showGallery, setShowGallery] = useState(false);
    const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
    const [isDragOver, setIsDragOver] = useState(false);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const editorRef = useRef<any>(null);
    const { data: templates } = useTemplates();

    // Load template from navigation state
    useEffect(() => {
        const state = location.state as { template?: any };
        if (state?.template) {
            const template = state.template;
            try {
                const content = typeof template.content === 'string'
                    ? JSON.parse(template.content)
                    : template.content;
                setCardJson(content);
                setJsonString(JSON.stringify(content, null, 2));
                toast.success(`Editing: ${template.name}`, { icon: '📝' });
            } catch (err) {
                console.error("Failed to parse template content", err);
            }
        }
    }, [location.state]);

    const updateCard = useCallback((newCard: any) => {
        setCardJson(newCard);
        const newJson = JSON.stringify(newCard, null, 2);
        setJsonString(newJson);
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
            setJsonError('Invalid JSON Structure');
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
            toast.success(`Injected ${elementData.type}`, { 
                icon: '🚀',
                style: { borderRadius: '12px', background: '#0f172a', color: '#fff' }
            });
        } catch {
            toast.error('Drop failed');
        }
    }, [cardJson, updateCard]);

    const scrollToElementInJson = (type: string, index: number) => {
        if (!editorRef.current) return;
        const model = editorRef.current.getModel();
        const matches = model.findMatches(type, false, false, false, null, true);
        
        // Find the Nth match of the type (approximate but works for most cases)
        if (matches && matches[index]) {
            const range = matches[index].range;
            editorRef.current.revealRangeInCenter(range);
            editorRef.current.setSelection(range);
            editorRef.current.focus();
        }
    };

    const removeBodyItem = (index: number) => {
        const newCard = { ...cardJson, body: cardJson.body.filter((_: any, i: number) => i !== index) };
        updateCard(newCard);
    };

    const removeAction = (index: number) => {
        const newCard = { ...cardJson, actions: cardJson.actions.filter((_: any, i: number) => i !== index) };
        updateCard(newCard);
    };

    const handleSend = async () => {
        const selectedChannelStr = localStorage.getItem('selectedChannel');
        const selectedChannel = selectedChannelStr ? JSON.parse(selectedChannelStr) : null;
        
        if (!selectedChannel) {
            toast.error('Global Context Missing: Select a channel from the navigator first');
            return;
        }

        const loadingToast = toast.loading('Syncing card with Teams Node...');
        try {
            const { apiClient } = await import('../../../api/apiClient');
            await apiClient.post('/messages/send', {
                teamId: selectedChannel.teamId,
                channelId: selectedChannel.channelId,
                content: '', 
                isAdaptiveCard: true,
                cardJson: cardJson
            });
            toast.success('Card Synchronized Successfully', { id: loadingToast });
        } catch (err: any) {
            toast.error(`Dispatch Failed: ${err.message}`, { id: loadingToast });
        }
    };

    const elementCount = (cardJson?.body?.length || 0) + (cardJson?.actions?.length || 0);

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden -m-10">
            {/* Design Header */}
            <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                        <PenTool size={20} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-800 tracking-tighter uppercase italic">Card Architecture</h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">v1.4 Spec</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{elementCount} Nodes Active</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1 border border-slate-200 shadow-inner">
                        <button
                            onClick={() => setPreviewMode('desktop')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${previewMode === 'desktop' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Monitor size={14} /> Desktop
                        </button>
                        <button
                            onClick={() => setPreviewMode('mobile')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${previewMode === 'mobile' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Smartphone size={14} /> Mobile
                        </button>
                    </div>

                    <div className="w-px h-6 bg-slate-200 mx-2" />

                    <button
                        onClick={() => setShowGallery(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
                    >
                        <LayoutTemplate size={14} /> Library
                    </button>

                    <button
                        onClick={handleSend}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
                    >
                        <Send size={14} /> Dispatch
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Element Palette */}
                <div className="w-72 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-2xl z-10 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Layers size={16} className="text-blue-600" />
                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Components</span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">Drag to architecture canvas</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        <Palette />
                    </div>
                </div>

                {/* Live Canvas */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
                    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm z-10">
                        <div className="flex items-center gap-2">
                            <Eye size={16} className="text-blue-500" />
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em]">Live Rendering</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${jsonError ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                           {jsonError ? 'Architecture Error' : 'Structure Verified'}
                        </div>
                    </div>

                    <div
                        className="flex-1 overflow-y-auto p-12 custom-scrollbar relative"
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={onDrop}
                    >
                        <div className={`mx-auto transition-all duration-500 ease-out ${previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-[700px]'}`}>
                            <div className={`bg-white rounded-[2.5rem] shadow-2xl border-2 transition-all duration-500 overflow-hidden ${isDragOver ? 'border-blue-400 scale-[1.02] shadow-blue-200' : 'border-slate-100'}`}>
                                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/30">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                            TH
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight italic">Teams Hub Architecture</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                <Sparkles size={10} className="text-blue-400" /> Instant Dispatch
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                       <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                       <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                    </div>
                                </div>

                                <div className="p-8">
                                    <CardPreview cardJson={cardJson} />
                                </div>
                            </div>

                            <AnimatePresence>
                                {isDragOver && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="mt-6 p-6 border-2 border-dashed border-blue-400 rounded-3xl bg-blue-50/50 text-center backdrop-blur-sm"
                                    >
                                        <MousePointer2 size={24} className="text-blue-600 mx-auto mb-2 animate-bounce" />
                                        <p className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Drop to Integrate Node</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Node Inspector */}
                            <div className="mt-8 space-y-3 pb-20">
                                <div className="flex items-center gap-2 px-2 mb-4">
                                    <LayoutTemplate size={14} className="text-slate-400" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Canvas Structure</span>
                                </div>
                                
                                {cardJson?.body?.map((item: any, i: number) => (
                                    <motion.div 
                                        layout
                                        key={`body-${i}`} 
                                        className="flex items-center justify-between pl-4 pr-2 py-3 bg-white rounded-2xl border border-slate-100 group hover:border-blue-400 hover:shadow-lg hover:shadow-blue-50 transition-all cursor-pointer"
                                        onClick={() => scrollToElementInJson(item.type, i)}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                                                <span className="text-[10px] font-black text-blue-600">{i + 1}</span>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{item.type}</p>
                                                {item.text && <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{item.text}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); scrollToElementInJson(item.type, i); }}
                                                className="p-2 text-slate-300 hover:text-blue-600 transition-all rounded-lg"
                                                title="Locate in JSON"
                                            >
                                                <Search size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeBodyItem(i); }}
                                                className="p-2 text-slate-300 hover:text-rose-500 transition-all rounded-lg"
                                                title="Remove Node"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* JSON Architecture Editor */}
                <div className="w-[480px] flex-shrink-0 bg-[#0f172a] flex flex-col overflow-hidden shadow-3xl z-20">
                    <JsonEditor 
                        value={jsonString} 
                        onChange={handleJsonChange} 
                        onMount={(editor) => { editorRef.current = editor; }}
                    />
                </div>
            </div>
        </div>
    );
};
