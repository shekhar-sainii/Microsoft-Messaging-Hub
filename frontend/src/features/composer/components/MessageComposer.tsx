import React, { useCallback, useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Mention from '@tiptap/extension-mention';
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Send, Clock, User as UserIcon, AlertTriangle } from 'lucide-react';
import { OneDrivePicker } from '../../../components/OneDrivePicker';

interface MessageComposerProps {
    onSend: (html: string, mentions: any[], options?: any) => void;
    onSchedule?: (html: string, options?: any) => void;
    placeholder?: string;
    teamMembers?: any[];
}

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

    // Debounced draft save — saves to localStorage 30 seconds after last keystroke
    const saveDraft = useCallback((html: string) => {
        if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
        draftTimerRef.current = setTimeout(() => {
            localStorage.setItem('hub_draft_content', html);
        }, 30000); // 30 seconds debounce
    }, []);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
        };
    }, []);
    
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({ openOnClick: false }),
            Placeholder.configure({ placeholder }),
            Mention.configure({
                HTMLAttributes: {
                    class: 'bg-blue-100 text-blue-700 px-1 rounded font-bold border border-blue-200',
                },
                suggestion: {
                    items: ({ query }) => {
                        return teamMembers
                            .filter(item => item.displayName.toLowerCase().startsWith(query.toLowerCase()))
                            .slice(0, 5);
                    },
                    render: () => {
                        return {};
                    },
                },
            }),
        ],
        content: '',
        onUpdate: ({ editor }) => {
            // Auto-save draft with 30-second debounce (task requirement)
            saveDraft(editor.getHTML());
        }
    });

    // Load draft and sync other fields
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

    // Save subject/importance to local storage
    useEffect(() => {
        localStorage.setItem('hub_draft_subject', subject);
        localStorage.setItem('hub_draft_importance', importance);
    }, [subject, importance]);

    const charCount = editor?.getText().length || 0;
    const isOverLimit = charCount > 28000;

    const handleSend = useCallback(() => {
        if (editor && !isOverLimit && charCount > 0) {
            const mentions: any[] = [];
            editor.state.doc.descendants((node) => {
                if (node.type.name === 'mention') {
                    mentions.push({
                        mentionText: node.attrs.label,
                        mentioned: {
                            user: {
                                id: node.attrs.id,
                                displayName: node.attrs.label
                            }
                        }
                    });
                }
            });

            onSend(editor.getHTML(), mentions, { subject, importance });
            
            // Clear all
            editor.commands.clearContent();
            setSubject('');
            setImportance('normal');
            localStorage.removeItem('hub_draft_content');
            localStorage.removeItem('hub_draft_subject');
            localStorage.removeItem('hub_draft_importance');
        }
    }, [editor, onSend, isOverLimit, charCount, subject, importance]);

    if (!editor) return null;

    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
            {/* Subject Line */}
            <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50">
                <input 
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject (optional)"
                    className="w-full bg-transparent border-none focus:ring-0 text-sm font-semibold text-slate-700 placeholder:text-slate-400"
                />
            </div>

            {/* Toolbar */}
            <div className="bg-white px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleBold().run()} 
                        active={editor.isActive('bold')}
                        icon={Bold}
                    />
                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleItalic().run()} 
                        active={editor.isActive('italic')}
                        icon={Italic}
                    />
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleBulletList().run()} 
                        active={editor.isActive('bulletList')}
                        icon={List}
                    />
                    <ToolbarButton 
                        onClick={() => editor.chain().focus().toggleOrderedList().run()} 
                        active={editor.isActive('orderedList')}
                        icon={ListOrdered}
                    />
                    <div className="w-px h-4 bg-slate-200 mx-1" />
                    <ToolbarButton 
                        onClick={() => {
                            const url = window.prompt('URL');
                            if (url) editor.chain().focus().setLink({ href: url }).run();
                        }} 
                        active={editor.isActive('link')}
                        icon={LinkIcon}
                    />
                </div>
                
                <div className="flex items-center gap-3">
                    <select 
                        value={importance}
                        onChange={(e) => setImportance(e.target.value as any)}
                        className={`text-[11px] font-bold py-1 px-2 rounded-md border-none focus:ring-1 focus:ring-blue-400 transition-colors ${
                            importance === 'high' ? 'bg-red-50 text-red-600' : 
                            importance === 'urgent' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                        <option value="normal">Normal</option>
                        <option value="high">High Importance</option>
                        <option value="urgent">Urgent</option>
                    </select>

                    <div className={`text-[10px] font-bold px-2 py-1 rounded ${isOverLimit ? 'bg-red-100 text-red-600' : 'text-slate-400'}`}>
                        {charCount.toLocaleString()} / 28,000
                    </div>
                </div>
            </div>

            {/* Editor Area */}
            <div className="p-4 min-h-[120px] prose prose-sm prose-slate max-w-none">
                <EditorContent editor={editor} />
            </div>

            {isOverLimit && (
                <div className="mx-4 mb-2 p-2 bg-red-50 text-red-600 rounded-md flex items-center gap-2 text-xs font-medium border border-red-100">
                    <AlertTriangle size={14} />
                    Message exceeds Microsoft Graph limit (28KB). Please shorten it.
                </div>
            )}

            {/* Footer / Actions */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                <OneDrivePicker
                    attachedFiles={attachedFiles}
                    onFilesSelected={(files) => setAttachedFiles(prev => [...prev, ...files])}
                    onRemove={(id) => setAttachedFiles(prev => prev.filter(f => f.id !== id))}
                />
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                        <UserIcon size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Rich Text Mode</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {onSchedule && (
                            <button 
                                onClick={() => onSchedule(editor.getHTML(), { subject, importance })}
                                className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                                title="Schedule for later"
                            >
                                <Clock size={18} />
                            </button>
                        )}
                        <button 
                            onClick={handleSend}
                            disabled={charCount === 0 || isOverLimit}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-100 transition-all active:scale-95"
                        >
                            <Send size={16} />
                            Send Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ToolbarButton = ({ onClick, active, icon: Icon }: any) => (
    <button
        onClick={onClick}
        className={`p-1.5 rounded-md transition-all ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
    >
        <Icon size={16} />
    </button>
);
