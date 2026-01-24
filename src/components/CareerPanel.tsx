import React, { useState } from 'react';
import { generateResumePoints } from '../services/geminiService';
import { Briefcase, Copy, Check, Loader2, ArrowLeft, FileText } from 'lucide-react';

interface CareerPanelProps {
  completedNodes: string[];
  onBack: () => void;
}

const CareerPanel: React.FC<CareerPanelProps> = ({ completedNodes, onBack }) => {
  const [targetRole, setTargetRole] = useState('Frontend Developer');
  const [bulletPoints, setBulletPoints] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (completedNodes.length === 0) {
      alert("Complete at least one learning node first.");
      return;
    }
    setIsGenerating(true);
    try {
      const points = await generateResumePoints(completedNodes, targetRole);
      setBulletPoints(points);
    } catch (error) {
      alert("Generation failed. Please retry.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Resume Assets
          </h1>
          <p className="text-slate-500 text-sm">Convert completed modules into professional bullet points.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
        <div className="grid md:grid-cols-2 gap-6 items-end mb-6">
          <div className="w-full">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Target Role</label>
            <input 
              type="text" 
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full text-base font-medium text-slate-900 border-b border-slate-200 focus:border-slate-900 outline-none py-2 transition-colors bg-transparent placeholder:text-slate-300"
              placeholder="e.g. Senior Frontend Engineer"
            />
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex justify-between items-center">
            <span className="text-xs font-medium text-slate-500">Source Material</span>
            <span className="text-sm font-bold text-slate-900">{completedNodes.length} Nodes</span>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isGenerating || completedNodes.length === 0}
          className="w-full py-3 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
          ) : (
            <><FileText className="w-4 h-4" /> Generate Points</>
          )}
        </button>
      </div>

      {bulletPoints.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Output</h3>
          {bulletPoints.map((point, i) => (
            <div key={i} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:border-slate-300 transition-colors group relative">
              <p className="text-slate-700 text-sm leading-relaxed pr-10 font-medium">{point}</p>
              <button 
                onClick={() => copyToClipboard(point, i)}
                className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                title="Copy to clipboard"
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
