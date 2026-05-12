import React, { useState } from 'react';
import { Paperclip, X, FileText, Loader2, Link, Plus, HelpCircle } from 'lucide-react';
import { apiClient } from '../api/apiClient';

interface AttachedFile {
  id: string;
  name: string;
  url: string;
  size: number;
}

interface OneDrivePickerProps {
  onFilesSelected: (files: AttachedFile[]) => void;
  attachedFiles: AttachedFile[];
  onRemove: (id: string) => void;
}

/**
 * OneDrive File Picker
 * 
 * Uses the Microsoft OneDrive File Picker SDK v8 to let users browse and
 * select files from their OneDrive without leaving the web app.
 * 
 * The selected file references (not binary data) are attached to the message,
 * meeting the Graph API requirement to use OneDrive item IDs.
 * 
 * Setup: The backend proxies the token acquisition so the client_id is
 * never exposed in the frontend bundle.
 */
export const OneDrivePicker: React.FC<OneDrivePickerProps> = ({
  onFilesSelected,
  attachedFiles,
  onRemove,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showDirectLinkInput, setShowDirectLinkInput] = useState(false);
  const [customLink, setCustomLink] = useState('');
  const [customName, setCustomName] = useState('');

  const openPicker = async () => {
    setIsLoading(true);
    try {
      // Get a delegated token from our backend (never from frontend directly)
      const { data } = await apiClient.get('/auth/graph-token');
      const accessToken = data.accessToken;

      // Microsoft OneDrive Picker SDK v8 configuration
      // Reference: https://learn.microsoft.com/en-us/onedrive/developer/controls/file-pickers/
      const pickerOptions = {
        sdk: '8.0',
        entry: { oneDrive: {} },
        authentication: {},
        messaging: {
          origin: window.location.origin,
          channelId: '27',
        },
        selection: {
          mode: 'multiple',
        },
        typesAndSources: {
          mode: 'files',
          pivots: { oneDrive: true, recent: true },
        },
      };

      // Open the picker in a popup window
      const pickerUrl = `https://onedrive.live.com/picker?filePicker=${encodeURIComponent(JSON.stringify(pickerOptions))}`;
      const popup = window.open(pickerUrl, 'OneDrive Picker', 'width=1080,height=680');

      if (!popup) {
        alert('Please allow popups for this site to use the OneDrive picker.');
        setIsLoading(false);
        return;
      }

      // Listen for picker messages
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== 'https://onedrive.live.com') return;

        const data = event.data;
        if (data.type === 'initialize' && data.channelId === '27') {
          popup.postMessage(
            { type: 'authenticate', token: accessToken },
            'https://onedrive.live.com'
          );
        }

        if (data.type === 'result') {
          window.removeEventListener('message', handleMessage);
          popup.close();

          if (data.items && data.items.length > 0) {
            const files: AttachedFile[] = data.items.map((item: any) => ({
              id: item.id,
              name: item.name,
              url: item.webUrl,
              size: item.size || 0,
            }));
            onFilesSelected(files);
          }
        }

        if (data.type === 'cancel') {
          window.removeEventListener('message', handleMessage);
          popup.close();
        }
      };

      window.addEventListener('message', handleMessage);
    } catch (error) {
      console.error('OneDrive picker error:', error);
      alert('Failed to open OneDrive picker. Please check your authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCustomLink = () => {
    if (!customLink) return;
    const newFile: AttachedFile = {
      id: `custom-${Date.now()}`,
      name: customName.trim() || customLink.split('/').pop() || 'Enterprise Shared Document',
      url: customLink,
      size: 1024 * 45, // simulated 45 KB
    };
    onFilesSelected([newFile]);
    setCustomLink('');
    setCustomName('');
    setShowDirectLinkInput(false);
  };

  const handleSimulateBusinessFile = () => {
    const mockFile: AttachedFile = {
      id: `sharepoint-${Date.now()}`,
      name: 'QService_Operations_Strategy_v3.pdf',
      url: 'https://microsoft-my.sharepoint.com/personal/tenant_admin/documents/QService_Operations_Strategy_v3.pdf',
      size: 1024 * 142, // 142 KB
    };
    onFilesSelected([mockFile]);
  };

  return (
    <div className="flex flex-col gap-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
      <div className="flex flex-wrap items-center gap-2">
        {/* Standard Picker */}
        <button
          type="button"
          onClick={openPicker}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 hover:text-blue-600 hover:bg-white rounded-lg transition-all border border-slate-200 shadow-xs font-bold disabled:opacity-50"
          title="Open personal live consumer Picker popup"
        >
          {isLoading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Paperclip size={13} className="text-blue-500" />
          )}
          <span>OneDrive Live</span>
        </button>

        {/* Toggle Direct Link Mode */}
        <button
          type="button"
          onClick={() => setShowDirectLinkInput(!showDirectLinkInput)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-all border shadow-xs font-bold ${showDirectLinkInput ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white text-slate-700 border-slate-200 hover:text-indigo-600'}`}
        >
          <Link size={13} className={showDirectLinkInput ? 'text-indigo-600' : 'text-slate-400'} />
          <span>Business Link</span>
        </button>

        {/* Fast Mock Business Simulator button */}
        <button
          type="button"
          onClick={handleSimulateBusinessFile}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ml-auto"
          title="Instantly inject mock authenticated Enterprise SharePoint Node"
        >
          <Plus size={10} /> Mock Business File
        </button>
      </div>

      {/* Info Context box */}
      <div className="flex items-start gap-1.5 px-2.5 py-1.5 bg-amber-50/50 border border-amber-100 rounded-lg">
        <HelpCircle size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-[9px] font-medium text-amber-800 leading-tight">
          <strong className="font-bold">Tenant Context:</strong> Live Consumer Picker (<code className="bg-amber-100/50 px-0.5 py-0.2 rounded font-mono">onedrive.live.com</code>) does not cross-load your <strong className="font-bold">Entra ID Business/Teams files</strong>. Use the <strong className="font-bold text-indigo-600">Business Link</strong> tab to attach enterprise shareable links directly.
        </p>
      </div>

      {/* Embedded Input Panel */}
      {showDirectLinkInput && (
        <div className="flex flex-col gap-2 p-2.5 bg-white border border-indigo-100 rounded-lg animate-fadeIn">
          <input
            type="text"
            placeholder="Paste Enterprise OneDrive / SharePoint URL..."
            value={customLink}
            onChange={(e) => setCustomLink(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-indigo-400"
          />
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Display Document Name (Optional)..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              onClick={handleAddCustomLink}
              disabled={!customLink}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-md transition-all flex items-center gap-1"
            >
              Attach
            </button>
          </div>
        </div>
      )}

      {/* Attached files list */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          {attachedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50/80 border border-blue-200/80 rounded-lg text-xs"
            >
              <FileText size={13} className="text-blue-600 flex-shrink-0" />
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-800 font-bold hover:underline truncate flex-1"
              >
                {file.name}
              </a>
              <span className="text-slate-400 text-[10px] font-bold flex-shrink-0">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={() => onRemove(file.id)}
                className="text-slate-400 hover:text-rose-500 transition-colors flex-shrink-0 p-0.5"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
