import React, { useState, useEffect } from 'react';
import { generateDailyBrief } from '../services/geminiService';
import { Roadmap, UnifiedRoadmap, RoadmapNode } from '../types';
import { Zap, Clock, Trophy, Loader2, AlertTriangle, Play } from 'lucide-react';

interface DailyWolfCardProps {
  roadmaps: Roadmap[];
  unified: UnifiedRoadmap | null;
  onOpenNode: (roadmapId: string, nodeId: string) => void;
}

const DailyWolfCard: React.FC<DailyWolfCardProps> = ({ roadmaps, unified, onOpenNode }) => {
  const [brief, setBrief] = useState<string | null>(null);
  const [targetNode, setTargetNode] = useState<{ node: RoadmapNode, roadmapId: string, roadmapTitle: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. SMART SELECTION LOGIC
    // Find all "available" nodes across all roadmaps
    const candidates = roadmaps.flatMap(r => 
      r.nodes
        .filter(n => n.status === 'available')
        .map(n => ({ node: n, roadmapId: r.id, roadmapTitle: r.title }))
    );

    if (candidates.length === 0) {
      setLoading(false);
      return;
    }

    let selected = candidates[0]; // Default: First available

    // If we have God Mode data, pick the highest leverage node (Bottleneck or High Score)
    if (unified) {
      const highValueNodes = unified.nodes
        .filter(n => n.globalPriorityScore > 70 || n.isBottleneck)
        .map(n => n.title); // Get titles of high value nodes

      // Find a candidate that matches a high value title
      const bestMatch = candidates.find(c => highValueNodes.includes(c.node.title));
      if (bestMatch) selected = bestMatch;
    }

    setTargetNode(selected);

    // 2. GENERATE MISSION
    // Check local storage to avoid spamming API on every refresh
    const cacheKey = `wolf_brief_${selected.node.id}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
      setBrief(cached);
      setLoading(false);
    } else {
      generateDailyBrief(selected.node.title, "Professional Developer")
        .then(text => {
          setBrief(text);
          localStorage.setItem(cacheKey, text);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [roadmaps, unified]);

  if (!targetNode && !loading) return null; // Nothing to do

  return (
    <div className="bg-slate-900 rounded-xl p-6 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden group">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 p-32 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-600/20 transition-colors duration-700" />
      
      <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
        
        {/* Left: The Hook */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs uppercase tracking-widest">
            <Zap className="w-4 h-4 fill-yellow-400" /> 
            Daily Priority
          </div>
          
          <div>
            <h2 className="text-2xl font-black leading-tight mb-1">
              {targetNode ? targetNode.node.title : "Analyzing Priorities..."}
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              From: <span className="text-slate-300">{targetNode?.roadmapTitle}</span>
            </p>
          </div>

          {loading ? (
             <div className="flex items-center gap-2 text-sm text-slate-500 animate-pulse">
               <Loader2 className="w-4 h-4 animate-spin" /> The Wolf is drafting your mission...
             </div>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none">
              {/* Simple parser for the raw text response to style it slightly */}
              {brief?.split('\n').map((line, i) => {
                if (line.includes('MISSION:')) return <div key={i} className="font-bold text-white mb-1">{line.replace('MISSION:', '').trim()}</div>;
                if (line.includes('WIN CONDITION:')) return <div key={i} className="text-emerald-400 font-bold text-xs mt-3 flex items-center gap-1"><Trophy className="w-3 h-3" /> {line.replace('WIN CONDITION:', '').trim()}</div>;
                return <p key={i} className="text-slate-300 leading-snug my-1">{line.replace('BRIEF:', '').trim()}</p>;
              })}
            </div>
          )}
        </div>

        {/* Right: The Action */}
        <div className="w-full md:w-auto flex-shrink-0">
          <button 
            onClick={() => targetNode && onOpenNode(targetNode.roadmapId, targetNode.node.id)}
            disabled={loading}
            className="w-full md:w-auto px-6 py-4 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-200 transition-all shadow-lg flex items-center justify-center gap-2 group/btn"
          >
            <Play className="w-4 h-4 fill-slate-900 group-hover/btn:translate-x-0.5 transition-transform" />
            Start Mission
          </button>
          <div className="text-center mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
            <Clock className="w-3 h-3" /> 15 Min Cap
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyWolfCard;
