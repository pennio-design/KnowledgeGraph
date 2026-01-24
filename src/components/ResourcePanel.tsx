import React, { useState } from 'react';
import { RoadmapNode, Resource } from '../types';
import { X, ExternalLink, CheckCircle, PlayCircle, BookOpen, FileText, ArrowRight, Activity } from 'lucide-react';

interface ResourcePanelProps {
  node: RoadmapNode;
  onClose: () => void;
  onToggleResource: (resourceId: string) => void;
  onMarkComplete: (feedback?: 'too_easy' | 'too_hard' | 'just_right') => void;
}

const ResourcePanel: React.FC<ResourcePanelProps> = ({ node, onClose, onToggleResource, onMarkComplete }) => {
  const [showFeedback, setShowFeedback] = useState(false);

  const handleCompleteClick = () => {
    setShowFeedback(true);
  };

  const submitFeedback = (feedback: 'too_easy' | 'too_hard' | 'just_right') => {
    onMarkComplete(feedback);
    setShowFeedback(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col border-l border-slate-100">
      <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div>
           <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              node.difficulty === 'beginner' ? 'bg-emerald-100 text-emerald-700' :
              node.difficulty === 'intermediate' ? 'bg-amber-100 text-amber-700' :
              'bg-rose-100 text-rose-700'
            }`}>
              {node.difficulty}
            </span>
            <span className="text-slate-400 text-xs font-bold uppercase">{node.category}</span>
           </div>
          <h2 className="text-2xl font-black text-slate-900 leading-tight">{node.title}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="prose prose-slate">
          <p className="text-lg text-slate-600 leading-relaxed font-medium">{node.description}</p>
        </div>

        {/* ... (Existing Objectives/Topics/Resources code would go here - simplified for brevity) ... */}
        
        {/* Resource List Visualization */}
        <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Core Resources
            </h3>
            {node.resources.map(res => (
                <div key={res.id} className="group flex items-start gap-3 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all cursor-pointer">
                    <button onClick={() => onToggleResource(res.id)} className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${res.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}>
                        {res.completed && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-900 text-sm mb-0.5 truncate">{res.title}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                             <span className="flex items-center gap-1">
                                {res.format === 'video' ? <PlayCircle className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                {res.platform}
                             </span>
                             <span>•</span>
                             <span>{res.duration}m</span>
                        </div>
                    </div>
                    <a href={res.url} target="_blank" rel="noreferrer" className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            ))}
        </div>
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50">
        {!showFeedback ? (
            <button 
              onClick={handleCompleteClick}
              disabled={node.status === 'completed'}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {node.status === 'completed' ? (
                <><CheckCircle className="w-5 h-5" /> Completed</>
              ) : (
                <>Mark Node Complete <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
        ) : (
            <div className="animate-in slide-in-from-bottom duration-300">
                <p className="text-center text-sm font-bold text-slate-500 mb-4 uppercase tracking-widest">How was it?</p>
                <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => submitFeedback('too_easy')} className="p-3 rounded-xl border border-slate-200 hover:bg-white hover:border-emerald-400 hover:shadow-md transition-all text-center">
                        <div className="text-2xl mb-1">😎</div>
                        <div className="text-xs font-bold text-slate-600">Too Easy</div>
                    </button>
                    <button onClick={() => submitFeedback('just_right')} className="p-3 rounded-xl border border-slate-200 hover:bg-white hover:border-blue-400 hover:shadow-md transition-all text-center">
                        <div className="text-2xl mb-1">🎯</div>
                        <div className="text-xs font-bold text-slate-600">Perfect</div>
                    </button>
                    <button onClick={() => submitFeedback('too_hard')} className="p-3 rounded-xl border border-slate-200 hover:bg-white hover:border-amber-400 hover:shadow-md transition-all text-center">
                        <div className="text-2xl mb-1">🥵</div>
                        <div className="text-xs font-bold text-slate-600">Hard</div>
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ResourcePanel;
