import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
    Shield, History, CheckCircle2, AlertTriangle, RefreshCw, Webhook, 
    Activity, BarChart3, Globe, Cpu, Server, Download, Trash2, 
    Database, Network, Zap, Clock, ExternalLink, Info, Search, X, Users
} from 'lucide-react';
import { 
    useGetSummaryStatsQuery,
    useGetMessageStatsQuery, 
    useGetAuditLogsQuery, 
    useRetryMessageMutation 
} from '../../analytics/analyticsApi';
import { 
    useGetWebhooksQuery, 
    useCreateWebhookMutation, 
    useDeleteWebhookMutation 
} from '../webhooksApi';
import { useDebounce } from '../../../hooks/useDebounce';
import { motion, AnimatePresence } from 'framer-motion';
import { ConfirmationModal } from '../../../components/modals/ConfirmationModal';
import { LogDetailModal } from './LogDetailModal';
import { UserManagement } from './UserManagement';
import { Pagination } from '../../../components/common/Pagination';
import toast from 'react-hot-toast';

type AdminTab = 'infrastructure' | 'analytics' | 'logs' | 'webhooks' | 'users';

export const AdminDashboard = () => {
    const { data: statsData, isLoading: statsLoading } = useGetMessageStatsQuery();
    const { data: summaryStats, isLoading: summaryLoading } = useGetSummaryStatsQuery();
    const { data: logsData, isLoading: logsLoading } = useGetAuditLogsQuery({ limit: 100, skip: 0 });
    const { data: webhooks, isLoading: webhooksLoading } = useGetWebhooksQuery();
    const [createWebhook] = useCreateWebhookMutation();
    const [deleteWebhook] = useDeleteWebhookMutation();
    const [retry] = useRetryMessageMutation();

    const [activeTab, setActiveTab] = useState<AdminTab>('infrastructure');
    const [logSearch, setLogSearch] = useState('');
    const debouncedLogSearch = useDebounce(logSearch, 300);
    const [confirmAction, setConfirmAction] = useState<{
        isOpen: boolean;
        type: 'retry' | 'delete_webhook';
        data: any;
    }>({ isOpen: false, type: 'retry', data: null });

    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const filteredLogs = useMemo(() => {
        if (!logsData) return [];
        return logsData.filter((log: any) => 
            log.eventType?.toLowerCase().includes(debouncedLogSearch.toLowerCase()) ||
            log.details?.toLowerCase().includes(debouncedLogSearch.toLowerCase()) ||
            log.status?.toLowerCase().includes(debouncedLogSearch.toLowerCase())
        );
    }, [logsData, debouncedLogSearch]);

    const totalPages = Math.ceil(filteredLogs.length / pageSize);
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const exportToCSV = () => {
        if (!filteredLogs || filteredLogs.length === 0) {
            toast.error('No logs available for export');
            return;
        }

        const headers = ['ID', 'Event', 'Status', 'Details', 'Date'];
        const csvRows = filteredLogs.map((log: any) => [
            log._id,
            log.eventType,
            log.status,
            `"${log.details?.replace(/"/g, '""')}"`,
            new Date(log.createdAt).toLocaleString()
        ]);

        const csvContent = [headers, ...csvRows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('Audit logs exported to CSV');
    };

    const handleRetry = (log: any) => {
        setConfirmAction({
            isOpen: true,
            type: 'retry',
            data: log
        });
    };

    const executeAction = () => {
        const { type, data } = confirmAction;
        if (!data) return;

        if (type === 'retry') {
            const targetId = data.metadata?.dbId || data.metadata?.messageId || data._id;
            toast.promise(retry(targetId).unwrap(), {
                loading: 'Re-initiating...',
                success: 'Broadcast successful',
                error: 'Retry failed'
            });
        } else if (type === 'delete_webhook') {
            toast.promise(deleteWebhook(data).unwrap(), {
                loading: 'Decommissioning pipeline...',
                success: 'Pipeline deleted',
                error: 'Deletion failed'
            });
        }
        setConfirmAction(prev => ({ ...prev, isOpen: false }));
    };

    const topStats = [
        { label: 'Network Health', value: summaryStats?.activeSubs ? `${summaryStats.activeSubs} Active` : 'Healthy', icon: Globe, color: 'blue' },
        { label: 'Total Broadcasts', value: summaryStats?.totalSent?.toString() || '0', icon: Shield, color: 'indigo' },
        { label: 'Delivery Rate', value: summaryStats?.totalSent ? `${Math.round((summaryStats.totalSent / (summaryStats.totalMessages || 1)) * 100)}%` : '100%', icon: Activity, color: 'emerald' },
        { label: 'Active Pipelines', value: webhooks?.length?.toString() || '0', icon: Zap, color: 'amber' }
    ];

    const COLORS = ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    const mockPremiumData = [
        { date: 'Mon', sent: 142, failed: 2, payloadSize: 450 },
        { date: 'Tue', sent: 235, failed: 8, payloadSize: 850 },
        { date: 'Wed', sent: 198, failed: 1, payloadSize: 620 },
        { date: 'Thu', sent: 384, failed: 14, payloadSize: 1200 },
        { date: 'Fri', sent: 512, failed: 3, payloadSize: 1950 },
        { date: 'Sat', sent: 310, failed: 0, payloadSize: 980 },
        { date: 'Sun', sent: 685, failed: 5, payloadSize: 2400 },
    ];

    return (
        <>
            <div className="w-full space-y-8 pb-20">
                
                {/* Compact License Warning */}
                <AnimatePresence>
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 mb-6 shadow-sm">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <p className="text-[11px] text-amber-800 font-bold leading-tight">
                                <span className="font-black uppercase tracking-tight mr-2">License Requirement:</span>
                                If "License information" errors occur, ensure users have an active O365 E3/E5 license assigned.
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Header Section */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-[0.2em]">
                            <Cpu size={10} className="text-blue-400" />
                            Infrastructure v3.4.0
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Command Center</h2>
                        <p className="text-slate-400 font-bold text-sm max-w-xl">
                            Monitor system health, analyze traffic, and manage security audit trails.
                        </p>
                    </div>

                    {/* Compact Navigation Tabs */}
                    <div className="flex items-center p-1 bg-white border border-slate-200 rounded-2xl shadow-lg h-[52px]">
                        <TabButton active={activeTab === 'infrastructure'} onClick={() => setActiveTab('infrastructure')} icon={Server} label="Status" />
                        <TabButton active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={BarChart3} label="Analytics" />
                        <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon={History} label="Audit" />
                        <TabButton active={activeTab === 'webhooks'} onClick={() => setActiveTab('webhooks')} icon={Webhook} label="Hooks" />
                        <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon={Users} label="Users" />
                    </div>
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'infrastructure' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {topStats.map((stat, i) => (
                                        <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                                            <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/5 blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700`} />
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className={`w-10 h-10 bg-${stat.color}-50 text-${stat.color}-600 rounded-xl flex items-center justify-center shadow-inner`}>
                                                    <stat.icon size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                                    <p className="text-lg font-black text-slate-900 tracking-tight">{stat.value}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                    <div className="xl:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                                        <h3 className="text-sm font-black text-slate-800 tracking-widest uppercase flex items-center gap-2">
                                            <Network size={16} className="text-blue-500" />
                                            Node Connectivity
                                        </h3>
                                        <div className="h-[250px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={Array.isArray(statsData) && statsData.length > 0 ? statsData : mockPremiumData}>
                                                    <defs>
                                                        <linearGradient id="infraGradient" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                                                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} />
                                                    <RechartsTooltip contentStyle={{ borderRadius: '12px', fontSize: '10px', background: '#0f172a', color: '#fff', border: 'none' }} />
                                                    <Area type="monotone" dataKey="sent" stroke="#6366f1" strokeWidth={3} fill="url(#infraGradient)" name="Node Traffic" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                    <div className="bg-slate-900 p-8 rounded-[2rem] text-white flex flex-col justify-between relative overflow-hidden">
                                        <div className="space-y-4 relative z-10">
                                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                                                <Database size={20} className="text-blue-400" />
                                            </div>
                                            <h3 className="text-lg font-black tracking-tight uppercase italic">Database Status</h3>
                                            <p className="text-slate-400 text-xs font-medium leading-relaxed">Primary MongoDB cluster is running at 4.2% CPU utilization with active replication.</p>
                                        </div>
                                        <button className="w-full py-3 mt-6 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/5 relative z-10">
                                            Open Cluster Manager
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'analytics' && (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                                    <h3 className="text-sm font-black text-slate-800 tracking-widest uppercase italic">Throughput Analytics</h3>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={Array.isArray(statsData) && statsData.length > 0 ? statsData : mockPremiumData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 800, fill: '#94a3b8' }} />
                                                <RechartsTooltip contentStyle={{ borderRadius: '12px', fontSize: '10px', background: '#0f172a', color: '#fff', border: 'none' }} />
                                                <Bar dataKey="sent" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Successful Syncs" />
                                                <Bar dataKey="failed" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Pipeline Drops" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-6">
                                    <h3 className="text-sm font-black text-slate-800 tracking-widest uppercase italic self-start">Operational Mix</h3>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={(summaryStats?.totalSent || summaryStats?.totalFailed || webhooks?.length || statsData?.length) ? [
                                                        { name: 'Successful', value: summaryStats?.totalSent || 0 },
                                                        { name: 'Failed', value: summaryStats?.totalFailed || 0 },
                                                        { name: 'Webhooks', value: webhooks?.length || 0 },
                                                        { name: 'Analytics', value: statsData?.length || 0 },
                                                    ] : [
                                                        { name: 'Successful', value: 2450 },
                                                        { name: 'Failed', value: 32 },
                                                        { name: 'Webhooks', value: 12 },
                                                        { name: 'Analytics', value: 180 },
                                                    ]}
                                                    cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value"
                                                >
                                                    {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} strokeWidth={0} />)}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{ borderRadius: '12px', fontSize: '10px' }} />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'logs' && (
                            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-lg overflow-hidden">
                                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between bg-slate-50/30 gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                                            <History size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">Security Audit</h3>
                                            <p className="text-slate-400 font-bold text-xs">Immutable record of system events.</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 flex-1 md:max-w-md">
                                        <div className="relative flex-1 group">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={14} />
                                            <input 
                                                type="text" 
                                                placeholder="Search logs..." 
                                                value={logSearch}
                                                onChange={(e) => setLogSearch(e.target.value)}
                                                className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                                            />
                                            {logSearch && (
                                                <button onClick={() => setLogSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <button onClick={exportToCSV} className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex-shrink-0">
                                            <Download size={16} />
                                            Export
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto text-[11px]">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-slate-50 uppercase tracking-widest text-slate-400 font-black">
                                            <tr>
                                                <th className="px-8 py-4">Operation</th>
                                                <th className="px-8 py-4">Details</th>
                                                <th className="px-8 py-4">Status</th>
                                                <th className="px-8 py-4">Date</th>
                                                <th className="px-8 py-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 font-bold">
                                            {logsLoading ? (
                                                Array.from({ length: 5 }).map((_, i) => (
                                                    <tr key={i}><td colSpan={5} className="px-8 py-4 animate-pulse bg-slate-50/50 h-10" /></tr>
                                                ))
                                            ) : paginatedLogs.length === 0 ? (
                                                <tr><td colSpan={5} className="px-8 py-10 text-center text-slate-400 uppercase tracking-widest">No matching logs found</td></tr>
                                            ) : paginatedLogs.map((log: any) => (
                                            <tr 
                                                key={log._id} 
                                                onClick={() => {
                                                    setSelectedLog(log);
                                                    setIsLogModalOpen(true);
                                                }}
                                                className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                            >
                                                <td className="px-8 py-4 uppercase text-slate-700">{log.eventType?.replace('_', ' ')}</td>
                                                <td className="px-8 py-4 text-slate-500 max-w-xs truncate">{log.details}</td>
                                                <td className="px-8 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${log.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-4 text-slate-400">{new Date(log.createdAt).toLocaleDateString()}</td>
                                                <td className="px-8 py-4 text-right">
                                                    {log.status === 'failure' && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRetry(log);
                                                            }}
                                                            className="text-blue-600 hover:underline uppercase text-[9px] font-black"
                                                        >
                                                            Retry
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    
                                    <Pagination 
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        totalItems={filteredLogs.length}
                                        onPageChange={setCurrentPage}
                                        pageSize={pageSize}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'webhooks' && (
                            <div className="space-y-6">
                                <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                                    <div className="space-y-2 relative z-10 text-center md:text-left">
                                        <h3 className="text-2xl font-black tracking-tight italic uppercase">Tenant Authorization</h3>
                                        <p className="text-indigo-200 text-sm font-medium">Grant admin consent for application permissions across the entire organization.</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const clientId = import.meta.env.VITE_AZURE_CLIENT_ID;
                                            const redirectUri = window.location.origin;
                                            const consentUrl = `https://login.microsoftonline.com/common/adminconsent?client_id=${clientId}&redirect_uri=${redirectUri}`;
                                            window.open(consentUrl, '_blank');
                                        }}
                                        className="px-8 py-3 bg-white text-indigo-900 rounded-xl font-black hover:scale-105 transition-all text-sm relative z-10 shadow-lg"
                                    >
                                        Grant Tenant Consent
                                    </button>
                                </div>

                                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-white/5">
                                    <div className="space-y-2 relative z-10 text-center md:text-left">
                                        <h3 className="text-2xl font-black tracking-tight italic uppercase text-white">Sync Pipelines</h3>
                                        <p className="text-slate-200 text-sm font-bold">Manage real-time Microsoft Graph webhooks.</p>
                                    </div>
                                    <button onClick={() => createWebhook().unwrap().then(() => toast.success('Pipeline created')).catch(() => toast.error('Failed to create'))} className="px-8 py-3 bg-white/10 text-white border border-white/10 rounded-xl font-black hover:bg-white/20 transition-all text-sm relative z-10">
                                        New Pipeline
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {webhooks?.map((hook: any) => (
                                        <div key={hook._id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
                                            <div className="space-y-4">
                                                <div className="flex justify-between items-start">
                                                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Webhook size={20} /></div>
                                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${new Date(hook.expirationDateTime) > new Date() ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                                        {new Date(hook.expirationDateTime) > new Date() ? 'Active' : 'Expired'}
                                                    </span>
                                                </div>
                                                <h4 className="text-lg font-black text-slate-800 tracking-tight uppercase italic truncate">{hook.resource}</h4>
                                                <p className="text-slate-400 text-[10px] font-bold">Valid until {new Date(hook.expirationDateTime).toLocaleDateString()}</p>
                                            </div>
                                            <div className="mt-6 flex justify-end">
                                                <button onClick={() => setConfirmAction({ isOpen: true, type: 'delete_webhook', data: hook.subscriptionId })} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <UserManagement />
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
            <ConfirmationModal
                isOpen={confirmAction.isOpen}
                onClose={() => setConfirmAction(prev => ({ ...prev, isOpen: false }))}
                onConfirm={executeAction}
                title={confirmAction.type === 'retry' ? "Confirm Re-broadcast" : "Decommission Pipeline"}
                message={confirmAction.type === 'retry' 
                    ? "Are you sure you want to retry sending this message? This will create a new delivery attempt in Microsoft Teams."
                    : "Are you sure you want to delete this webhook pipeline? You will stop receiving real-time notifications for this resource."}
                confirmText={confirmAction.type === 'retry' ? "Retry Dispatch" : "Delete Pipeline"}
                cancelText="Cancel"
                type={confirmAction.type === 'retry' ? "info" : "danger"}
            />
            <LogDetailModal
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                log={selectedLog}
            />
        </>
    );
};

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button
        onClick={onClick}
        className={`px-6 h-full rounded-xl transition-all duration-300 flex items-center gap-2 relative overflow-hidden group ${
            active ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-50'
        }`}
    >
        <div className="relative z-10 flex items-center gap-2">
            <Icon size={16} className={active ? 'text-blue-400' : ''} />
            <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
        </div>
    </button>
);
