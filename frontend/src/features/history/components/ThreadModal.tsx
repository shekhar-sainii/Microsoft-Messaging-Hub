import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Sparkles, User, CornerDownRight } from 'lucide-react';
import { useMessageReplies, useReplyMessage } from '../../../hooks/useMessagesData';
import toast from 'react-hot-toast';

interface ThreadModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: any;
}

export const ThreadModal: React.FC<ThreadModalProps> = ({ isOpen, onClose, message }) => {
  const [replyContent, setReplyContent] = useState('');
  const { data: replies, isLoading } = useMessageReplies(
    message?.teamId,
    message?.channelId,
    message?.id,
    isOpen
  );
  const { mutate: sendReply, isPending: isReplying } = useReplyMessage();

  const handleSendReply = () => {
    if (!replyContent.trim()) return;
    
    sendReply({
      teamId: message.teamId,
      channelId: message.channelId,
      messageId: message.id || message.messageId || message._id,
      content: replyContent
    }, {
      onSuccess: () => {
        setReplyContent('');
        toast.success('Reply broadcasted successfully', {
          icon: '🚀',
          style: { borderRadius: '12px', background: '#0f172a', color: '#fff' }
        });
      },
      onError: (err: any) => toast.error(err.message || 'Failed to dispatch reply')
    });
  };

  if (!isOpen || !message) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
          className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-100"
        >
          {/* Top Premium Banner */}
          <div className="relative p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 flex justify-between items-center overflow-hidden">
            {/* Subtle glow decoration */}
            <div className="absolute -top-10 -left-10 w-28 h-28 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-200">
                <MessageSquare size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 tracking-tight uppercase italic">Thread Node</h2>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <Sparkles size={8} /> Live
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Direct Microsoft Teams Relay</p>
              </div>
            </div>
            
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600 active:scale-95"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Container (Dynamic height via max-h and flex-shrink) */}
          <div className="overflow-y-auto p-6 space-y-5 custom-scrollbar">
            {/* Original Source Message */}
            <div className="flex gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm">
                {message.from?.user?.displayName?.charAt(0) || <User size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-extrabold text-xs text-slate-900 truncate">{message.from?.user?.displayName || 'Authorized User'}</span>
                  <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded uppercase tracking-wider">Source</span>
                </div>
                <div className="inline-block w-full max-w-prose bg-gradient-to-br from-slate-50 to-blue-50/20 p-3.5 rounded-2xl rounded-tl-none border border-slate-200/60 shadow-2xs">
                  <div 
                    className="text-xs text-slate-700 prose prose-sm max-w-none leading-relaxed break-words"
                    dangerouslySetInnerHTML={{ __html: message.body?.content || message.content }} 
                  />
                </div>
              </div>
            </div>

            {/* Replies Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] flex items-center gap-1">
                <CornerDownRight size={10} /> Active Replies
              </span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>

            {/* Replies Flow */}
            {isLoading ? (
              <div className="py-6 flex justify-center items-center gap-2 text-slate-400 font-bold text-xs">
                <div className="w-3 h-3 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                Synchronizing stream...
              </div>
            ) : replies?.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest bg-slate-50/50 rounded-xl border border-dashed border-slate-100">
                No active responses detected
              </div>
            ) : (
              <div className="space-y-4">
                {replies?.map((reply: any) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={reply.id} 
                    className="flex gap-3"
                  >
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold text-xs flex-shrink-0 border border-slate-200/50">
                      {reply.from?.user?.displayName?.charAt(0) || 'R'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="font-bold text-xs text-slate-800 truncate">{reply.from?.user?.displayName || 'Responder'}</span>
                        <span className="text-[9px] text-slate-400 font-medium">
                          {new Date(reply.createdDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="inline-block bg-slate-50 p-3 rounded-xl rounded-tl-none border border-slate-100 text-xs text-slate-600 break-words max-w-full">
                        <div dangerouslySetInnerHTML={{ __html: reply.body?.content }} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Input Section */}
          <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 mt-auto">
            <div className="relative flex items-end gap-2 bg-white rounded-xl border border-slate-200 p-1.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-50/50 transition-all shadow-xs">
              <textarea 
                placeholder="Type real-time dispatch reply..."
                className="flex-1 bg-transparent border-none p-2 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none min-h-[40px] max-h-[120px] resize-y"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              <button 
                onClick={handleSendReply}
                disabled={isReplying || !replyContent.trim()}
                className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-40 disabled:hover:bg-blue-600 flex-shrink-0 self-end shadow-xs active:scale-95"
                title="Send Reply (Enter)"
              >
                {isReplying ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-2 px-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Press Enter to send</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" /> Live Graph Dispatch
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
