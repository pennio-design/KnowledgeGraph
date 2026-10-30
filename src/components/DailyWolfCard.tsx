import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { generateDailyBrief, MissingApiKeyError, nodeRef } from '../services/geminiService';
import { Roadmap, UnifiedRoadmap, RoadmapNode } from '../types';
import { briefCacheKey, getCachedBrief, setCachedBrief } from '../lib/storage';
import { dateKey } from '../lib/stats';
import { Zap, Clock, Trophy, Loader2, AlertTriangle, Play } from 'lucide-react';

interface DailyWolfCardProps {
  roadmaps: Roadmap[];
  unified: UnifiedRoadmap | null;
  onOpenNode: (roadmapId: string, nodeId: string) => void;
  onMissingKey: () => void;
}

interface Target { node: RoadmapNode; roadmapId: string; roadmapTitle: string; role: string }

/** Highest-leverage available node: unified-graph score if we have it, else the first available. */
function pickTarget(roadmaps: Roadmap[], unified: UnifiedRoadmap | null): Target | null {
  const candidates: Target[] = roadmaps.flatMap(r =>
    r.nodes.filter(n => n.status === 'available').map(n => ({
      node: n, roadmapId: r.id, roadmapTitle: r.title, role: r.goal || r.title,
    })));
  if (candidates.length === 0) return null;
  if (!unified) return candidates[0];

  const weight = new Map<string, number>();
  unified.nodes.forEach(u => u.memberRefs.forEach(ref => {
    weight.set(ref, Math.max(weight.get(ref) ?? 0, u.globalPriorityScore + (u.isBottleneck ? 20 : 0)));
  }));
  const scored = candidates.map(c => ({ c, w: weight.get(nodeRef(c.roadmapId, c.node.id)) ?? 0 }));
  scored.sort((a, b) => b.w - a.w);
  return scored[0].c;
}

const DailyWolfCard: React.FC<DailyWolfCardProps> = ({ roadmaps, unified, onOpenNode, onMissingKey }) => {
  const target = useMemo(() => pickTarget(roadmaps, unified), [roadmaps, unified]);
  const targetKey = target ? `${target.roadmapId}::${target.node.id}` : null;

  const [brief, setBrief] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    if (!target) return;
    const cacheKey = briefCacheKey(target.node.id, dateKey(new Date()));
    if (!force) {
      const cached = getCachedBrief(cacheKey);
      if (cached) { setBrief(cached); setError(null); return; }
    }
    setLoading(true);
    setError(null);
    try {
      const text = await generateDailyBrief(target.node.title, target.role);
      setCachedBrief(cacheKey, text);
      setBrief(text);
    } catch (e) {
      setBrief(null);
      if (!(e instanceof MissingApiKeyError)) setError(e instanceof Error ? e.message : 'Could not draft a mission.');
    } finally {
      setLoading(false);
    }
    // Re-run only when the chosen node changes, not on every progress update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey]);

  useEffect(() => { setBrief(null); load(); }, [load]);

  if (!target) return null;

  return (
    <section aria-label="Daily priority" className="bg-slate-900 rounded-xl p-6 text-white shadow-md">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs uppercase tracking-widest">
            <Zap className="w-4 h-4" aria-hidden /> Daily priority
          </div>
          <div>
            <h2 className="text-2xl font-black leading-tight mb-1">{target.node.title}</h2>
            <p className="text-slate-400 text-sm font-medium">From: <span className="text-slate-300">{target.roadmapTitle}</span></p>
          </div>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Drafting your mission...
            </div>
          )}
          {error && (
            <div className="flex items-center gap-3 text-sm text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
              <button onClick={() => load(true)} className="underline font-semibold">Retry</button>
            </div>
          )}
          {!loading && !error && !brief && (
            <button onClick={() => load(true)} className="text-sm underline text-slate-300">Generate today's mission</button>
          )}
          {brief && !loading && (
            <div className="text-sm space-y-1">
              {brief.split('\n').filter(l => l.trim()).map((line, i) => {
                if (line.includes('MISSION:')) return <div key={i} className="font-bold text-white">{line.replace(/\**MISSION:\**/, '').trim()}</div>;
                if (line.includes('WIN CONDITION:')) return <div key={i} className="text-emerald-400 font-bold text-xs mt-3 flex items-center gap-1"><Trophy className="w-3 h-3" aria-hidden /> {line.replace(/\**WIN CONDITION:\**/, '').trim()}</div>;
                return <p key={i} className="text-slate-300 leading-snug">{line.replace(/\**BRIEF:\**/, '').trim()}</p>;
              })}
            </div>
          )}
        </div>

        <div className="w-full md:w-auto flex-shrink-0">
          <button
            onClick={() => onOpenNode(target.roadmapId, target.node.id)}
            className="w-full md:w-auto px-6 py-4 bg-white text-slate-900 rounded-lg font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" aria-hidden /> Start mission
          </button>
          <div className="text-center mt-3 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            <Clock className="w-3 h-3" aria-hidden /> 15 min cap
          </div>
        </div>
      </div>
    </section>
  );
};

export default DailyWolfCard;
