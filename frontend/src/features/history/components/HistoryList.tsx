import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageSquare, Trash2, Reply, RefreshCw } from 'lucide-react';
import { useMessagesHistory, useSearchMessages, useDeleteMessage } from '../../../hooks/useMessagesData';

export const HistoryList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: history, isLoading: historyLoading, refetch } = useMessagesHistory();
  const { data: searchResults, isLoading: searchLoading } = useSearchMessages(searchTerm);
  const { mutate: deleteMessage } = useDeleteMessage();

  const messages = searchTerm.length > 2 ? searchResults : history;
  const isLoading = searchTerm.length > 2 ? searchLoading : historyLoading;

  return (
    <div className="w-full space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Message History</h2>
          <p className="text-slate-500 font-medium text-lg mt-1">Review and manage your sent communications.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search sent messages..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>
          <button 
            onClick={() => refetch()}
            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <RefreshCw size={20} />
          </button>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] p-8">
        {isLoading ? (
          <div className="py-20 text-center">
            <RefreshCw className="mx-auto animate-spin text-blue-500 mb-4" size={32} />
            <p className="text-slate-500 font-medium">Loading history...</p>
          </div>
        ) : messages?.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
              <MessageSquare size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">No Messages Found</h3>
            <p className="text-slate-400 mt-2 font-medium">Try adjusting your search or send a new message.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages?.map((msg: any, i: number) => (
              <motion.div 
                key={msg.id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex flex-col sm:flex-row sm:items-start gap-4 p-5 bg-white border border-slate-100 rounded-2xl hover:border-blue-200 hover:shadow-md transition-all group"
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-base font-bold text-slate-800 truncate pr-4">Channel: {msg.channelId || 'Unknown'}</h4>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                      {new Date(msg.createdDateTime || msg.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div 
                    className="text-sm text-slate-600 line-clamp-2 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: msg.body?.content || msg.content || 'No content' }} 
                  />
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end justify-end mt-4 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <Reply size={18} />
                  </button>
                  <button 
                    onClick={() => {
                        if(window.confirm('Delete this message?')) {
                            deleteMessage({ teamId: msg.teamId, channelId: msg.channelId, msgId: msg.id });
                        }
                    }}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
