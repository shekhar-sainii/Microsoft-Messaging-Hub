import React, { useState, useMemo } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { useGetTeamsQuery, useGetChannelsQuery } from '../features/teams/teamsApi';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../auth/useAuth';
import { 
  useGetFavouritesQuery, 
  useAddFavouriteMutation, 
  useRemoveFavouriteMutation 
} from '../features/favourites/favouritesApi';
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Hash, Search, RefreshCw, Shield, Star, Pin, Zap, Globe, Info, X } from 'lucide-react';
import { ChannelInfoModal } from './modals/ChannelInfoModal';
import { useDebounce } from '../hooks/useDebounce';

interface TeamsSidebarProps {
    onChannelSelect: (teamId: string, channelId: string) => void;
    selectedChannelId?: string;
}

export const TeamsSidebar: React.FC<TeamsSidebarProps> = ({ onChannelSelect, selectedChannelId }) => {
    const { data: teams, isLoading: teamsLoading, refetch } = useGetTeamsQuery();
    const { user } = useAuth();
    const { data: serverFavs } = useGetFavouritesQuery();
    const [addFav] = useAddFavouriteMutation();
    const [removeFav] = useRemoveFavouriteMutation();
    
    const { subscribeToChannel, unsubscribeFromChannel } = useSocket(user?.microsoftId);
    const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState("");
    const debouncedSearch = useDebounce(searchTerm, 300);
    
    const [activeChannel, setActiveChannel] = useState<{ teamId: string; channelId: string } | null>(null);

    const [infoModal, setInfoModal] = useState<{ isOpen: boolean; teamId: string; channelId: string; teamName: string }>({
        isOpen: false,
        teamId: '',
        channelId: '',
        teamName: ''
    });

    const favoriteChannelIds = serverFavs?.map(f => f.channelId) || [];

    const handleChannelSelect = (teamId: string, channelId: string) => {
        if (activeChannel) {
            unsubscribeFromChannel(activeChannel.teamId, activeChannel.channelId);
        }
        subscribeToChannel(teamId, channelId);
        
        const selection = { teamId, channelId };
        setActiveChannel(selection);
        localStorage.setItem('selectedChannel', JSON.stringify(selection));
        onChannelSelect(teamId, channelId);
    };

    const showInfo = (e: React.MouseEvent, teamId: string, channelId: string, teamName: string) => {
        e.stopPropagation();
        setInfoModal({
            isOpen: true,
            teamId,
            channelId,
            teamName
        });
    };

    const toggleTeam = (teamId: string) => {
        setExpandedTeams(prev => ({
            ...prev,
            [teamId]: !prev[teamId]
        }));
    };

    // Advanced filtering using debounced value
    const filteredTeams = useMemo(() => {
        if (!teams) return [];
        return teams.filter((team: any) => 
            team.displayName.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [teams, debouncedSearch]);

    const filteredFavs = useMemo(() => {
        if (!serverFavs) return [];
        return serverFavs.filter((fav: any) => 
            fav.channelName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            fav.teamName.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [serverFavs, debouncedSearch]);

    const sortedTeams = useMemo(() => {
        return [...filteredTeams].sort((a, b) => a.displayName.localeCompare(b.displayName));
    }, [filteredTeams]);

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Sidebar Header */}
            <div className="p-6 pb-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                            <Globe size={18} />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-slate-800 tracking-tight leading-none uppercase italic">Network</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">V3 Live</p>
                        </div>
                    </div>
                    <motion.button 
                        whileTap={{ rotate: 180 }}
                        onClick={() => refetch()}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                    >
                        <RefreshCw size={14} />
                    </motion.button>
                </div>
                
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={14} />
                    <input 
                        type="text" 
                        placeholder="Search workspace..." 
                        className="w-full pl-10 pr-10 py-3 bg-slate-100/50 border border-transparent rounded-xl text-xs font-bold focus:outline-none focus:bg-white focus:border-blue-400/50 transition-all placeholder:text-slate-400"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6 custom-scrollbar">
                {/* Search Results / Pinned Section */}
                {filteredFavs.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 px-2">
                             <Star size={10} className="text-amber-500 fill-amber-500" />
                             <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{debouncedSearch ? 'Matching Channels' : 'Pinned Channels'}</h4>
                        </div>
                        <div className="space-y-1">
                            {filteredFavs.map((fav: any) => (
                                <div key={`${fav.teamId}-${fav.channelId}`} className="group relative">
                                    <button 
                                        onClick={() => handleChannelSelect(fav.teamId, fav.channelId)}
                                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all relative overflow-hidden ${selectedChannelId === fav.channelId ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-600 hover:bg-white hover:shadow-md border border-transparent hover:border-slate-100'}`}
                                    >
                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black transition-colors ${selectedChannelId === fav.channelId ? 'bg-white/20' : 'bg-amber-50 text-amber-600'}`}>
                                            {fav.teamName?.substring(0, 2) || '??'}
                                        </div>
                                        <div className="flex-1 truncate">
                                            <p className="text-[11px] font-black truncate leading-tight">{fav.channelName}</p>
                                            <p className={`text-[8px] font-bold truncate ${selectedChannelId === fav.channelId ? 'text-blue-100' : 'text-slate-400'}`}>{fav.teamName}</p>
                                        </div>
                                    </button>
                                    <button 
                                        onClick={(e) => showInfo(e, fav.teamId, fav.channelId, fav.teamName)}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 ${selectedChannelId === fav.channelId ? 'text-white/70 hover:text-white' : 'text-slate-300 hover:text-blue-600'}`}
                                    >
                                        <Info size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* All Teams Section */}
                <div className="space-y-2">
                    {!debouncedSearch && (
                        <div className="flex items-center gap-2 px-2">
                             <Zap size={10} className="text-blue-600" />
                             <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Organizations</h4>
                        </div>
                    )}
                    
                    <div className="space-y-1">
                        {teamsLoading ? (
                            <div className="space-y-3 px-2">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-10 bg-slate-50 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : sortedTeams.length === 0 ? (
                            <div className="py-10 text-center">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No organizations found</p>
                            </div>
                        ) : (
                            sortedTeams.map((team: any, index: number) => (
                                <TeamItem 
                                    key={team.id}
                                    index={index}
                                    team={team} 
                                    isExpanded={!!expandedTeams[team.id] || !!debouncedSearch}
                                    favoriteChannelIds={favoriteChannelIds}
                                    onToggle={() => toggleTeam(team.id)}
                                    onToggleFavorite={(e: any, t: any, cid: any, cn: any) => {
                                        e.stopPropagation();
                                        const isFav = favoriteChannelIds.includes(cid);
                                        if (isFav) removeFav(cid);
                                        else addFav({ teamId: t.id, channelId: cid, teamName: t.displayName, channelName: cn });
                                    }}
                                    onShowInfo={showInfo}
                                    onChannelSelect={handleChannelSelect}
                                    selectedChannelId={selectedChannelId}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
            
            <div className="p-4 mt-auto">
                <div className="p-4 bg-slate-900 rounded-2xl text-white relative overflow-hidden group border border-white/5">
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center border border-white/10">
                            <Shield size={16} className="text-blue-400" />
                        </div>
                        <div>
                            <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest leading-none">SafeSync</p>
                            <p className="text-[10px] font-bold mt-1">Enterprise active</p>
                        </div>
                    </div>
                </div>
            </div>

            <ChannelInfoModal 
                isOpen={infoModal.isOpen}
                onClose={() => setInfoModal(prev => ({ ...prev, isOpen: false }))}
                teamId={infoModal.teamId}
                channelId={infoModal.channelId}
                teamName={infoModal.teamName}
            />
        </div>
    );
};

const TeamItem = ({ team, index, isExpanded, favoriteChannelIds, onToggle, onToggleFavorite, onShowInfo, onChannelSelect, selectedChannelId }: any) => {
    const { data: channels, isLoading: channelsLoading } = useGetChannelsQuery(isExpanded ? team.id : skipToken);

    return (
        <div className="space-y-1">
            <button 
                onClick={onToggle}
                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all group relative ${isExpanded ? 'bg-white shadow-sm border border-slate-100' : 'text-slate-600 border-transparent hover:bg-white hover:shadow-sm'}`}
            >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${isExpanded ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {team.displayName.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 truncate">
                    <p className="text-[11px] font-black truncate tracking-tight text-slate-800">{team.displayName}</p>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Org</p>
                </div>
                <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-90 text-blue-600' : 'text-slate-300'}`}>
                    <ChevronRight size={14} />
                </div>
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="ml-6 my-1 py-1 space-y-0.5 border-l border-slate-100">
                            {channelsLoading ? (
                                <div className="h-4 bg-slate-50 rounded mx-4 animate-pulse" />
                            ) : (
                                channels?.map((channel: any) => (
                                    <div key={channel.id} className="group/channel flex items-center gap-1 pl-3 pr-1 relative">
                                        <button 
                                            onClick={() => onChannelSelect(team.id, channel.id)}
                                            className={`flex-1 flex items-center gap-2 py-1.5 px-3 rounded-lg text-left transition-all ${selectedChannelId === channel.id ? 'text-blue-700 bg-blue-50/50 font-black' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 font-bold'}`}
                                        >
                                            <Hash size={12} className={selectedChannelId === channel.id ? 'text-blue-500' : 'text-slate-300'} />
                                            <span className="text-[10px] truncate">{channel.displayName}</span>
                                        </button>
                                        <button 
                                            onClick={(e) => onToggleFavorite(e, team, channel.id, channel.displayName)}
                                            className={`p-1 rounded-md transition-all ${favoriteChannelIds.includes(channel.id) ? 'text-amber-500' : 'text-slate-200 opacity-0 group-hover/channel:opacity-100 hover:text-amber-500'}`}
                                        >
                                            <Star size={12} fill={favoriteChannelIds.includes(channel.id) ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
