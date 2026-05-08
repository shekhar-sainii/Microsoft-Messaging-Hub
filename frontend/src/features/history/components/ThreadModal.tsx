import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Reply, Send, MessageSquare } from 'lucide-react';
import { useMessageReplies, useReplyMessage } from '../../../hooks/useMessagesData';
import { useState } from 'react';
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
      messageId: message.id,
      content: replyContent
    }, {
      onSuccess: () => {
        setReplyContent('');
        toast.success('Reply sent');
      },
      onError: (err: any) => toast.error(err.message || 'Failed to reply')
    });
  };

  if (!isOpen || !message) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col h-[80vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Conversation Thread</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Live from Teams</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Original Message */}
          <div className="flex gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold flex-shrink-0">
              {message.from?.user?.displayName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-slate-900">{message.from?.user?.displayName || 'User'}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Original</span>
              </div>
              <div 
                className="text-sm text-slate-700 prose prose-sm max-w-none bg-blue-50/50 p-4 rounded-2xl rounded-tl-none border border-blue-100/50"
                dangerouslySetInnerHTML={{ __html: message.body?.content || message.content }} 
              />
            </div>
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Replies</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          {/* Replies */}
          {isLoading ? (
            <div className="py-10 text-center text-slate-400 font-bold text-sm">Fetching replies...</div>
          ) : replies?.length === 0 ? (
            <div className="py-10 text-center text-slate-300 font-bold text-sm">No replies yet.</div>
          ) : (
            replies?.map((reply: any) => (
              <div key={reply.id} className="flex gap-4">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold text-xs flex-shrink-0">
                  {reply.from?.user?.displayName?.charAt(0) || 'R'}
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-bold text-slate-800 text-sm">{reply.from?.user?.displayName || 'Responder'}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{new Date(reply.createdDateTime).toLocaleTimeString()}</span>
                  </div>
                  <div 
                    className="text-sm text-slate-600 bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100"
                    dangerouslySetInnerHTML={{ __html: reply.body?.content }} 
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <div className="relative group">
            <textarea 
              placeholder="Type your reply..."
              className="w-full bg-white border border-slate-200 rounded-2xl p-4 pr-16 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all min-h-[80px] resize-none shadow-inner"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
            />
            <button 
              onClick={handleSendReply}
              disabled={isReplying || !replyContent.trim()}
              className="absolute right-4 bottom-4 p-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:shadow-none"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Press Send to post directly to Microsoft Teams</p>
        </div>
      </motion.div>
    </div>
  );
};
