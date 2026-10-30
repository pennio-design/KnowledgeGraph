import React, { useState } from 'react';
import { generateResumePoints, MissingApiKeyError } from '../services/geminiService';
import { Copy, Check, Loader2, ArrowLeft, FileText } from 'lucide-react';

interface CareerPanelProps {
  completedNodes: string[];
  defaultRole: string;
  onBack: () => void;
  onMissingKey: () => void;
}

const CareerPanel: React.FC<CareerPanelProps> = ({ completedNodes, defaultRole, onBack, onMissingKey }) => {
  const [targetRole, setTargetRole] = useState(defaultRole);
  const [error, setError] = useState<string | null>(null);
  const [bulletPoints, setBulletPoints] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (completedNodes.length === 0 || !targetRole.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      setBulletPoints(await generateResumePoints(completedNodes, targetRole.trim()));
    } catch (e) {
      if (e instanceof MissingApiKeyError) onMissingKey();
      else setError(e instanceof Error ? e.message : 'Generation failed. Please retry.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(
      () => { setCopiedIndex(index); setTimeout(() => setCopiedIndex(null), 2000); },
      () => setError('Copy failed. Select the text and copy it manually.'),
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          aria-label="Back to library"
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Resume Assets
          </h1>
          <p className="text-slate-500 text-sm">Turn completed nodes into honest, interview-defensible resume bullets. They describe what you studied, not jobs you have not had.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
        <div className="grid md:grid-cols-2 gap-6 items-end mb-6">
          <div className="w-full">
            <label htmlFor="target-role" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Target role</label>
            <input
              id="target-role"
              maxLength={120}
              type="text" 
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full text-base font-medium text-slate-900 border-b border-slate-200 focus:border-slate-900 outline-none py-2 transition-colors bg-transparent placeholder:text-slate-300"
              placeholder="e.g. Senior Frontend Engineer"
            />
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
            <span className="text-xs font-medium text-slate-500">Source material</span>
            <span className="text-sm font-bold text-slate-900">{completedNodes.length} Nodes</span>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isGenerating || completedNodes.length === 0 || !targetRole.trim()}
          className="w-full py-3 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
          ) : (
            <><FileText className="w-4 h-4" /> Generate bullets</>
          )}
        </button>
      </div>

      {completedNodes.length === 0 && (
        <p className="text-sm text-slate-500 mb-6">Complete at least one learning node to generate bullets.</p>
      )}
      {error && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 mb-6">{error}</p>}

      {bulletPoints.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Output</h3>
          {bulletPoints.map((point, i) => (
            <div key={i} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors group relative">
              <p className="text-slate-700 text-sm leading-relaxed pr-10 font-medium">{point}</p>
              <button 
                onClick={() => copyToClipboard(point, i)}
                className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                aria-label="Copy bullet to clipboard"
              >
                {copiedIndex === i ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CareerPanel;
