import { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Palette } from './Palette';
import { CardPreview } from './CardPreview';
import { JsonEditor } from './JsonEditor';
import { INITIAL_CARD_JSON } from '../constants';
import {
    Send, Trash2, Code2, Eye, PenTool, LayoutTemplate,
    X, Layers, ChevronRight, Smartphone, Monitor, CheckCircle2,
    AlertTriangle, Download, Copy, Search, MousePointer2, Sparkles,
    ChevronDown, ChevronUp, Save, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTemplates } from '../../../hooks/useTemplatesData';
import { useCreateTemplateMutation, useUpdateTemplateMutation } from '../../templates/templatesApi';
import { SaveTemplateModal } from '../../../components/modals/SaveTemplateModal';
import { ScheduleMessageForm } from '../../scheduler/components/ScheduleMessageForm';
import toast from 'react-hot-toast';
import { useGetTeamsQuery, useGetChannelsQuery } from '../../teams/teamsApi';

type PreviewMode = 'desktop' | 'mobile';

export const BuilderLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [cardJson, setCardJson] = useState<any>(INITIAL_CARD_JSON);
    const [jsonString, setJsonString] = useState(JSON.stringify(INITIAL_CARD_JSON, null, 2));
    const [showGallery, setShowGallery] = useState(false);
    const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
    const [isDragOver, setIsDragOver] = useState(false);
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [isJsonOpen, setIsJsonOpen] = useState(false);
    const editorRef = useRef<any>(null);
    const { data: templates } = useTemplates();
    
    // Save functionality state
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
    const [templateMeta, setTemplateMeta] = useState<{name: string, description: string}>({ name: '', description: '' });
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [isDispatchOpen, setIsDispatchOpen] = useState(false);
    const [selectedTargetTeam, setSelectedTargetTeam] = useState<string | null>(null);
    const [selectedTargetChannel, setSelectedTargetChannel] = useState<string | null>(null);
    const [confirmTargetChannel, setConfirmTargetChannel] = useState<{ id: string, name: string } | null>(null);
    const { data: teamsList, isLoading: isTeamsLoading } = useGetTeamsQuery();
    const { data: channelsList, isLoading: isChannelsLoading } = useGetChannelsQuery(selectedTargetTeam || '', {
        skip: !selectedTargetTeam
    });
    
    const [createTemplate, { isLoading: isCreating }] = useCreateTemplateMutation();
    const [updateTemplate, { isLoading: isUpdating }] = useUpdateTemplateMutation();

    // Load template from navigation state
    useEffect(() => {
        const state = location.state as { template?: any };
        if (state?.template) {
            const template = state.template;
            setEditingTemplateId(template._id);
            setTemplateMeta({ name: template.name, description: template.description || '' });
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
        setIsJsonOpen(true);
        setTimeout(() => {
            if (!editorRef.current) return;
            const model = editorRef.current.getModel();
            const matches = model.findMatches(type, false, false, false, null, true);
            
            if (matches && matches[index]) {
                const range = matches[index].range;
                editorRef.current.revealRangeInCenter(range);
                editorRef.current.setSelection(range);
                editorRef.current.focus();
            }
        }, 300);
    };

    const removeBodyItem = (index: number) => {
        const newCard = { ...cardJson, body: cardJson.body.filter((_: any, i: number) => i !== index) };
        updateCard(newCard);
    };

    const handleSend = async (customTeamId?: string, customChannelId?: string) => {
        let tId = customTeamId;
        let cId = customChannelId;
        
        if (!tId || !cId) {
            const selectedChannelStr = localStorage.getItem('selectedChannel');
            const selectedChannel = selectedChannelStr ? JSON.parse(selectedChannelStr) : null;
            if (!selectedChannel) {
                toast.error('Global Context Missing: Select a destination team/channel');
                return;
            }
            tId = selectedChannel.teamId;
            cId = selectedChannel.channelId;
        }

        const loadingToast = toast.loading('Syncing card with Teams Node...');
        try {
            const { apiClient } = await import('../../../api/apiClient');
            await apiClient.post('/messages/send', {
                teamId: tId,
                channelId: cId,
                content: '', 
                isAdaptiveCard: true,
                cardJson: cardJson
            });
            toast.success('Card Synchronized Successfully', { id: loadingToast });
            setIsDispatchOpen(false);
            setConfirmTargetChannel(null);
            setSelectedTargetChannel(null);
        } catch (err: any) {
            toast.error(`Dispatch Failed: ${err.message}`, { id: loadingToast });
        }
    };

    const handleSaveTemplate = async (meta: { name: string, description: string }) => {
        const payload = {
            name: meta.name,
            description: meta.description,
            type: 'adaptive_card' as const,
            content: JSON.stringify(cardJson),
            tags: ['card', 'builder']
        };

        try {
            if (editingTemplateId && !editingTemplateId.startsWith('pb-')) {
                await updateTemplate({ id: editingTemplateId, template: payload }).unwrap();
                toast.success('Asset updated successfully!');
            } else {
                await createTemplate(payload).unwrap();
                toast.success('Asset saved to repository!');
            }
            setIsSaveModalOpen(false);
            // Navigate back to the templates library after a short delay
            setTimeout(() => navigate('/templates'), 800);
        } catch (err: any) {
            toast.error(`Failed to save: ${err.data?.message || err.message}`);
        }
    };

    const elementCount = (cardJson?.body?.length || 0) + (cardJson?.actions?.length || 0);

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden -m-10">
            {/* Save Modal */}
            <SaveTemplateModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleSaveTemplate}
                initialData={templateMeta}
                isSaving={isCreating || isUpdating}
            />

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
                        onClick={() => setIsJsonOpen(!isJsonOpen)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm ${isJsonOpen ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                        <Code2 size={14} /> {isJsonOpen ? 'Close Editor' : 'Open Editor'}
                    </button>

                    <button
                        onClick={() => setIsSaveModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95"
                    >
                        <Save size={14} /> Save Asset
                    </button>

                    <button
                        onClick={() => setIsScheduleOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-100 transition-all active:scale-95"
                    >
                        <Calendar size={14} /> Schedule
                    </button>

                    <button
                        onClick={() => setIsDispatchOpen(true)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
                    >
                        <Send size={14} /> Dispatch
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">
                {/* Element Palette (Left Sidebar) */}
                <div className="w-80 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col shadow-2xl z-10 overflow-hidden">
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

                {/* Main Workspace (Canvas Top, JSON Bottom) */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Live Canvas Area */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50">
                        <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm z-10">
                            <div className="flex items-center gap-2">
                                <Eye size={16} className="text-blue-500" />
                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.2em]">Live Architecture Canvas</span>
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
                            <div className={`mx-auto transition-all duration-500 ease-out ${previewMode === 'mobile' ? 'max-w-[375px]' : 'max-w-4xl'}`}>
                                <div className={`bg-white rounded-[2.5rem] shadow-2xl border-2 transition-all duration-500 overflow-hidden ${isDragOver ? 'border-blue-400 scale-[1.01] shadow-blue-200' : 'border-slate-100'}`}>
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/30">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                                TH
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-800 uppercase tracking-tight italic">Adaptive Content Preview</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                                                    <Sparkles size={10} className="text-blue-400" /> Professional Grade
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                           <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                           <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                        </div>
                                    </div>

                                    <div className="p-10">
                                        <CardPreview cardJson={cardJson} />
                                    </div>
                                </div>

                                {isDragOver && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className="mt-6 p-6 border-2 border-dashed border-blue-400 rounded-3xl bg-blue-50/50 text-center backdrop-blur-sm"
                                    >
                                        <MousePointer2 size={24} className="text-blue-600 mx-auto mb-2 animate-bounce" />
                                        <p className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Drop to Integrate Node</p>
                                    </motion.div>
                                )}

                                {/* Node Inspector (Quick List) */}
                                <div className="mt-12 space-y-3 pb-20">
                                    <div className="flex items-center gap-2 px-2 mb-4">
                                        <LayoutTemplate size={14} className="text-slate-900" />
                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em]">Component Hierarchy</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {cardJson?.body?.map((item: any, i: number) => (
                                            <motion.div 
                                                layout
                                                key={`body-${i}`} 
                                                className="flex items-center justify-between pl-4 pr-2 py-3 bg-white rounded-2xl border border-slate-100 group hover:border-blue-400 hover:shadow-lg hover:shadow-blue-50 transition-all cursor-pointer"
                                                onClick={() => scrollToElementInJson(item.type, i)}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                                                        <span className="text-[10px] font-black text-blue-600">{i + 1}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{item.type}</p>
                                                        {item.text && <p className="text-[9px] text-slate-400 font-medium truncate max-w-[150px]">{item.text}</p>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); scrollToElementInJson(item.type, i); }}
                                                        className="p-1.5 text-slate-900 hover:text-blue-600 transition-all"
                                                    >
                                                        <Search size={14} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeBodyItem(i); }}
                                                        className="p-1.5 text-slate-900 hover:text-rose-500 transition-all"
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
                    </div>

                    {/* Premium Immersive Wide Screen JSON Source Schema & Preview Popup Modal */}
                    <AnimatePresence>
                        {isJsonOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 lg:p-8 bg-slate-950/80 backdrop-blur-xl">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                    transition={{ type: "spring", duration: 0.5, bounce: 0.05 }}
                                    className="w-full max-w-7xl h-[90vh] bg-[#0f172a] rounded-[2.5rem] shadow-2xl border border-slate-800 flex flex-col overflow-hidden relative"
                                >
                                    {/* Modal Top Bar */}
                                    <div className="px-8 py-4 bg-[#1e293b] flex items-center justify-between border-b border-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                <Code2 size={16} className="text-blue-400" />
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black text-white uppercase tracking-wider italic">JSON Source Schema Workshop</h3>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Parallel Synchronization Active</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${jsonError ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                                {jsonError ? 'Schema Payload Error' : 'JSON Engine 100% Verified'}
                                            </div>
                                            <button 
                                                onClick={() => setIsJsonOpen(false)}
                                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/30 active:scale-95 flex items-center gap-2"
                                            >
                                                Apply & Close Workshop
                                            </button>
                                        </div>
                                    </div>

                                    {/* Split Screen Layout Container */}
                                    <div className="flex flex-1 overflow-hidden">
                                        {/* Left Side: Real-Time Auto-Scaling Card Preview */}
                                        <div className="w-1/2 bg-slate-950 border-r border-slate-800 p-8 flex flex-col overflow-y-auto custom-scrollbar relative">
                                            <div className="flex items-center justify-between mb-6">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2.5">
                                                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" /> Live Rendering Canvas
                                                </span>
                                                <span className="text-[9px] font-bold text-slate-600 uppercase font-mono">Output Sandbox</span>
                                            </div>
                                            <div className="flex-1 flex items-center justify-center py-4">
                                                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-800 transition-all duration-300 hover:border-slate-700">
                                                    <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">Adaptive UI Stream</span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase">Teams Client Mirror</span>
                                                    </div>
                                                    <div className="p-6 bg-white min-h-[150px]">
                                                        <CardPreview cardJson={cardJson} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Side: High-Performance JSON Editor */}
                                        <div className="w-1/2 flex flex-col overflow-hidden bg-[#0f172a]">
                                            <div className="px-6 py-2 bg-slate-900/50 border-b border-slate-800/50 flex items-center justify-between">
                                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Payload Editor</span>
                                                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">UTF-8 String</span>
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <JsonEditor 
                                                    value={jsonString} 
                                                    onChange={handleJsonChange} 
                                                    onMount={(editor) => { editorRef.current = editor; }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                    
                    {!isJsonOpen && (
                        <button 
                            onClick={() => setIsJsonOpen(true)}
                            className="absolute bottom-4 right-8 px-5 py-2.5 bg-slate-900 text-white rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all z-30 border border-slate-800"
                        >
                            <Code2 size={14} className="text-blue-400 animate-spin-slow" /> Open JSON Workshop
                        </button>
                    )}
                </div>
            </div>

            {/* Modal Overlay for Instant Scheduling of Designed Cards */}
            <AnimatePresence>
                {isScheduleOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
                            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden relative border border-slate-100 max-h-[90vh] flex flex-col"
                        >
                            <button
                                onClick={() => setIsScheduleOpen(false)}
                                className="absolute top-5 right-5 z-20 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                            >
                                <X size={16} />
                            </button>
                            <div className="overflow-y-auto custom-scrollbar p-1">
                                <ScheduleMessageForm 
                                    selectedChannel={
                                        localStorage.getItem('selectedChannel')
                                            ? JSON.parse(localStorage.getItem('selectedChannel')!)
                                            : null
                                    }
                                    initialContent={JSON.stringify(cardJson)}
                                    onSuccess={() => setIsScheduleOpen(false)} 
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Premium Step-by-Step Direct Dispatch Selection & Confirmation Popup Overlay */}
            <AnimatePresence>
                {isDispatchOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden relative border border-slate-100 flex flex-col"
                        >
                            {/* Card Top Banner */}
                            <div className="px-8 py-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                        <Send size={14} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black tracking-tight italic uppercase text-white">Payload Dispatcher</h3>
                                        <p className="text-indigo-100 text-[10px] font-bold tracking-wider uppercase">Granular Broadcast Pipeline</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { 
                                        setIsDispatchOpen(false); 
                                        setSelectedTargetTeam(null); 
                                        setSelectedTargetChannel(null);
                                        setConfirmTargetChannel(null); 
                                    }}
                                    className="p-2 text-white/80 hover:text-white rounded-xl bg-white/10 hover:bg-white/20 transition-all"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Sequential Step Body */}
                            <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                                {/* Step 1: Select Active Organization Team */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                        Step 1: Target Team
                                    </label>
                                    {isTeamsLoading ? (
                                        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-400 font-bold text-center">Querying Directory...</div>
                                    ) : !teamsList?.length ? (
                                        <div className="p-3 bg-rose-50 rounded-xl text-xs text-rose-500 font-bold text-center">No active teams accessible</div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                            {teamsList.map((team: any) => (
                                                <button
                                                    key={team.id}
                                                    onClick={() => {
                                                        setSelectedTargetTeam(team.id);
                                                        setSelectedTargetChannel(null);
                                                        setConfirmTargetChannel(null);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-between border ${selectedTargetTeam === team.id ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50'}`}
                                                >
                                                    <span className="truncate pr-2">{team.displayName}</span>
                                                    {selectedTargetTeam === team.id && <CheckCircle2 size={14} className="text-blue-600 flex-shrink-0" />}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Step 2: Select Destination Channel */}
                                <AnimatePresence>
                                    {selectedTargetTeam && (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="space-y-2 overflow-hidden"
                                        >
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                                                Step 2: Destination Channel
                                            </label>
                                            {isChannelsLoading ? (
                                                <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-400 font-bold text-center">Fetching Streams...</div>
                                            ) : !channelsList?.length ? (
                                                <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-600 font-bold text-center">No active streams discovered</div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                                    {channelsList.map((ch: any) => (
                                                        <button
                                                            key={ch.id}
                                                            onClick={() => {
                                                                setSelectedTargetChannel(ch.id);
                                                                setConfirmTargetChannel({ id: ch.id, name: ch.displayName });
                                                            }}
                                                            className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-between border ${selectedTargetChannel === ch.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:bg-slate-50'}`}
                                                        >
                                                            <span className="truncate pr-2">{ch.displayName}</span>
                                                            <ChevronRight size={14} className={selectedTargetChannel === ch.id ? 'text-indigo-600' : 'text-slate-400'} />
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Final Confirmation Prompt Drawer */}
                                <AnimatePresence>
                                    {confirmTargetChannel && selectedTargetTeam && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            className="p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl space-y-4"
                                        >
                                            <div className="flex gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                                                    <AlertTriangle size={14} className="text-amber-400" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-xs font-black uppercase tracking-wide text-white">Broadcast Authorization</p>
                                                    <p className="text-[10px] text-slate-300 font-medium">
                                                        Release raw payload directly to <span className="text-amber-400 font-bold underline">{confirmTargetChannel.name}</span>?
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-1">
                                                <button
                                                    onClick={() => setConfirmTargetChannel(null)}
                                                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                                >
                                                    Cancel ❌
                                                </button>
                                                <button
                                                    onClick={() => handleSend(selectedTargetTeam, confirmTargetChannel.id)}
                                                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-blue-950 active:scale-95"
                                                >
                                                    Send Now 🚀
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                <span>🔒 Encrypted MS Graph Handshake</span>
                                <span>v1.4 Spec Core</span>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
