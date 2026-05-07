import { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Search, User, Globe } from "lucide-react";
import { Toaster } from 'react-hot-toast';

// Config & Auth
import { useAuth } from "./auth/useAuth";
import { NAVIGATION_TABS, SPLASH_FEATURES } from "./config/navigation";
import type { TabId } from "./config/navigation";

// Components
import { LogoutButton } from "./features/auth/components/LogoutButton";
import { TeamsSidebar } from "./components/TeamsSidebar";
import { AdminConsentBanner } from "./features/auth/components/AdminConsentBanner";

function App() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [selectedChannel, setSelectedChannel] = useState<{ teamId: string, channelId: string } | null>(null);

  const activeTabData = NAVIGATION_TABS.find(t => t.id === activeTab);

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 bg-[#fdfdff] flex flex-col overflow-y-auto w-screen h-screen custom-scrollbar">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-blue-100/40 to-indigo-100/20 rounded-full blur-[140px] -z-10 animate-float" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tr from-purple-100/30 to-blue-50/20 rounded-full blur-[140px] -z-10 animate-float" style={{ animationDelay: '3s' }} />

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-screen p-8 w-full relative z-10"
      >
        <div className="max-w-[480px] w-full glass-card rounded-[2.5rem] p-12 relative overflow-visible shadow-2xl">
          <div className="flex flex-col items-center mb-12">
            <motion.div 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="w-24 h-24 premium-gradient rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl"
            >
              <MessageSquare size={48} strokeWidth={1.5} />
            </motion.div>
            
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter text-center">
              Teams<span className="text-blue-600">Hub</span>
            </h1>
            
            <p className="text-slate-500 mt-4 text-center text-base font-medium leading-relaxed">
              Seamless <span className="text-slate-800 font-bold">Microsoft Teams</span> integration.
            </p>
          </div>

          <div className="space-y-4 mb-12">
            {SPLASH_FEATURES.map((item, i) => (
              <div key={i} className="flex items-center gap-5 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-xl flex items-center justify-center shadow-sm`}>
                  <item.icon size={22} />
                </div>
                <p className="text-sm font-bold text-slate-800">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center min-h-[100px] w-full">
            {isLoading ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="w-10 h-10 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Securing Connection...</p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center">
                <motion.button
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => login()}
                    className="w-full flex items-center justify-center gap-4 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-2xl shadow-slate-200 hover:shadow-slate-300 hover:bg-slate-800 transition-all border border-slate-700/50 relative z-30"
                >
                    <div className="bg-white/10 p-1.5 rounded-lg border border-white/10">
                        <Globe size={20} className="text-blue-400" />
                    </div>
                    <span className="text-base tracking-tight">Sign in with Microsoft</span>
                </motion.button>
                
                <div className="flex items-center justify-center gap-2 mt-8 opacity-50">
                  <div className="h-[1px] w-8 bg-slate-300" />
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Enterprise SSO</p>
                  <div className="h-[1px] w-8 bg-slate-300" />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <p className="mt-12 text-slate-400 text-[10px] font-black uppercase tracking-widest">
          &copy; 2026 Teams Hub Architecture
        </p>
      </motion.div>
    </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 flex overflow-hidden w-screen h-screen">
      <AdminConsentBanner />
      <aside className="w-24 bg-slate-950 flex flex-col items-center py-8 flex-shrink-0 z-30 border-r border-white/5 relative">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 inset-x-0 h-40 bg-blue-600/20 blur-[60px] -z-10 rounded-full opacity-50" />
        <div className="absolute bottom-0 inset-x-0 h-40 bg-indigo-600/10 blur-[60px] -z-10 rounded-full opacity-30" />

        <motion.div 
          whileHover={{ scale: 1.05, rotate: 5 }}
          className="w-14 h-14 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-[1.25rem] flex items-center justify-center text-white mb-12 shadow-2xl shadow-blue-500/20 border border-white/10"
        >
          <MessageSquare size={28} strokeWidth={2.5} />
        </motion.div>

        <nav className="flex flex-col gap-5 w-full px-3 flex-1 overflow-y-auto custom-scrollbar-hide py-2">
          {NAVIGATION_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.title}
                className={`w-full aspect-square flex flex-col items-center justify-center gap-2 rounded-[1.25rem] transition-all duration-500 relative group flex-shrink-0 ${
                  isActive 
                    ? 'text-white' 
                    : 'text-slate-500 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTabIndicator" 
                    className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[1.25rem] shadow-lg shadow-blue-500/20 z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                {!isActive && (
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 rounded-[1.25rem] transition-colors duration-300" />
                )}
                <div className="relative z-10 flex flex-col items-center gap-1.5">
                  <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={`transition-all duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110 group-hover:-translate-y-0.5'}`} />
                  <span className={`text-[8px] font-black tracking-[0.15em] uppercase transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                    {tab.label}
                  </span>
                </div>
                {isActive && (
                   <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-blue-400 rounded-r-full shadow-[0_0_15px_rgba(96,165,250,0.8)] z-20" />
                )}
              </button>
            );
          })}
        </nav>
        
        <div className="mt-auto px-3 w-full py-4 flex-shrink-0">
          <div className="h-px w-full bg-white/5 mb-6" />
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/50 px-8 py-3 flex items-center justify-between z-20 flex-shrink-0 w-full h-[64px]">
          <div className="flex items-center gap-4">
            <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tighter uppercase italic">Teams Hub</span>
            <div className="h-4 w-px bg-slate-300 mx-2" />
            <span className="text-sm font-bold text-slate-500">{activeTabData?.title}</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100/50 border border-slate-200 rounded-xl text-slate-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition-all shadow-inner">
              <Search size={16} />
              <input type="text" placeholder="Global Search..." className="bg-transparent border-none text-sm w-48 font-medium focus:ring-0 outline-none placeholder:text-slate-400" />
            </div>

            <div className="relative group">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 cursor-pointer"
              >
                <div className="relative">
                  <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white">
                    {user?.displayName?.charAt(0) || <User size={18} />}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                </div>
                <div className="flex flex-col items-start hidden sm:flex">
                  <p className="text-sm font-bold text-slate-800 leading-none truncate max-w-[120px]">{user?.displayName}</p>
                  <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-1">Enterprise</p>
                </div>
              </motion.button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden w-full">
          <aside className="w-[320px] border-r border-slate-200/60 bg-white/60 backdrop-blur-sm flex-shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <TeamsSidebar
              onChannelSelect={(t, c) => setSelectedChannel({ teamId: t, channelId: c })}
              selectedChannelId={selectedChannel?.channelId}
            />
          </aside>

          <main className="flex-1 overflow-hidden relative bg-slate-50/50">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full w-full overflow-y-auto custom-scrollbar"
              >
                <div className="p-10 w-full min-h-full max-w-7xl mx-auto">
                  <div className="w-full">
                    {activeTabData && (
                      <activeTabData.component 
                        user={user} 
                        selectedChannel={selectedChannel} 
                        onOpenBuilder={() => setActiveTab('builder')}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
        <Toaster position="bottom-right" reverseOrder={false} />
      </div>
    </div>
  );
}

export default App;
