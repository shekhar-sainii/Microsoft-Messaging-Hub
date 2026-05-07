import React, { useState } from 'react';
import { Paperclip, X, FileText, Loader2 } from 'lucide-react';
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

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={openPicker}
        disabled={isLoading}
        className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 hover:border-blue-200 disabled:opacity-50"
        title="Attach files from OneDrive"
      >
        {isLoading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <Paperclip size={15} />
        )}
        <span className="font-medium">Attach from OneDrive</span>
      </button>

      {/* Attached files list */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          {attachedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm"
            >
              <FileText size={14} className="text-blue-500 flex-shrink-0" />
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 font-medium hover:underline truncate flex-1"
              >
                {file.name}
              </a>
              <span className="text-slate-400 text-xs flex-shrink-0">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                onClick={() => onRemove(file.id)}
                className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
