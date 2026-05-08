import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Hash, Info, Shield, Calendar, Activity, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { TeamsService } from '../../api/services/teams.service';

interface ChannelInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  channelId: string;
  teamName: string;
}

export const ChannelInfoModal: React.FC<ChannelInfoModalProps> = ({ isOpen, onClose, teamId, channelId, teamName }) => {
  const { data: channel, isLoading: channelLoading } = useQuery({
    queryKey: ['channel-details', teamId, channelId],
    queryFn: () => TeamsService.getChannelDetails(teamId, channelId),
    enabled: isOpen
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => TeamsService.getTeamMembers(teamId),
    enabled: isOpen
  });

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] w-full max-w-xl overflow-hidden border border-white/20 relative z-10 flex flex-col md:flex-row"
      >
        {/* Compact Left Visual Sidebar */}
        <div className="md:w-[35%] bg-gradient-to-br from-blue-600 to-indigo-800 p-8 flex flex-col justify-between text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-2xl rounded-full -mr-12 -mt-12" />
            
            <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-xl mb-6">
                    <Hash size={24} className="text-white" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-xl font-black tracking-tight uppercase italic leading-tight">{channel?.displayName || 'Channel'}</h2>
                    <p className="text-blue-100/60 text-[9px] font-bold uppercase tracking-[0.2em]">{teamName}</p>
                </div>
            </div>

            <div className="relative z-10 space-y-3 mt-8">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                        <Activity size={12} />
                    </div>
                    <span className="text-[10px] font-bold">Active Sync</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center">
                        <Shield size={12} />
                    </div>
                    <span className="text-[10px] font-bold">Encrypted</span>
                </div>
            </div>
        </div>

        {/* Compact Right Content Area */}
        <div className="flex-1 p-8 bg-white flex flex-col">
          <div className="flex justify-between items-start mb-6">
             <div className="space-y-1">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[8px] font-black uppercase tracking-widest border border-blue-100">Details</span>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Overview</h3>
             </div>
             <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-300 hover:text-red-500">
               <X size={20} />
             </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Participants</p>
                  <p className="text-xl font-black text-slate-900 leading-none">{membersLoading ? '...' : members?.length || 0}</p>
              </div>
              <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Type</p>
                  <p className="text-[10px] font-black text-slate-900 uppercase truncate">{channel?.membershipType || 'Standard'}</p>
              </div>
          </div>

          <div className="space-y-5">
              <div className="space-y-2">
                  <div className="flex items-center gap-2 text-slate-400">
                      <Info size={12} />
                      <span className="text-[9px] font-black uppercase tracking-widest">About</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100/50 italic">
                      {channel?.description || 'Collaborative messaging environment.'}
                  </p>
              </div>

              {members && members.length > 0 && (
                  <div className="space-y-3">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Members</span>
                      <div className="flex -space-x-2">
                          {members.slice(0, 5).map((member: any) => (
                              <div 
                                  key={member.id} 
                                  className="h-8 w-8 rounded-lg ring-2 ring-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm"
                              >
                                  {member.displayName?.charAt(0)}
                              </div>
                          ))}
                          {members.length > 5 && (
                              <div className="h-8 w-8 rounded-lg ring-2 ring-white bg-slate-900 flex items-center justify-center text-[9px] font-black text-white shadow-lg">
                                  +{members.length - 5}
                              </div>
                          )}
                      </div>
                  </div>
              )}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-6">
              <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                  Graph v1.4
              </div>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg"
              >
                Close
              </button>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
