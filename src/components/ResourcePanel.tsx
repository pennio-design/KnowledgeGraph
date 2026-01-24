import React, { useState } from 'react';
import { RoadmapNode, Resource } from '../types';
import { 
  X, CheckCircle, Circle, ExternalLink, PlayCircle, FileText, 
  BookOpen, Clock, BarChart, GraduationCap
} from 'lucide-react';
import TutorModal from './TutorModal';

interface ResourcePanelProps {
  node: RoadmapNode;
  onClose: () => void;
  onToggleResource: (id: string) => void;
  onMarkComplete: () => void;
}

const ResourcePanel: React.FC<ResourcePanelProps> = ({ 
  node, onClose, onToggleResource, onMarkComplete 
}) => {
  const [showTutor, setShowTutor] = useState(false);

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'video': return <PlayCircle className="w-4 h-4" />;
      case 'article': return <FileText className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const isComplete = node.status === 'completed';
  const allResourcesDone = node.resources.every(r => r.completed);

  return (
    <>
      <div className="fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl border-l border-slate-200 transform transition-transform duration-300 ease-in-out z-30 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-white z-10">
          <div>
             <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-3 ${
                isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-50 text-blue-700'
             }`}>
                {isComplete ? 'Completed' : 'In Progress'}
             </span>
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">{node.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="text-slate-600 leading-relaxed mb-8 font-medium">
            {node.description}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div className="flex items-center gap-2 text-slate-400 mb-2">
                 <Clock className="w-4 h-4" />
                 <span className="text-xs font-bold uppercase">Est. Time</span>
               </div>
               <span className="text-slate-900 font-bold">{node.estimatedHours} Hours</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
               <div className="flex items-center gap-2 text-slate-400 mb-2">
                 <BarChart className="w-4 h-4" />
                 <span className="text-xs font-bold uppercase">Difficulty</span>
               </div>
               <span className="text-slate-900 font-bold capitalize">{node.difficulty}</span>
            </div>
          </div>
          
          {/* Tutor Mode CTA */}
          <div className="mb-8">
            <button 
              onClick={() => setShowTutor(true)}
              className="w-full py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl shadow-lg shadow-slate-200 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-3 font-bold group"
            >
              <GraduationCap className="w-5 h-5 text-yellow-300 group-hover:rotate-12 transition-transform" />
              Start Tutor Mode
            </button>
            <p className="text-center text-xs text-slate-400 mt-2 font-medium">
              Get an AI breakdown, analogies, and a quick quiz.
            </p>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Curated Resources
            </h3>
            
            <div className="space-y-3">
              {node.resources.map((resource) => (
                <div 
                  key={resource.id}
                  className={`group p-4 rounded-xl border transition-all duration-200 relative ${
                    resource.completed 
                      ? 'bg-emerald-50/50 border-emerald-100' 
                      : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex gap-4">
                    <button 
                      onClick={() => onToggleResource(resource.id)}
                      className={`mt-1 flex-shrink-0 transition-colors ${
                        resource.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-blue-500'
                      }`}
                    >
                      {resource.completed ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-md ${
                          resource.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {resource.platform}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-semibold text-slate-400">
                           {getFormatIcon(resource.format)} {resource.duration}m
                        </span>
                      </div>
                      
                      <a 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`block font-bold text-sm mb-1 truncate hover:underline decoration-2 underline-offset-2 ${
                            resource.completed ? 'text-slate-600' : 'text-slate-900 decoration-blue-500/30'
                        }`}
                      >
                        {resource.title}
                        <ExternalLink className="inline w-3 h-3 ml-1 text-slate-400" />
                      </a>
                      
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {resource.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-white">
          <button
            onClick={onMarkComplete}
            disabled={isComplete || !allResourcesDone}
            className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              isComplete 
                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                : allResourcesDone
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isComplete ? (
              <><CheckCircle className="w-5 h-5" /> Node Mastered</>
            ) : (
              <>{allResourcesDone ? 'Complete Node' : 'Finish Resources to Complete'}</>
            )}
          </button>
        </div>
      </div>

      {/* Tutor Modal Overlay */}
      {showTutor && <TutorModal nodeTitle={node.title} onClose={() => setShowTutor(false)} />}
    </>
  );
};

export default ResourcePanel;
