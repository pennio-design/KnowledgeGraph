import React, { useState } from 'react';
import { generateResumePoints } from '../services/geminiService';
import { Briefcase, Copy, Check, Loader2, ArrowLeft, Sparkles } from 'lucide-react';

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
      alert("You need to complete some nodes first!");
      return;
    }
    setIsGenerating(true);
    try {
      const points = await generateResumePoints(completedNodes, targetRole);
      setBulletPoints(points);
    } catch (error) {
      alert("Failed to generate resume points. Try again.");
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
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in slide-in-from-right duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-slate-500" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-2">
            The Resu-Maker <Briefcase className="w-8 h-8 text-blue-600" />
          </h1>
          <p className="text-slate-500">Turn your learning progress into hired proof.</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Target Role</label>
            <input 
              type="text" 
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full text-lg font-bold text-slate-900 border-b-2 border-slate-100 focus:border-blue-600 outline-none py-2 transition-colors bg-transparent"
              placeholder="e.g. UX Designer"
            />
          </div>
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Knowledge Base</div>
            <div className="font-bold text-slate-900">{completedNodes.length} Concepts Mastered</div>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isGenerating || completedNodes.length === 0}
          className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Architecting Resume...</>
          ) : (
            <><Sparkles className="w-5 h-5" /> Generate Bullet Points</>
          )}
        </button>
      </div>

      {bulletPoints.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">Your "Wolf" Assets</h3>
          {bulletPoints.map((point, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
              <p className="text-slate-700 font-medium pr-12 leading-relaxed">{point}</p>
              <button 
                onClick={() => copyToClipboard(point, i)}
                className="absolute top-6 right-6 p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
              >
                {copiedIndex === i ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CareerPanel;
