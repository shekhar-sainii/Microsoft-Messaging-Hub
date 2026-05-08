import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Search, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { NAVIGATION_TABS } from '../config/navigation';
import { LogoutButton } from '../features/auth/components/LogoutButton';
import { TeamsSidebar } from '../components/TeamsSidebar';
import { AdminConsentBanner } from '../features/auth/components/AdminConsentBanner';
import { Toaster } from 'react-hot-toast';

export const MainLayout: React.FC = () => {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [globalSearch, setGlobalSearch] = useState('');

    const filteredTabs = NAVIGATION_TABS.filter(tab => {
        if (!tab.roles) return true;
        const userRole = (user?.role || 'user').toString().toLowerCase();
        return (tab.roles as any).some((role: string) => role.toLowerCase() === userRole);
    });

    // Safety fallback: if for some reason filteredTabs is empty, show all non-admin tabs
    const displayTabs = filteredTabs.length > 0 ? filteredTabs : NAVIGATION_TABS.filter(t => !(t as any).roles?.includes('admin') || (t as any).roles?.includes('user'));

    const activeTab = NAVIGATION_TABS.find(tab => location.pathname.startsWith(tab.path))?.id || 'dashboard';
    const activeTabData = NAVIGATION_TABS.find(t => t.id === activeTab);
    
    const needsSidebar = location.pathname.startsWith('/workspace') || location.pathname.startsWith('/builder');
    const [isSidebarOpen, setIsSidebarOpen] = useState(needsSidebar);

    useEffect(() => {
        setIsSidebarOpen(needsSidebar);
    }, [needsSidebar]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center space-y-4 z-[100]">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Synchronizing Node...</p>
            </div>
        );
    }

    const workspaceMatch = location.pathname.match(/\/workspace\/([^/]+)\/([^/]+)/);
    const selectedChannelId = workspaceMatch ? workspaceMatch[2] : undefined;

    const handleChannelSelect = (teamId: string, channelId: string) => {
        navigate(`/workspace/${teamId}/${channelId}`);
    };

    const handleGlobalSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && globalSearch.trim()) {
            // Redirect to history with search param
            navigate(`/history?q=${encodeURIComponent(globalSearch.trim())}`);
            setGlobalSearch('');
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-50 flex overflow-hidden w-screen h-screen">
            <AdminConsentBanner />
            
            {/* Primary Sidebar */}
            <aside className="w-16 md:w-20 bg-slate-950 flex flex-col items-center py-6 flex-shrink-0 z-40 border-r border-white/5 relative shadow-2xl overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-32 bg-blue-600/20 blur-[50px] -z-10 rounded-full opacity-40" />
                
                <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    onClick={() => navigate('/dashboard')}
                    className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-indigo-700 rounded-xl flex items-center justify-center text-white mb-8 shadow-xl shadow-blue-500/20 border border-white/10 cursor-pointer flex-shrink-0"
                >
                    <MessageSquare size={20} strokeWidth={2.5} />
                </motion.div>

                <nav className="flex flex-col gap-1.5 w-full px-2 flex-1 overflow-y-auto custom-scrollbar-hide">
                    {displayTabs.map((tab) => {
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => navigate(tab.path)}
                                title={tab.title}
                                className={`w-full aspect-square flex flex-col items-center justify-center rounded-xl transition-all duration-300 relative group ${
                                    isActive ? 'text-white' : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                                }`}
                            >
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeTabIndicator" 
                                        className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg shadow-blue-500/20 z-0"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                    />
                                )}
                                <div className="relative z-10 flex flex-col items-center gap-1">
                                    <tab.icon size={18} strokeWidth={isActive ? 2.5 : 2} className="transition-transform group-hover:scale-110" />
                                    <span className={`text-[6px] md:text-[7px] font-black tracking-widest uppercase transition-all ${isActive ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
                                        {tab.label}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </nav>
                
                <div className="mt-auto w-full px-2 pt-4 flex-shrink-0">
                    <div className="h-px w-6 bg-white/5 mx-auto mb-4" />
                    <LogoutButton />
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden w-full relative">
                <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/50 px-6 md:px-8 py-3 flex items-center justify-between z-20 flex-shrink-0 h-[56px] md:h-[64px]">
                    <div className="flex items-center gap-4">
                        <span className="text-base md:text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tighter uppercase italic">Teams Hub</span>
                        <div className="h-3 w-px bg-slate-300 mx-1" />
                        <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest">{activeTabData?.title}</span>
                    </div>

                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100/50 border border-slate-200 rounded-lg text-slate-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all shadow-inner">
                            <Search size={14} />
                            <input 
                                type="text" 
                                placeholder="Global Search..." 
                                value={globalSearch}
                                onChange={(e) => setGlobalSearch(e.target.value)}
                                onKeyDown={handleGlobalSearch}
                                className="bg-transparent border-none text-xs w-32 xl:w-48 font-medium focus:ring-0 outline-none placeholder:text-slate-400" 
                            />
                        </div>

                        <div className="relative group">
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                className="flex items-center gap-2 p-1 pr-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 cursor-pointer"
                            >
                                <div className="relative">
                                    <div className="w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white text-xs">
                                        {user?.displayName?.charAt(0) || <User size={14} />}
                                    </div>
                                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                                </div>
                                <div className="flex flex-col items-start hidden sm:flex text-left">
                                    <p className="text-[11px] font-black text-slate-800 leading-none truncate max-w-[100px]">{user?.displayName}</p>
                                    <p className={`text-[8px] font-black uppercase tracking-[0.1em] mt-0.5 px-2 py-0.5 rounded-md ${user?.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'text-indigo-600'}`}>
                                        {user?.role || 'Enterprise'}
                                    </p>
                                </div>
                            </motion.button>
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden w-full relative">
                    <AnimatePresence initial={false}>
                        {isSidebarOpen && (
                            <motion.aside 
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 280, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                                className="border-r border-slate-200/60 bg-white flex-shrink-0 z-30 shadow-[4px_0_24px_rgba(0,0,0,0.01)] overflow-hidden relative"
                            >
                                <div className="w-[280px] h-full">
                                    <TeamsSidebar
                                        onChannelSelect={handleChannelSelect}
                                        selectedChannelId={selectedChannelId}
                                    />
                                </div>
                                <button 
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-300 hover:text-blue-600 transition-all shadow-sm z-50 group"
                                >
                                    <ChevronLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
                                </button>
                            </motion.aside>
                        )}
                    </AnimatePresence>

                    {!isSidebarOpen && (
                        <button 
                            onClick={() => setIsSidebarOpen(true)}
                            className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-8 bg-white border border-slate-200 border-l-0 rounded-r-full flex items-center justify-center text-slate-300 hover:text-blue-600 transition-all shadow-sm z-30 group"
                        >
                            <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    )}

                    <main className="flex-1 overflow-hidden relative bg-slate-50/30">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={location.pathname}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="h-full w-full overflow-y-auto custom-scrollbar"
                            >
                                <div className="p-6 md:p-8 w-full min-h-full max-w-[1600px] mx-auto">
                                    <Outlet />
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </main>
                </div>
                <Toaster position="bottom-right" reverseOrder={false} />
            </div>
        </div>
    );
};
