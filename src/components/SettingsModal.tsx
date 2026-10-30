import React, { useState } from 'react';
import { X } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../lib/storage';

interface Props {
  onClose: () => void;
}

const SettingsModal: React.FC<Props> = ({ onClose }) => {
  const [key, setKey] = useState(getStoredApiKey());

  const save = () => {
    setStoredApiKey(key);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-start justify-between">
          <h2 id="settings-title" className="text-lg font-bold text-slate-900">Gemini API key</h2>
          <button onClick={onClose} aria-label="Close" className="p-1 text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-600">
          KnowledgeGraph calls Gemini directly from your browser. Create a free key in{' '}
          <a className="text-blue-600 underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>{' '}
          and paste it here. It is stored only in this browser and sent only to Google.
        </p>
        <div>
          <label htmlFor="api-key" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">API key</label>
          <input
            id="api-key"
            type="password"
            autoComplete="off"
            autoFocus
            value={key}
            onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            className="w-full p-3 border border-slate-200 rounded-lg focus:border-slate-900 outline-none text-sm"
            placeholder="AIza..."
          />
        </div>
        <div className="flex justify-end gap-3">
          {getStoredApiKey() && (
            <button onClick={() => { setStoredApiKey(''); setKey(''); }} className="text-sm text-slate-500 hover:text-red-600 px-3 py-2">Remove key</button>
          )}
          <button onClick={save} className="bg-slate-900 text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-slate-800">Save</button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
