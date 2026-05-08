import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Shield, Zap, Globe, ArrowRight, CheckCircle2, Layout, Users, Sparkles } from 'lucide-react';
import { useAuth } from '../auth/useAuth';

export const HomePage: React.FC = () => {
    const { login, isLoading } = useAuth();

    return (
        <div className="min-h-screen bg-[#fafbff] flex flex-col relative overflow-hidden">
            {/* Ambient Background Lights */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100/50 rounded-full blur-[120px] -z-10" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[120px] -z-10" />

            {/* Navbar */}
            <nav className="px-8 py-6 flex items-center justify-between max-w-7xl mx-auto w-full relative z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <MessageSquare size={20} strokeWidth={2.5} />
                    </div>
                    <span className="text-xl font-black text-slate-900 tracking-tighter uppercase italic">Teams Hub</span>
                </div>
                
                <div className="flex items-center gap-8">
                    <div className="hidden md:flex items-center gap-6">
                        <a href="#features" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">Features</a>
                        <a href="#security" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">Security</a>
                        <a href="#enterprise" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">Enterprise</a>
                    </div>
                    <button 
                        onClick={() => login()}
                        className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        Login
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 max-w-7xl mx-auto w-full relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-8 max-w-3xl"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-black uppercase tracking-widest border border-blue-100 shadow-sm">
                        <Sparkles size={14} />
                        Enterprise Messaging Redefined
                    </div>
                    
                    <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.95]">
                        The Intelligent Gateway to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-700">Microsoft Teams</span>.
                    </h1>
                    
                    <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
                        Orchestrate complex communications, automate adaptive cards, and manage multi-tenant workspaces from a single, unified enterprise dashboard.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => login()}
                            disabled={isLoading}
                            className="px-10 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-lg shadow-2xl shadow-slate-200 flex items-center gap-3 group disabled:opacity-70"
                        >
                            {isLoading ? 'Connecting...' : (
                                <>
                                    Get Started Free
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </motion.button>
                        <button className="px-10 py-5 bg-white border border-slate-200 text-slate-700 rounded-[1.5rem] font-black text-lg hover:bg-slate-50 transition-all">
                            View Demo
                        </button>
                    </div>

                    <div className="flex items-center justify-center gap-8 pt-12 opacity-40 grayscale group-hover:grayscale-0 transition-all">
                        <div className="flex items-center gap-2 font-black text-slate-400 text-sm tracking-tighter uppercase">
                            <Shield size={18} /> Secure
                        </div>
                        <div className="flex items-center gap-2 font-black text-slate-400 text-sm tracking-tighter uppercase">
                            <Zap size={18} /> Fast
                        </div>
                        <div className="flex items-center gap-2 font-black text-slate-400 text-sm tracking-tighter uppercase">
                            <Users size={18} /> Collaborative
                        </div>
                    </div>
                </motion.div>

                {/* Feature Preview Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-24 w-full glass-card rounded-[3rem] p-4 shadow-3xl border border-white/50 relative"
                >
                    <div className="bg-slate-50/50 rounded-[2.2rem] overflow-hidden border border-slate-200/50 aspect-video md:aspect-[21/9] flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-indigo-600/5" />
                        <div className="relative z-10 flex flex-col items-center gap-6">
                            <div className="flex gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center text-blue-600">
                                        {i === 1 ? <Layout size={24} /> : i === 2 ? <MessageSquare size={24} /> : <Zap size={24} />}
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Interactive Dashboard Preview</p>
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* Features Section */}
            <section id="features" className="py-32 px-6 bg-white relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { 
                                icon: Shield, 
                                title: "Enterprise Grade", 
                                desc: "Bank-level security with Microsoft MSAL and Graph API delegated permissions.",
                                color: "blue"
                            },
                            { 
                                icon: Zap, 
                                title: "Instant Delivery", 
                                desc: "Deliver complex Adaptive Cards and rich text messages to any channel in seconds.",
                                color: "amber"
                            },
                            { 
                                icon: Globe, 
                                title: "Multi-Tenant", 
                                desc: "Seamlessly switch between different Microsoft organizations and workspaces.",
                                color: "indigo"
                            }
                        ].map((feat, i) => (
                            <div key={i} className="space-y-6 group">
                                <div className={`w-16 h-16 bg-${feat.color}-50 text-${feat.color}-600 rounded-[1.5rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                                    <feat.icon size={32} />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{feat.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{feat.desc}</p>
                                <div className="flex items-center gap-2 text-blue-600 text-xs font-black uppercase tracking-widest pt-2">
                                    <CheckCircle2 size={14} /> Included
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-8 border-t border-slate-100 relative z-10">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3 opacity-50">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                            <MessageSquare size={16} />
                        </div>
                        <span className="text-sm font-black text-slate-900 tracking-tighter uppercase italic">Teams Hub</span>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        &copy; 2026 Teams Hub Architecture. All rights reserved.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-slate-400 hover:text-slate-900 transition-colors"><Globe size={18} /></a>
                    </div>
                </div>
            </footer>
        </div>
    );
};
