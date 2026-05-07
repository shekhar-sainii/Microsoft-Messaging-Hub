import React, { useState } from 'react';
import { ELEMENT_PALETTE } from '../constants';
import { ChevronDown } from 'lucide-react';

export const Palette: React.FC = () => {
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
        Content: true,
        Input: true,
        Actions: true,
    });

    const toggle = (cat: string) =>
        setOpenCategories(prev => ({ ...prev, [cat]: !prev[cat] }));

    return (
        <div className="space-y-2">
            {ELEMENT_PALETTE.map((group) => (
                <div key={group.category} className="rounded-xl border border-slate-100 overflow-hidden">
                    <button
                        onClick={() => toggle(group.category)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                            {group.category}
                        </span>
                        <ChevronDown
                            size={14}
                            className={`text-slate-400 transition-transform duration-200 ${openCategories[group.category] ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {openCategories[group.category] && (
                        <div className="p-2 space-y-1 bg-white">
                            {group.items.map((item) => (
                                <div
                                    key={item.type}
                                    draggable
                                    onDragStart={(e) => {
                                        e.dataTransfer.setData('application/json', JSON.stringify(item.default));
                                        e.dataTransfer.effectAllowed = 'copy';
                                    }}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-transparent cursor-grab active:cursor-grabbing transition-all group select-none"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-sm font-bold text-slate-500 group-hover:text-blue-600 transition-colors flex-shrink-0">
                                        {item.icon}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                                            {item.label}
                                        </p>
                                        <p className="text-[10px] text-slate-400 truncate">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
