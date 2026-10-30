import React from 'react';
import { Roadmap, UserStats } from '../types';
import { displayStreak } from '../lib/stats';
import { Briefcase, Loader2, Map, Network, Plus, Trash2, Award } from 'lucide-react';

interface Props {
  roadmaps: Roadmap[];
  stats: UserStats;
  isSynthesizing: boolean;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onSynthesize: () => void;
  onCareer: () => void;
  onViewUnified?: () => void;
}

const Stat: React.FC<{ value: React.ReactNode; label: string }> = ({ value, label }) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
    <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</div>
  </div>
);

const Dashboard: React.FC<Props> = ({
  roadmaps, stats, isSynthesizing, onOpen, onDelete, onNew, onSynthesize, onCareer, onViewUnified,
}) => (
  <>
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Library</h1>
        <p className="text-slate-500">{roadmaps.length} {roadmaps.length === 1 ? 'roadmap' : 'roadmaps'}.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onSynthesize}
          disabled={isSynthesizing || roadmaps.length < 2}
          title={roadmaps.length < 2 ? 'Needs at least 2 roadmaps' : 'Merge all roadmaps into one prioritised graph'}
          className="bg-slate-900 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSynthesizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Network className="w-4 h-4" />}
          {isSynthesizing ? 'Synthesizing...' : 'God Mode'}
        </button>
        {onViewUnified && (
          <button onClick={onViewUnified} className="bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors">
            View last unified map
          </button>
        )}
        <button onClick={onCareer} className="bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
          <Briefcase className="w-4 h-4" /> Career
        </button>
        <button onClick={onNew} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" /> New path
        </button>
      </div>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {roadmaps.length > 0 ? roadmaps.map(roadmap => (
        <div key={roadmap.id} className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all relative">
          <button onClick={() => onOpen(roadmap.id)} className="block w-full text-left p-6 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-slate-900">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700 inline-block mb-4"><Map className="w-5 h-5" /></div>
            <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">{roadmap.title}</h3>
            <p className="text-sm text-slate-500 mb-6 line-clamp-1">{roadmap.domain}</p>
            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
              <span>{roadmap.progress.completedNodes}/{roadmap.progress.totalNodes} nodes</span>
              <span>{roadmap.progress.percentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-slate-900 transition-all duration-500 ease-out" style={{ width: `${roadmap.progress.percentage}%` }} />
            </div>
          </button>
          <button
            onClick={() => onDelete(roadmap.id)}
            aria-label={`Delete ${roadmap.title}`}
            className="absolute top-4 right-4 p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )) : (
        <div className="col-span-full py-16 text-center bg-white rounded-xl border border-slate-200 border-dashed">
          <p className="text-slate-500">No roadmaps yet.</p>
          <button onClick={onNew} className="mt-4 text-blue-600 font-semibold text-sm hover:underline">Create your first roadmap</button>
        </div>
      )}
    </div>

    <section aria-labelledby="perf">
      <h2 id="perf" className="text-xl font-bold text-slate-900 mb-6">Performance</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat value={stats.completedNodes} label="Nodes completed" />
        <Stat value={displayStreak(stats)} label="Day streak" />
        <Stat value={Math.round(stats.totalHours * 10) / 10} label="Hours invested" />
        <Stat value={stats.totalRoadmaps} label="Roadmaps created" />
      </div>
      <ul className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.achievements.map(a => (
          <li key={a.id} className={`p-4 rounded-xl border flex gap-3 items-start ${a.unlocked ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-200 opacity-60'}`}>
            <Award className={`w-5 h-5 mt-0.5 shrink-0 ${a.unlocked ? 'text-amber-500' : 'text-slate-400'}`} />
            <div>
              <div className="text-sm font-bold text-slate-900">{a.title}</div>
              <div className="text-xs text-slate-500">{a.description}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  </>
);

export default Dashboard;
