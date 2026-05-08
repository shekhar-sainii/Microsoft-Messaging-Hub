import React, { useRef } from 'react';
import Editor from "@monaco-editor/react";

interface JsonEditorProps {
    value: string;
    onChange: (value: string | undefined) => void;
    onMount?: (editor: any) => void;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({ value, onChange, onMount }) => {
    const handleEditorDidMount = (editor: any, monaco: any) => {
        if (onMount) onMount(editor);
        
        // Add custom theme
        monaco.editor.defineTheme('teamsTheme', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.background': '#0f172a', // slate-900
            }
        });
        monaco.editor.setTheme('teamsTheme');
    };

    return (
        <div className="border border-slate-800 rounded-2xl overflow-hidden h-full shadow-2xl bg-[#0f172a]">
            <div className="bg-slate-900 text-slate-400 px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span>adaptive-card.json</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-blue-500/50">LATEST V1.4</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-blue-400">JSON</span>
                </div>
            </div>
            <Editor
                height="calc(100% - 40px)"
                defaultLanguage="json"
                value={value}
                theme="vs-dark"
                onChange={onChange}
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    lineNumbers: 'on',
                    roundedSelection: true,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    formatOnPaste: true,
                    formatOnType: true,
                    cursorSmoothCaretAnimation: 'on',
                    smoothScrolling: true,
                    wordWrap: 'on'
                }}
            />
        </div>
    );
};
