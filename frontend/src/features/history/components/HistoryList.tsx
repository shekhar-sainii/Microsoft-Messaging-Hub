import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MessageSquare, Trash2, Reply, RefreshCw, Filter, Calendar, ExternalLink, Activity, Globe } from 'lucide-react';
import { useMessagesHistory, useSearchMessages, useDeleteMessage } from '../../../hooks/useMessagesData';
import { ThreadModal } from './ThreadModal';
import { useDebounce } from '../../../hooks/useDebounce';

export const HistoryList: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const debouncedSearch = useDebounce(searchTerm, 400); // Use debounce
  
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  
  const { data: history, isLoading: historyLoading, refetch } = useMessagesHistory();
  const { data: searchResults, isLoading: searchLoading } = useSearchMessages(debouncedSearch);
  const { mutate: deleteMessage } = useDeleteMessage();

  useEffect(() => {
    if (initialSearch) {
        setSearchTerm(initialSearch);
    }
  }, [initialSearch]);

  const messages = debouncedSearch.length > 2 ? searchResults : history;
  const isLoading = (searchTerm.length > 2 && searchTerm !== debouncedSearch) || (debouncedSearch.length > 2 && searchLoading) || historyLoading;

  const stats = [
    { label: 'Total Sent', value: history?.length || 0, icon: MessageSquare, color: 'blue' },
    { label: 'Today', value: history?.filter((m: any) => new Date(m.createdDateTime || m.createdAt).toDateString() === new Date().toDateString()).length || 0, icon: Activity, color: 'indigo' },
    { label: 'Organizations', value: [...new Set(history?.map((m: any) => m.teamId))].length || 0, icon: Globe, color: 'amber' }
  ];

  return (
    <div className="w-full space-y-8 pb-32">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] border border-blue-100">
            <Calendar size={10} />
            Archive Management
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">Communication History</h2>
          <p className="text-slate-400 font-bold text-sm max-w-xl">
            Audit trail of all messages sent via the Messaging Hub platform.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-lg shadow-slate-100/50"
            />
            {searchTerm !== debouncedSearch && searchTerm.length > 2 && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <RefreshCw size={12} className="text-blue-500 animate-spin" />
                </div>
            )}
          </div>
          <button 
            onClick={() => refetch()}
            title="Refresh History"
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all shadow-md active:scale-95"
          >
            <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm"
          >
            <div className={`w-10 h-10 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl flex items-center justify-center shadow-inner`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-lg font-black text-slate-900 tracking-tight">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
             <Filter size={14} className="text-slate-400" />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recent Activity</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{messages?.length || 0} Messages found</span>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processing Search...</p>
          </div>
        ) : messages?.length === 0 ? (
          <div className="py-20 text-center bg-white border-2 border-dashed border-slate-100 rounded-[2rem]">
            <MessageSquare className="mx-auto text-slate-200 mb-4" size={48} />
            <h3 className="text-xl font-black text-slate-800 tracking-tight italic uppercase">No matches found</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {messages?.map((msg: any, i: number) => (
              <motion.div 
                key={msg.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="group relative"
              >
                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 flex flex-col lg:flex-row gap-6 relative z-10 transition-all duration-300 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-50/50">
                  
                  <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner">
                    <MessageSquare size={20} />
                  </div>

                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase tracking-widest">
                        {msg.teamId ? 'Teams Org' : 'External'}
                      </span>
                      <div className="h-1 w-1 rounded-full bg-slate-300" />
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-tight">
                        <Calendar size={12} />
                        {new Date(msg.createdDateTime || msg.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase">
                        Channel Access
                        <span className="text-blue-600 font-bold">#{msg.channelId?.substring(0, 8)}...</span>
                      </h4>
                      <div 
                        className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-2 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: msg.body?.content || msg.content || 'No content' }} 
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <button 
                          onClick={() => setSelectedMessage(msg)}
                          className="flex items-center gap-1.5 text-blue-600 font-black text-[9px] uppercase tracking-widest hover:text-blue-700 transition-colors"
                        >
                          <ExternalLink size={12} />
                          Thread Details
                        </button>
                    </div>
                  </div>

                  <div className="flex lg:flex-col items-center justify-end gap-2 lg:border-l lg:border-slate-50 lg:pl-6">
                    <button 
                      onClick={() => setSelectedMessage(msg)}
                      className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center transition-all"
                    >
                      <Reply size={16} />
                    </button>
                    <button 
                      onClick={() => {
                          if(window.confirm('Delete this message archive?')) {
                              deleteMessage({ teamId: msg.teamId, channelId: msg.channelId, msgId: msg.id });
                          }
                      }}
                      className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <ThreadModal 
        isOpen={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        message={selectedMessage}
      />
    </div>
  );
};
