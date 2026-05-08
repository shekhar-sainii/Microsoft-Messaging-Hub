import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Edit2, Trash2, LayoutTemplate, Search, Sparkles, Zap, ShieldCheck, X } from 'lucide-react';
import { useGetTemplatesQuery, useDeleteTemplateMutation } from '../templatesApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { PREBUILT_TEMPLATES } from '../data/prebuiltTemplates';
import toast from 'react-hot-toast';

export const TemplateLibrary: React.FC = () => {
  const navigate = useNavigate();
  const { data: dbTemplates, isLoading } = useGetTemplatesQuery();
  const [deleteTemplate] = useDeleteTemplateMutation();
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [activeFilter, setActiveFilter] = useState<'all' | 'adaptive_card' | 'html'>('all');

  const allTemplates = useMemo(() => {
    const db = dbTemplates || [];
    
    // Deduplicate: Only add prebuilt templates that are NOT already in the database (by name)
    const dbNames = new Set(db.map((t: any) => t.name.toLowerCase()));
    const uniquePrebuilts = PREBUILT_TEMPLATES.filter(pt => !dbNames.has(pt.name.toLowerCase()));
    
    return [...db, ...uniquePrebuilts];
  }, [dbTemplates]);

  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((t: any) => {
      const matchesSearch = t.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                           t.description?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesFilter = activeFilter === 'all' || t.type === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [allTemplates, debouncedSearch, activeFilter]);

  const handleDelete = (e: React.MouseEvent, template: any) => {
    e.stopPropagation();
    
    // Check if it's a hardcoded prebuilt OR a system template from DB
    const isSystem = template?._id?.startsWith('pb-') || template?.userId === 'system';
    
    if (isSystem) {
        toast.error('System assets are read-only');
        return;
    }
    
    if (!template?._id) {
        toast.error('Cannot locate asset reference');
        return;
    }

    if (window.confirm(`Permanently remove "${template.name}"?`)) {
        deleteTemplate(template._id)
            .unwrap()
            .then(() => toast.success('Asset removed from repository'))
            .catch((err: any) => toast.error(`Removal failed: ${err.data?.message || err.message}`));
    }
  };

  const handleEdit = (e: React.MouseEvent, template: any) => {
    e.stopPropagation();
    navigate('/builder', { state: { template } });
  };

  return (
    <div className="w-full space-y-8 pb-32">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border border-indigo-100">
            <Sparkles size={10} />
            Digital Asset Catalog
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Template Repository</h2>
          <p className="text-slate-400 font-bold text-sm max-w-xl">
            Centralized management of enterprise message templates and interaction models.
          </p>
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/builder')}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all flex items-center gap-2 shadow-xl shadow-blue-100 text-xs group"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
          Initialize New Asset
        </motion.button>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="relative group flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search repository..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-500 transition-all shadow-lg shadow-slate-100/30"
            />
            {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X size={14} />
                </button>
            )}
        </div>

        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 self-stretch h-[46px]">
            {(['all', 'adaptive_card', 'html'] as const).map((f) => (
                <button
                    key={f}
                    onClick={() => setActiveFilter(f)}
                    className={`px-4 h-full rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        activeFilter === f 
                        ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                    {f.replace('_', ' ')}
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 bg-slate-100 animate-pulse rounded-3xl" />
          ))
        ) : filteredTemplates?.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-slate-100 rounded-[2rem]">
            <LayoutTemplate className="mx-auto text-slate-200 mb-4" size={48} />
            <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase italic">No matches detected</h3>
          </div>
        ) : (
          filteredTemplates?.map((template: any, i: number) => {
            const isSystem = template?._id?.startsWith('pb-') || template?.userId === 'system';
            
            return (
              <motion.div 
                key={template?._id || i}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group relative"
              >
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 flex flex-col h-[320px] relative z-10 transition-all duration-300 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-50/50">
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${template.type === 'adaptive_card' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                      {template.type === 'adaptive_card' ? <Zap size={24} /> : <FileText size={24} />}
                    </div>
                    <div className="flex gap-2">
                      <button 
                          onClick={(e) => handleEdit(e, template)}
                          title="Modify Asset"
                          className="w-9 h-9 bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg flex items-center justify-center transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, template)}
                        disabled={isSystem}
                        title={isSystem ? "Read-only Asset" : "Remove Asset"}
                        className={`w-9 h-9 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center transition-all ${isSystem ? 'opacity-30 cursor-not-allowed' : 'text-slate-400 hover:text-red-600 hover:bg-white'}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 flex-1 overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${template.type === 'adaptive_card' ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'}`}>
                        {template.type === 'adaptive_card' ? 'Interactive' : 'Static HTML'}
                      </span>
                      {isSystem && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[8px] font-black uppercase tracking-widest">System Asset</span>
                      )}
                      <ShieldCheck size={12} className="text-green-500" />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight leading-tight uppercase italic group-hover:text-indigo-600 transition-colors truncate">{template.name}</h3>
                    <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-3">{template.description || "No documentation available for this asset."}</p>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Modified</span>
                      <span className="text-xs font-bold text-slate-500">
                        {new Date(template.createdAt || template.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.1 }}
                      onClick={(e) => handleEdit(e, template)}
                      className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner"
                    >
                      <Zap size={16} />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
