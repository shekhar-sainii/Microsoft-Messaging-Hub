import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Edit2, Trash2, LayoutTemplate } from 'lucide-react';
import { useTemplates, useDeleteTemplate } from '../../../hooks/useTemplatesData';

interface TemplateLibraryProps {
  onOpenBuilder?: () => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onOpenBuilder }) => {
  const { data: templates, isLoading } = useTemplates();
  const { mutate: deleteTemplate } = useDeleteTemplate();
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);

  return (
    <div className="w-full space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Template Library</h2>
          <p className="text-slate-500 font-medium text-lg mt-1">Manage reusable message layouts and adaptive cards.</p>
        </div>
        <button 
          onClick={onOpenBuilder}
          className="px-6 py-3 bg-blue-600 text-white border border-blue-700 rounded-2xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm shadow-blue-200 active:scale-95"
        >
          <Plus size={18} />
          New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-20 text-center">
             <div className="animate-spin text-blue-500 mb-4 inline-block"><Plus size={32} /></div>
             <p className="text-slate-500 font-medium">Loading templates...</p>
          </div>
        ) : templates?.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-card rounded-[2.5rem]">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
              <LayoutTemplate size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">No Templates</h3>
            <p className="text-slate-400 mt-2 font-medium">Create your first template to save time.</p>
          </div>
        ) : (
          templates?.map((template: any, i: number) => (
            <motion.div 
              key={template._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card rounded-[2rem] p-6 group hover:shadow-lg transition-all border border-slate-100 hover:border-blue-200 cursor-pointer flex flex-col h-64"
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${template.type === 'adaptive_card' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                  <FileText size={24} />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if(window.confirm('Delete this template?')) {
                        deleteTemplate(template._id);
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-2 truncate">{template.name}</h3>
              <p className="text-sm text-slate-500 font-medium line-clamp-3 mb-auto">{template.description || "No description provided."}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">
                  {template.type === 'adaptive_card' ? 'Adaptive Card' : 'HTML Format'}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date(template.createdAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
