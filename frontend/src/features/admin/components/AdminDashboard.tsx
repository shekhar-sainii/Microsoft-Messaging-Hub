import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { Shield, Bell, History, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Webhook } from 'lucide-react';
import { useAnalyticsStats, useAuditLogs, useRetryMessage } from '../../../hooks/useAnalyticsData';
import { useWebhooks, useCreateWebhook, useDeleteWebhook } from '../../../hooks/useWebhooksData';
import toast from 'react-hot-toast';

export const AdminDashboard = () => {
    const { data: statsData, isLoading: statsLoading } = useAnalyticsStats();
    const { data: logsData, isLoading: logsLoading } = useAuditLogs();
    const { data: webhooks, isLoading: webhooksLoading } = useWebhooks();
    const { mutate: createWebhook } = useCreateWebhook();
    const { mutate: deleteWebhook } = useDeleteWebhook();
    
    const { mutate: retry } = useRetryMessage();
    const [activeTab, setActiveTab] = useState<'analytics' | 'webhooks'>('analytics');

    const handleRetry = async (log: any) => {
        const messageId = log.metadata?.dbId || log.metadata?.messageId;
        if (!messageId) {
            toast.error('Cannot retry: Message reference missing');
            return;
        }

        toast.promise(retry(messageId), {
            loading: 'Retrying message...',
            success: 'Message retried successfully',
            error: 'Failed to retry message'
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Admin Command Center</h1>
                    <p className="text-slate-500 text-sm">Monitor system performance, audit logs, and webhooks.</p>
                </div>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('analytics')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'analytics' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Analytics
                    </button>
                    <button 
                        onClick={() => setActiveTab('webhooks')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'webhooks' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Webhooks
                    </button>
                </div>
            </header>

            {activeTab === 'analytics' && (
                <>
                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 mb-6">Messaging Performance</h3>
                            <div className="h-[300px] w-full">
                                {statsLoading ? (
                                    <div className="h-full flex items-center justify-center"><RefreshCw className="animate-spin text-blue-500" /></div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statsData || []}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Legend iconType="circle" />
                                            <Bar dataKey="sent" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Sent Successfully" />
                                            <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} name="Failed Delivery" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="text-sm font-bold text-slate-800 mb-6">Traffic Trends</h3>
                            <div className="h-[300px] w-full">
                                {statsLoading ? (
                                    <div className="h-full flex items-center justify-center"><RefreshCw className="animate-spin text-blue-500" /></div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={statsData || []}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                            <Line type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Audit Logs Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <History size={18} className="text-blue-600" />
                                <h3 className="text-sm font-bold text-slate-800">Audit Logs</h3>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                    <tr>
                                        <th className="px-6 py-3">Event Type</th>
                                        <th className="px-6 py-3">Details</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Timestamp</th>
                                        <th className="px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {logsLoading ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading logs...</td></tr>
                                    ) : logsData?.map((log: any) => (
                                        <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {log.status === 'failure' ? (
                                                        <AlertTriangle size={14} className="text-orange-500" />
                                                    ) : (
                                                        <Shield size={14} className="text-blue-500" />
                                                    )}
                                                    <span className="text-xs font-bold text-slate-700">{log.eventType?.replace('_', ' ')}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-600">{log.details}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {log.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-[10px] font-medium text-slate-400">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.status === 'failure' && (
                                                    <button 
                                                        onClick={() => handleRetry(log)}
                                                        className="flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
                                                    >
                                                        <RefreshCw size={10} />
                                                        Retry
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )
}

            {activeTab === 'webhooks' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Active Subscriptions</h3>
                            <p className="text-xs text-slate-500 mt-1">Manage Microsoft Graph webhooks for real-time synchronization.</p>
                        </div>
                        <button 
                            onClick={() => createWebhook()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-200"
                        >
                            Establish New Webhook
                        </button>
                    </div>
                    
                    {webhooksLoading ? (
                        <div className="py-20 text-center text-slate-400"><RefreshCw className="animate-spin mx-auto mb-4" /> Loading webhooks...</div>
                    ) : webhooks?.length === 0 ? (
                        <div className="py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <Webhook className="mx-auto text-slate-300 mb-2" size={32} />
                            <p className="text-sm font-bold text-slate-600">No active subscriptions</p>
                            <p className="text-xs text-slate-400 mt-1">Real-time sync is currently disabled.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {webhooks?.map((hook: any) => (
                                <div key={hook._id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center group">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`w-2 h-2 rounded-full ${new Date(hook.expirationDateTime) > new Date() ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                            <span className="text-sm font-bold text-slate-800 tracking-tight">{hook.resource}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">Expires: {new Date(hook.expirationDateTime).toLocaleString()}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-bold">ID: {hook.subscriptionId}</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if(window.confirm('Delete webhook? This will break real-time sync.')) {
                                                deleteWebhook(hook.subscriptionId);
                                            }
                                        }}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

