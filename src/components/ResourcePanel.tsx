
import React from 'react';
import { RoadmapNode, Resource } from '../types';
import { X, ExternalLink, CheckCircle2, Circle, Clock, BookOpen, Video, Terminal } from 'lucide-react';

interface ResourcePanelProps {
  node: RoadmapNode;
  onClose: () => void;
  onToggleResource: (resourceId: string) => void;
  onMarkComplete: () => void;
}

const ResourcePanel: React.FC<ResourcePanelProps> = ({ node, onClose, onToggleResource, onMarkComplete }) => {
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'video': return <Video className="w-4 h-4" />;
      case 'article': return <BookOpen className="w-4 h-4" />;
      case 'documentation': return <Terminal className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed top-0 right-0 w-full md:w-[450px] h-full bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{node.category}</span>
          <h2 className="text-2xl font-bold text-slate-900">{node.title}</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <section>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Overview</h3>
          <p className="text-slate-600 leading-relaxed">{node.description}</p>
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              Est. {node.estimatedHours}h
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full">
              <div className={`w-2 h-2 rounded-full ${node.difficulty === 'beginner' ? 'bg-emerald-400' : node.difficulty === 'intermediate' ? 'bg-amber-400' : 'bg-rose-400'}`} />
              {node.difficulty.charAt(0).toUpperCase() + node.difficulty.slice(1)}
            </div>
          </div>
        </section>

        <section>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Learning Objectives</h3>
          <ul className="space-y-2">
            {node.learningObjectives.map((obj, i) => (
              <li key={i} className="flex gap-3 text-slate-600 text-sm">
                <CheckCircle2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
                {obj}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Top Free Resources</h3>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded uppercase">Ranked by AI</span>
          </div>
          <div className="space-y-4">
            {node.resources.map((res) => (
              <div 
                key={res.id} 
                className={`group p-4 rounded-2xl border-2 transition-all ${res.completed ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 hover:border-blue-200'}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-slate-50 rounded-lg text-slate-500">
                      {getFormatIcon(res.format)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{res.platform}</span>
                  </div>
                  <button 
                    onClick={() => onToggleResource(res.id)}
                    className={`transition-colors ${res.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-blue-400'}`}
                  >
                    {res.completed ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                  </button>
                </div>
                <h4 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{res.title}</h4>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{res.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400">{res.author}</span>
                  <a 
                    href={res.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                  >
                    Open Resource <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="p-6 bg-slate-50 border-t border-slate-100">
        <button 
          onClick={onMarkComplete}
          disabled={node.status === 'locked'}
          className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${
            node.status === 'completed' 
            ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-200'
            : node.status === 'locked'
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
          }`}
        >
          {node.status === 'completed' ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Node Completed!
            </>
          ) : (
            'Mark Node as Complete'
          )}
        </button>
      </div>
    </div>
  );
};

export default ResourcePanel;
