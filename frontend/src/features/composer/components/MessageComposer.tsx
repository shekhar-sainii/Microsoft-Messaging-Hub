import React, { useCallback, useState, useEffect, useRef, useMemo } from 'react';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import tippy from 'tippy.js';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Send, Clock, Info, AlertTriangle, ShieldCheck } from 'lucide-react';
import { OneDrivePicker } from '../../../components/OneDrivePicker';
import { MentionList } from './MentionList';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageComposerProps {
    onSend: (html: string, mentions: any[], options?: any) => void;
    onSchedule?: (html: string, options?: any) => void;
    placeholder?: string;
    teamMembers?: any[];
}

const MAX_BYTES = 28000; // ~28KB Microsoft Graph Limit

export const MessageComposer: React.FC<MessageComposerProps> = ({ 
    onSend, 
    onSchedule, 
    placeholder = "Type your message here... Use @ to mention someone.",
    teamMembers = []
}) => {
    const [attachedFiles, setAttachedFiles] = useState<any[]>([]);
    const [subject, setSubject] = useState('');
    const [importance, setImportance] = useState<'normal' | 'high' | 'urgent'>('normal');
    const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const membersRef = useRef(teamMembers);

    // Keep ref in sync
    useEffect(() => {
        membersRef.current = teamMembers;
    }, [teamMembers]);

    const saveDraft = useCallback((html: string) => {
        if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
        draftTimerRef.current = setTimeout(() => {
            localStorage.setItem('hub_draft_content', html);
        }, 5000); // More aggressive autosave
    }, []);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({ openOnClick: false }),
            Placeholder.configure({ placeholder }),
            Mention.configure({
                HTMLAttributes: {
                    class: 'bg-blue-100 text-blue-700 px-1 rounded font-bold border border-blue-200 cursor-pointer hover:bg-blue-200 transition-colors',
                },
                suggestion: {
                    items: ({ query, editor }) => {
                        const existingMentionIds: string[] = [];
                        editor.state.doc.descendants((node) => {
                            if (node.type.name === 'mention') {
                                existingMentionIds.push(node.attrs.id);
                            }
                        });

                        return (membersRef.current || [])
                            .filter(item => 
                                item.displayName.toLowerCase().includes(query.toLowerCase()) &&
                                !existingMentionIds.includes(item.id)
                            )
                            .slice(0, 8);
                    },
                    render: () => {
                        let component: any;
                        let popup: any;

                        return {
                            onStart: (props: any) => {
                                component = new ReactRenderer(MentionList, {
                                    props,
                                    editor: props.editor,
                                });

                                if (!props.clientRect) return;

                                popup = tippy('body', {
                                    getReferenceClientRect: props.clientRect,
                                    appendTo: () => document.body,
                                    content: component.element,
                                    showOnCreate: true,
                                    interactive: true,
                                    trigger: 'manual',
                                    placement: 'bottom-start',
                                    theme: 'light-border shadow-xl',
                                })[0];
                            },
                            onUpdate(props: any) {
                                component.updateProps(props);
                                if (!props.clientRect) return;
                                popup.setProps({ getReferenceClientRect: props.clientRect });
                            },
                            onKeyDown(props: any) {
                                if (props.event.key === 'Escape') {
                                    popup.hide();
                                    return true;
                                }
                                return component.ref?.onKeyDown(props);
                            },
                            onExit() {
                                popup.destroy();
                                component.destroy();
                            },
                        };
                    },
                },
            }),
        ],
        content: '',
        onUpdate: ({ editor }) => {
            saveDraft(editor.getHTML());
        }
    }, []);

    useEffect(() => {
        const savedContent = localStorage.getItem('hub_draft_content');
        if (savedContent && editor && !editor.getText()) {
            editor.commands.setContent(savedContent);
        }
        
        const savedSubject = localStorage.getItem('hub_draft_subject');
        if (savedSubject) setSubject(savedSubject);
        
        const savedImportance = localStorage.getItem('hub_draft_importance');
        if (savedImportance) setImportance(savedImportance as any);
    }, [editor]);

    useEffect(() => {
        localStorage.setItem('hub_draft_subject', subject);
        localStorage.setItem('hub_draft_importance', importance);
    }, [subject, importance]);

    // Precise Byte Count Calculation (UTF-8)
    const byteSize = useMemo(() => {
        if (!editor) return 0;
        const html = editor.getHTML();
        return new TextEncoder().encode(html).length;
    }, [editor?.getHTML()]);

    const usagePercentage = Math.min((byteSize / MAX_BYTES) * 100, 100);
    const isOverLimit = byteSize > MAX_BYTES;

    const handleSend = useCallback(() => {
        if (editor && !isOverLimit && byteSize > 0) {
            const mentions: any[] = [];
            editor.state.doc.descendants((node) => {
                if (node.type.name === 'mention') {
                    mentions.push({
                        mentionText: node.attrs.label,
                        mentioned: {
                            user: { id: node.attrs.id, displayName: node.attrs.label }
                        }
                    });
                }
            });

            onSend(editor.getHTML(), mentions, { subject, importance });
            
            editor.commands.clearContent();
            setSubject('');
            setImportance('normal');
            localStorage.removeItem('hub_draft_content');
        }
    }, [editor, onSend, isOverLimit, byteSize, subject, importance]);

    if (!editor) return null;

    return (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50/50 transition-all duration-300">
            {/* Subject Input */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/30">
                <input 
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Message Subject (Optional)"
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 placeholder:text-slate-400"
                />
            </div>

            {/* Toolbar */}
            <div className="bg-white px-4 py-2 border-b border-slate-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleBold().run()} 
                        active={editor.isActive('bold')}
                        icon={Bold}
                        label="Bold"
                    />
                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleItalic().run()} 
                        active={editor.isActive('italic')}
                        icon={Italic}
                        label="Italic"
                    />
                    <div className="w-px h-5 bg-slate-200 mx-1.5" />
                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleBulletList().run()} 
                        active={editor.isActive('bulletList')}
                        icon={List}
                        label="Bullet List"
                    />
                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                        active={editor.isActive('orderedList')}
                        icon={ListOrdered}
                        label="Numbered List"
                    />
                    <div className="w-px h-5 bg-slate-200 mx-1.5" />
                    <ToolbarButton 
                        onClick={() => {
                            const url = window.prompt('URL');
                            if (url) editor.chain().focus().setLink({ href: url }).run();
                        }} 
                        active={editor.isActive('link')}
                        icon={LinkIcon}
                        label="Link"
                    />
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex flex-col items-end">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className={`text-[10px] font-black tracking-tight ${isOverLimit ? 'text-red-500' : 'text-slate-500'}`}>
                                {byteSize.toLocaleString()} / {MAX_BYTES.toLocaleString()} BYTES
                            </span>
                            {isOverLimit && <AlertTriangle size={10} className="text-red-500" />}
                        </div>
                        <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${usagePercentage}%` }}
                                className={`h-full transition-colors duration-500 ${
                                    usagePercentage > 90 ? 'bg-red-500' : 
                                    usagePercentage > 70 ? 'bg-amber-400' : 'bg-blue-500'
                                }`}
                            />
                        </div>
                    </div>

                    <select 
                        value={importance}
                        onChange={(e) => setImportance(e.target.value as any)}
                        className={`text-[10px] font-black uppercase tracking-wider py-1.5 px-3 rounded-lg border-none focus:ring-2 focus:ring-blue-400 shadow-sm transition-all cursor-pointer ${
                            importance === 'high' ? 'bg-red-50 text-red-600' : 
                            importance === 'urgent' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                        <option value="normal">Normal</option>
                        <option value="high">High Priority</option>
                        <option value="urgent">Urgent Alert</option>
                    </select>
                </div>
            </div>

            {/* Editor Area */}
            <div className="p-6 min-h-[160px] prose prose-sm prose-blue max-w-none focus-within:outline-none custom-tiptap-editor">
                <EditorContent editor={editor} />
            </div>

            {/* Warning Callout */}
            <AnimatePresence>
                {isOverLimit && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mx-4 mb-3 p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3"
                    >
                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                            <AlertTriangle size={14} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-red-800 uppercase tracking-wide">Payload Limit Exceeded</p>
                            <p className="text-xs text-red-600/80 mt-0.5 leading-relaxed">
                                Microsoft Graph API rejects messages larger than 28KB. Your message currently consumes <b>{(byteSize/1024).toFixed(1)}KB</b>.
                                Please remove some content or attachments.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Footer / Actions */}
            <div className="px-5 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-col gap-4">
                <OneDrivePicker
                    attachedFiles={attachedFiles}
                    onFilesSelected={(files) => setAttachedFiles(prev => [...prev, ...files])}
                    onRemove={(id) => setAttachedFiles(prev => prev.filter(f => f.id !== id))}
                />
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-full border border-slate-200/60 shadow-sm">
                        <ShieldCheck size={14} className="text-blue-500" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enterprise Secure</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {onSchedule && (
                            <button 
                                onClick={() => onSchedule(editor.getHTML(), { subject, importance })}
                                className="flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-sm rounded-xl transition-all font-bold text-sm"
                                title="Schedule for later"
                            >
                                <Clock size={18} />
                                <span className="hidden sm:inline">Schedule</span>
                            </button>
                        )}
                        <button 
                            onClick={handleSend}
                            disabled={byteSize === 0 || isOverLimit}
                            className="flex items-center gap-2.5 px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                        >
                            <Send size={16} />
                            Send Dispatch
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ToolbarButtonProps {
    onClick: () => void;
    active: boolean;
    icon: any;
    label: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, active, icon: Icon, label }) => (
    <button
        onClick={onClick}
        className={`p-2 rounded-lg transition-all group relative ${
            active ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
        }`}
        title={label}
    >
        <Icon size={18} />
        {!active && (
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                {label}
            </span>
        )}
    </button>
);
