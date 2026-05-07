import React, { useState, useEffect } from 'react';
import { useTeams, useChannels } from '../hooks/useTeamsData';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../auth/useAuth';
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Hash, Search, RefreshCw, Shield, Star } from 'lucide-react';

interface TeamsSidebarProps {
    onChannelSelect: (teamId: string, channelId: string) => void;
    selectedChannelId?: string;
}

export const TeamsSidebar: React.FC<TeamsSidebarProps> = ({ onChannelSelect, selectedChannelId }) => {
    const { data: teams, isLoading: teamsLoading, refetch } = useTeams();
    const { user } = useAuth();
    const { subscribeToChannel, unsubscribeFromChannel } = useSocket(user?.microsoftId);
    const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState("");
    const [favorites, setFavorites] = useState<string[]>(() => {
        const saved = localStorage.getItem('hub_favorites');
        return saved ? JSON.parse(saved) : [];
    });
    const [activeChannel, setActiveChannel] = useState<{ teamId: string; channelId: string } | null>(null);

    useEffect(() => {
        localStorage.setItem('hub_favorites', JSON.stringify(favorites));
    }, [favorites]);

    const handleChannelSelect = (teamId: string, channelId: string) => {
        // Unsubscribe from previous channel
        if (activeChannel) {
            unsubscribeFromChannel(activeChannel.teamId, activeChannel.channelId);
        }
        // Subscribe to new channel for live replies
        subscribeToChannel(teamId, channelId);
        setActiveChannel({ teamId, channelId });
        onChannelSelect(teamId, channelId);
    };

    const toggleFavorite = (e: React.MouseEvent, teamId: string) => {
        e.stopPropagation();
        setFavorites(prev => 
            prev.includes(teamId) ? prev.filter(id => id !== teamId) : [...prev, teamId]
        );
    };

    const toggleTeam = (teamId: string) => {
        setExpandedTeams(prev => ({
            ...prev,
            [teamId]: !prev[teamId]
        }));
    };

    const filteredTeams = teams?.filter((team: any) => 
        team.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort: Favorites first, then alphabetical
    const sortedTeams = filteredTeams ? [...filteredTeams].sort((a, b) => {
        const aFav = favorites.includes(a.id);
        const bFav = favorites.includes(b.id);
        if (aFav && !bFav) return -1;
        if (!aFav && bFav) return 1;
        return a.displayName.localeCompare(b.displayName);
    }) : [];

    return (
        <div className="flex flex-col h-full bg-white/50 backdrop-blur-md border-r border-slate-200">
            <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Workspaces</h3>
                    <motion.button 
                        whileTap={{ rotate: 180 }}
                        onClick={() => refetch()}
                        className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors"
                    >
                        <RefreshCw size={14} />
                    </motion.button>
                </div>
                
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search teams..." 
                        className="w-full pl-9 pr-4 py-2 bg-slate-100/50 border border-transparent rounded-xl text-sm font-medium focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1 custom-scrollbar">
                {teamsLoading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonItem key={i} />)}
                    </div>
                ) : sortedTeams.length === 0 ? (
                    <div className="text-center py-20 px-6">
                        <p className="text-sm font-bold text-slate-500">No teams found</p>
                    </div>
                ) : (
                    sortedTeams.map((team: any, index: number) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            key={team.id}
                        >
                            <TeamItem 
                                team={team} 
                                isExpanded={!!expandedTeams[team.id]}
                                isFavorite={favorites.includes(team.id)}
                                onToggle={() => toggleTeam(team.id)}
                                onToggleFavorite={(e: any) => toggleFavorite(e, team.id)}
                                onChannelSelect={handleChannelSelect}
                                selectedChannelId={selectedChannelId}
                            />
                        </motion.div>
                    ))
                )}
            </div>
            
            <div className="p-4 bg-slate-50/50 border-t border-slate-100">
                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <Shield size={16} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Security</p>
                        <p className="text-xs font-bold text-slate-700 mt-1">Managed Session</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TeamItem = ({ team, isExpanded, isFavorite, onToggle, onToggleFavorite, onChannelSelect, selectedChannelId }: any) => {
    const { data: channels, isLoading: channelsLoading } = useChannels(isExpanded ? team.id : null);

    return (
        <div className="space-y-0.5">
            <button 
                onClick={onToggle}
                className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-all group relative ${isExpanded ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
                <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90 text-blue-600' : 'text-slate-300'}`}>
                    <ChevronRight size={14} />
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black uppercase transition-all ${isExpanded ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' : 'bg-white border border-slate-200 text-slate-400 group-hover:border-blue-200 group-hover:text-blue-500'}`}>
                    {team.displayName.substring(0, 2)}
                </div>
                <span className="text-sm font-bold truncate flex-1 tracking-tight">{team.displayName}</span>
                
                <button 
                    onClick={onToggleFavorite}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white rounded-md ${isFavorite ? 'opacity-100 text-amber-400' : 'text-slate-300'}`}
                >
                    <Star size={14} fill={isFavorite ? "currentColor" : "none"} />
                </button>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="ml-10 py-1 space-y-0.5 border-l-2 border-blue-100/50 my-1">
                            {channelsLoading ? (
                                <div className="space-y-1 px-4">
                                    <div className="h-4 bg-slate-100 rounded-md animate-pulse w-3/4" />
                                    <div className="h-4 bg-slate-100 rounded-md animate-pulse w-1/2" />
                                </div>
                            ) : (
                                channels?.map((channel: any) => (
                                    <button 
                                        key={channel.id}
                                        onClick={() => onChannelSelect(team.id, channel.id)}
                                        className={`w-full flex items-center gap-3 py-1.5 px-4 rounded-lg text-left transition-all relative ${selectedChannelId === channel.id ? 'text-blue-700 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                                    >
                                        <Hash size={12} className={selectedChannelId === channel.id ? 'text-blue-500' : 'text-slate-300'} />
                                        <span className={`text-[13px] truncate ${selectedChannelId === channel.id ? 'font-black' : 'font-semibold'}`}>
                                            {channel.displayName}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SkeletonItem = () => (
    <div className="flex items-center gap-3 p-2 rounded-xl animate-pulse">
        <div className="w-4 h-4 bg-slate-200 rounded" />
        <div className="w-8 h-8 bg-slate-200 rounded-lg" />
        <div className="h-4 bg-slate-200 rounded-md flex-1" />
    </div>
);
