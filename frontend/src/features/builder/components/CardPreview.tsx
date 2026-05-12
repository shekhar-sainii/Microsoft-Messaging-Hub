import React, { useEffect, useRef } from 'react';
import * as AdaptiveCards from 'adaptivecards';

interface CardPreviewProps {
    cardJson: any;
}

export const CardPreview: React.FC<CardPreviewProps> = ({ cardJson }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';

        try {
            const ac = new AdaptiveCards.AdaptiveCard();
            ac.hostConfig = new AdaptiveCards.HostConfig({
                fontFamily: 'Segoe UI, system-ui, sans-serif',
                containerStyles: {
                    default: { backgroundColor: '#ffffff', foregroundColors: { default: { default: '#1e293b', subtle: '#64748b' } } },
                    emphasis: { backgroundColor: '#f8fafc', foregroundColors: { default: { default: '#1e293b', subtle: '#64748b' } } },
                    accent: { backgroundColor: '#0ea5e9', foregroundColors: { default: { default: '#ffffff', subtle: '#e0f2fe' } } },
                    good: { backgroundColor: '#10b981', foregroundColors: { default: { default: '#ffffff', subtle: '#dcfce7' } } },
                    attention: { backgroundColor: '#ef4444', foregroundColors: { default: { default: '#ffffff', subtle: '#fee2e2' } } },
                    warning: { backgroundColor: '#f59e0b', foregroundColors: { default: { default: '#ffffff', subtle: '#fef3c7' } } },
                },
                actions: {
                    buttonSpacing: 12,
                    actionAlignment: 'stretch',
                },
            });
            ac.parse(cardJson);
            const rendered = ac.render();
            if (rendered) {
                rendered.style.fontFamily = 'Segoe UI, system-ui, sans-serif';
                rendered.style.width = '100%';
                rendered.style.border = '1px solid #e2e8f0';
                rendered.style.borderRadius = '1rem';
                rendered.style.overflow = 'hidden';
                rendered.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.05)';
                containerRef.current.appendChild(rendered);
            }
        } catch (e) {
            containerRef.current.innerHTML = `
                <div style="padding:16px;border:1px solid #fecaca;background:#fef2f2;border-radius:8px;color:#dc2626;font-size:12px;font-family:monospace">
                    ⚠️ Invalid card schema — check JSON editor
                </div>`;
        }
    }, [cardJson]);

    return <div ref={containerRef} className="w-full" />;
};
