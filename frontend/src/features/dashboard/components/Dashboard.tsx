import React, { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { 
  BarChart2, Zap, Bell, Shield, Hash, 
  ChevronRight, ArrowUpRight, Activity, 
  MessageSquare, Clock, Users, Globe, PenTool
} from "lucide-react";

import { MessageComposer } from '../../composer/components/MessageComposer';
import { useSendMessage } from '../../../hooks/useMessagesData';
import { useAnalyticsStats } from '../../../hooks/useAnalyticsData';
import { useSocket } from '../../../hooks/useSocket';
import toast from 'react-hot-toast';

interface DashboardProps {
  user: any;
  selectedChannel: { teamId: string, channelId: string } | null;
  onOpenBuilder: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, selectedChannel, onOpenBuilder }) => {
  const { mutate: sendMessage } = useSendMessage();
  const { data: analyticsData } = useAnalyticsStats();
  const { on, off } = useSocket(user?.microsoftId);
  const [liveReplies, setLiveReplies] = useState<any[]>([]);

  // Listen for live reply and update events from the webhook
  useEffect(() => {
    on('message:reply', (data: any) => {
      setLiveReplies(prev => [data.reply, ...prev].slice(0, 10));
      toast(`New reply from ${data.reply?.from || 'someone'}`, { icon: '💬' });
    });

    on('message:updated', (data: any) => {
      toast(`Message updated in Teams`, { icon: '✏️' });
    });

    return () => {
      off('message:reply');
      off('message:updated');
    };
  }, [on, off]);
  const stats = [
    { label: "Active Subs", value: "24", icon: Bell, color: "blue", trend: "+12%" },
    { label: "Total Sent", value: "1,284", icon: MessageSquare, color: "green", trend: "+8%" },
    { label: "Failures", value: "3", icon: Zap, color: "red", trend: "-20%" },
    { label: "Uptime", value: "99.9%", icon: Shield, color: "indigo", trend: "Stable" }
  ];

  return (
    <div className="w-full space-y-10 pb-20">
      {/* Welcome Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">
            Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">{user?.displayName?.split(' ')[0]}</span>!
          </h2>
          <p className="text-slate-500 font-medium text-lg mt-1">Here's what's happening in your Microsoft environment today.</p>
        </motion.div>
        
        <div className="flex items-center gap-3">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-10 h-10 rounded-xl border-4 border-slate-50 bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 ring-2 ring-slate-100">
                {String.fromCharCode(64 + i)}
              </div>
            ))}
            <div className="w-10 h-10 rounded-xl border-4 border-slate-50 bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
              +12
            </div>
          </div>
          <div className="h-10 w-px bg-slate-200 mx-2" />
          <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <Activity size={18} className="text-blue-600" />
            Live Logs
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            key={i} 
            className="glass-card p-8 rounded-[2rem] group cursor-pointer relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-${stat.color}-500/10 transition-colors`} />
            
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className={`w-14 h-14 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 flex items-center justify-center shadow-inner`}>
                <stat.icon size={28} />
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${stat.trend.startsWith('+') ? 'bg-green-100 text-green-600' : stat.trend === 'Stable' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-700'}`}>
                {stat.trend}
              </div>
            </div>
            
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest relative z-10">{stat.label}</p>
            <div className="flex items-baseline gap-2 mt-2 relative z-10">
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
              <ArrowUpRight size={16} className="text-slate-300" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hero Action Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          {selectedChannel ? (
            <>
              <motion.div 
                initial={{ opacity: 0, scale: 0.99 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] p-12 text-white relative overflow-hidden group shadow-2xl shadow-blue-200"
              >
                <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                  <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-white rounded-full blur-[100px]" />
                  <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] bg-blue-400 rounded-full blur-[80px]" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                  <div className="flex items-center gap-8">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/30 shadow-inner group-hover:scale-110 transition-transform duration-500">
                      <Hash size={48} className="text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">Selected Channel</span>
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      </div>
                      <h3 className="text-4xl font-black mt-3 tracking-tight">Active Connection</h3>
                      <p className="text-blue-100 font-medium mt-2 text-lg opacity-80">ID: {selectedChannel.channelId}</p>
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onOpenBuilder}
                    className="px-10 py-5 bg-white text-blue-600 rounded-3xl font-black hover:bg-slate-50 transition-all shadow-2xl shadow-blue-900/20 active:scale-95 text-lg flex items-center gap-3"
                  >
                    <PenTool size={22} />
                    Open Card Builder
                  </motion.button>
                </div>
              </motion.div>
              
              <MessageComposer 
                onSend={(html, mentions) => {
                  sendMessage({
                    teamId: selectedChannel.teamId,
                    channelId: selectedChannel.channelId,
                    content: html,
                    mentions
                  });
                }}
              />
            </>
          ) : (
            <div className="bg-white border-4 border-dashed border-slate-100 rounded-[3rem] p-32 text-center h-full flex flex-col items-center justify-center group hover:border-blue-100 transition-colors">
              <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 mx-auto mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500 group-hover:text-blue-200">
                <Globe size={48} />
              </div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">No Context Selected</h3>
              <p className="text-slate-400 mt-4 max-w-md mx-auto text-lg leading-relaxed font-medium">
                Pick a workspace from the sidebar to activate real-time messaging and adaptive card delivery.
              </p>
              <div className="mt-10 flex items-center gap-2 text-blue-500 font-black uppercase tracking-widest text-xs">
                <Clock size={16} />
                Awaiting Microsoft Graph Sync
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="glass-card rounded-[2.5rem] p-8 h-full">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center justify-between">
              Recent Activity
              <span className="text-[10px] bg-slate-100 px-3 py-1 rounded-full text-slate-500 uppercase tracking-widest">Live</span>
            </h3>
            <div className="space-y-6">
              {[
                { type: "Message Sent", time: "2m ago", user: "You", status: "Success" },
                { type: "New Member", time: "15m ago", user: "System", status: "Sync" },
                { type: "Card Failed", time: "1h ago", user: "You", status: "Retry" },
                { type: "Subscription", time: "3h ago", user: "Admin", status: "Renewed" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <div className={`w-2 h-10 rounded-full ${item.status === 'Success' ? 'bg-green-500' : item.status === 'Retry' ? 'bg-red-500' : 'bg-blue-500'} opacity-20 group-hover:opacity-100 transition-opacity`} />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <p className="text-sm font-black text-slate-800">{item.type}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">Initiated by {item.user}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-200 group-hover:text-blue-500 transition-colors" />
                </div>
              ))}
            </div>
            <button className="w-full mt-10 py-4 border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all">
              View Full Audit Trail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
