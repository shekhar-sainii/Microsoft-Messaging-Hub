import React, { useEffect, useState } from 'react';
import { Shield, ExternalLink, X } from 'lucide-react';

/**
 * AdminConsentBanner
 * Shows when the URL contains ?consent=granted or ?consent=denied
 * after the admin consent redirect flow.
 * Also shows a prompt for new org admins to grant consent.
 */
export const AdminConsentBanner: React.FC = () => {
    const [status, setStatus] = useState<'granted' | 'denied' | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const consent = params.get('consent');
        if (consent === 'granted') setStatus('granted');
        if (consent === 'denied') setStatus('denied');

        // Clean URL
        if (consent) {
            const url = new URL(window.location.href);
            url.searchParams.delete('consent');
            url.searchParams.delete('tenant');
            url.searchParams.delete('error');
            window.history.replaceState({}, '', url.toString());
        }
    }, []);

    if (!status || dismissed) return null;

    return (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl border text-sm font-bold ${
            status === 'granted'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
        }`}>
            <Shield size={16} />
            {status === 'granted'
                ? '✅ Admin consent granted — your organisation is now connected'
                : '❌ Admin consent was denied — some features may be limited'}
            <button onClick={() => setDismissed(true)} className="ml-2 opacity-60 hover:opacity-100">
                <X size={14} />
            </button>
        </div>
    );
};

/**
 * AdminConsentPrompt
 * Shows a button for org admins to grant consent for application permissions.
 */
export const AdminConsentPrompt: React.FC<{ tenantId?: string }> = ({ tenantId }) => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

    const handleConsent = () => {
        const url = `${API_BASE}/auth/admin-consent${tenantId ? `?tenantId=${tenantId}` : ''}`;
        window.location.href = url;
    };

    return (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <Shield size={18} className="text-amber-600 flex-shrink-0" />
            <div className="flex-1">
                <p className="text-sm font-bold text-amber-800">Admin consent required</p>
                <p className="text-xs text-amber-600 mt-0.5">
                    Grant admin consent to enable all features for your organisation.
                </p>
            </div>
            <button
                onClick={handleConsent}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors"
            >
                <ExternalLink size={12} />
                Grant Consent
            </button>
        </div>
    );
};
