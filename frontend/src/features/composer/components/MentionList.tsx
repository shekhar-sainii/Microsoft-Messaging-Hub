import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';

export const MentionList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command({ id: item.id, label: item.displayName });
        }
    };

    const upHandler = () => {
        setSelectedIndex(((selectedIndex + props.items.length) - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: any) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }
            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }
            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }
            return false;
        },
    }));

    return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden min-w-[200px] z-50">
            {props.items.length ? (
                props.items.map((item: any, index: number) => (
                    <button
                        key={item.id}
                        onClick={() => selectItem(index)}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 transition-colors ${index === selectedIndex ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${index === selectedIndex ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            {item.displayName.substring(0, 2).toUpperCase()}
                        </div>
                        {item.displayName}
                    </button>
                ))
            ) : (
                <div className="px-4 py-2 text-sm text-slate-400 italic">No members found</div>
            )}
        </div>
    );
});

MentionList.displayName = 'MentionList';
