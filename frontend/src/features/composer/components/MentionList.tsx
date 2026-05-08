import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { User } from 'lucide-react';

export const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.displayName });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
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
    <div className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden min-w-[200px] py-2 z-[100]">
      {props.items.length ? (
        props.items.map((item: any, index: number) => (
          <button
            key={index}
            className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
              index === selectedIndex ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => selectItem(index)}
          >
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${index === selectedIndex ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <User size={14} />
            </div>
            <div>
                <p className="text-xs font-black">{item.displayName}</p>
                <p className="text-[10px] font-medium opacity-60">{item.email}</p>
            </div>
          </button>
        ))
      ) : (
        <div className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest">No members found</div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';
