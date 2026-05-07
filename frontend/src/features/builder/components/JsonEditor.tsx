import React from 'react';
import Editor from "@monaco-editor/react";

interface JsonEditorProps {
    value: string;
    onChange: (value: string | undefined) => void;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({ value, onChange }) => {
    return (
        <div className="border border-slate-200 rounded-xl overflow-hidden h-full shadow-sm">
            <div className="bg-slate-800 text-slate-300 px-4 py-2 text-xs font-mono flex items-center justify-between">
                <span>adaptive-card.json</span>
                <span className="text-blue-400">JSON</span>
            </div>
            <Editor
                height="100%"
                defaultLanguage="json"
                value={value}
                theme="vs-dark"
                onChange={onChange}
                options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    formatOnPaste: true,
                    formatOnType: true
                }}
            />
        </div>
    );
};
