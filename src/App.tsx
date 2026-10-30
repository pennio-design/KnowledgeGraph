import React, { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { generateRoadmap, hasApiKey, MissingApiKeyError, synthesizeRoadmaps } from './services/geminiService';
import { Certificate, PersistedState, Roadmap, UserStats } from './types';
import { completeNode, toggleResource } from './lib/graph';
import { loadState, saveState } from './lib/storage';
import { recordNodeCompleted, recordRoadmapCreated } from './lib/stats';
import IntakeForm from './components/IntakeForm';
import ResourcePanel from './components/ResourcePanel';
import CareerPanel from './components/CareerPanel';
import DailyWolfCard from './components/DailyWolfCard';
import Dashboard from './components/Dashboard';
import SettingsModal from './components/SettingsModal';
import { Brain, LayoutDashboard, Briefcase, ChevronRight, Loader2, Medal, KeyRound, X } from 'lucide-react';

const RoadmapGraph = lazy(() => import('./components/RoadmapGraph'));
const UnifiedGraphView = lazy(() => import('./components/UnifiedGraphView'));
const CertificateView = lazy(() => import('./components/CertificateView'));

type View = 'welcome' | 'intake' | 'roadmap' | 'dashboard' | 'career' | 'unified';

const LoadingFallback = () => (
  <div className="flex-1 flex items-center justify-center text-slate-400">
    <Loader2 className="w-6 h-6 animate-spin" aria-label="Loading" />
  </div>
);

const App: React.FC = () => {
  // Lazy init: reading storage in an effect raced with the save effect and could wipe saved data.
  const [initial] = useState<PersistedState>(loadState);
  const [stats, setStats] = useState<UserStats>(initial.stats);
  const [savedRoadmaps, setSavedRoadmaps] = useState<Roadmap[]>(initial.savedRoadmaps);
  const [unifiedRoadmap, setUnifiedRoadmap] = useState(initial.unifiedRoadmap);

  const [view, setView] = useState<View>('welcome');
  const [activeRoadmapId, setActiveRoadmapId] = useState<string | null>(initial.savedRoadmaps[0]?.id ?? null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [apiKeyReady, setApiKeyReady] = useState(hasApiKey());

  const activeRoadmap = useMemo(
    () => savedRoadmaps.find(r => r.id === activeRoadmapId) ?? null,
    [savedRoadmaps, activeRoadmapId],
  );
  const selectedNode = activeRoadmap?.nodes.find(n => n.id === selectedNodeId) ?? null;

  useEffect(() => {
    if (!saveState({ version: 2, stats, savedRoadmaps, unifiedRoadmap })) {
      setNotice('Your browser refused to save progress (storage full or blocked). Export is not available yet, so avoid clearing this tab.');
    }
  }, [stats, savedRoadmaps, unifiedRoadmap]);

  const fail = useCallback((error: unknown, fallback: string) => {
    if (error instanceof MissingApiKeyError) {
      setShowSettings(true);
      return;
    }
    setNotice(error instanceof Error && error.message ? error.message : fallback);
  }, []);

  const requireKey = (): boolean => {
    if (hasApiKey()) return true;
    setShowSettings(true);
    return false;
  };

  const openIntake = () => {
    setNotice(null);
    setView('intake');
  };

  const openRoadmap = (id: string) => {
    setActiveRoadmapId(id);
    setSelectedNodeId(null);
    setView('roadmap');
  };

  const handleGenerate = async (goal: string, background: string, constraints: string) => {
    if (!requireKey()) return;
    setIsLoading(true);
    setNotice(null);
    try {
      const roadmap = await generateRoadmap(goal, background, constraints);
      setSavedRoadmaps(prev => [roadmap, ...prev]);
      setStats(prev => recordRoadmapCreated(prev));
      openRoadmap(roadmap.id);
    } catch (error) {
      fail(error, 'Could not generate the roadmap.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSynthesize = async () => {
    if (savedRoadmaps.length < 2) {
      setNotice('You need at least 2 roadmaps to build a unified graph.');
      return;
    }
    if (!requireKey()) return;
    setIsSynthesizing(true);
    setNotice(null);
    try {
      setUnifiedRoadmap(await synthesizeRoadmaps(savedRoadmaps));
      setView('unified');
    } catch (error) {
      fail(error, 'Could not synthesize your roadmaps.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const updateRoadmap = (updated: Roadmap) =>
    setSavedRoadmaps(prev => prev.map(r => (r.id === updated.id ? updated : r)));

  const handleDeleteRoadmap = (roadmapId: string) => {
    if (!confirm('Delete this roadmap? This cannot be undone.')) return;
    const remaining = savedRoadmaps.filter(r => r.id !== roadmapId);
    setSavedRoadmaps(remaining);
    if (activeRoadmapId === roadmapId) setActiveRoadmapId(remaining[0]?.id ?? null);
    // A unified graph built from the deleted roadmap is stale
    setUnifiedRoadmap(u => (u && u.nodes.some(n => n.originRoadmapIds.includes(roadmapId)) ? null : u));
  };

  const handleToggleResource = (resourceId: string) => {
    if (!activeRoadmap || !selectedNodeId) return;
    updateRoadmap(toggleResource(activeRoadmap, selectedNodeId, resourceId));
  };

  const handleMarkNodeComplete = () => {
    if (!activeRoadmap || !selectedNode || selectedNode.status !== 'available') return;
    updateRoadmap(completeNode(activeRoadmap, selectedNode.id));
    setStats(prev => recordNodeCompleted(prev, selectedNode.estimatedHours));
  };

  const handleIssueCertificate = (certificate: Certificate) => {
    if (activeRoadmap) updateRoadmap({ ...activeRoadmap, certificate });
  };

  const completedNodeTitles = useMemo(
    () => [...new Set(savedRoadmaps.flatMap(r => r.nodes.filter(n => n.status === 'completed').map(n => n.title)))],
    [savedRoadmaps],
  );

  const handleOpenNodeFromWolf = (roadmapId: string, nodeId: string) => {
    openRoadmap(roadmapId);
    setSelectedNodeId(nodeId);
  };

  const navClass = (v: View) =>
    `hover:text-slate-900 transition-colors flex items-center gap-2 p-2 md:p-0 rounded-lg ${
      view === v ? 'text-slate-900 font-semibold' : ''
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <button className="flex items-center gap-2" onClick={() => setView('welcome')} aria-label="KnowledgeGraph home">
          <span className="bg-slate-900 p-2 rounded-lg"><Brain className="w-5 h-5 text-white" /></span>
          <span className="text-lg font-bold tracking-tight hidden sm:inline">KnowledgeGraph</span>
        </button>
        <nav className="flex items-center gap-2 md:gap-6 text-sm font-medium text-slate-600" aria-label="Primary">
          <button onClick={() => setView('dashboard')} className={navClass('dashboard')} aria-label="Library">
            <LayoutDashboard className="w-4 h-4" /> <span className="hidden md:inline">Library</span>
          </button>
          <button onClick={() => setView('career')} className={navClass('career')} aria-label="Career">
            <Briefcase className="w-4 h-4" /> <span className="hidden md:inline">Career</span>
          </button>
          <button onClick={() => setShowSettings(true)} className={navClass('welcome').replace('text-slate-900 font-semibold', '')} aria-label="API key settings">
            <KeyRound className={`w-4 h-4 ${apiKeyReady ? '' : 'text-amber-600'}`} />
            <span className="hidden md:inline">{apiKeyReady ? 'API key' : 'Add API key'}</span>
          </button>
        </nav>
        <button onClick={openIntake} className="bg-slate-900 text-white px-3 md:px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors">
          New path
        </button>
      </header>

      {notice && (
        <div role="alert" className="bg-red-50 border-b border-red-200 text-red-800 text-sm px-4 md:px-6 py-3 flex items-start justify-between gap-4">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} aria-label="Dismiss message" className="shrink-0 text-red-600 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {view === 'welcome' && (
          <div className="max-w-5xl mx-auto px-6 py-16 md:py-20 grid lg:grid-cols-2 gap-12 items-center flex-1">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                Architect your <br /> learning path.
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-md">
                Answer three questions. Get a dependency-ordered curriculum with curated free resources, so you always know the next thing to learn.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button onClick={openIntake} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                  Build roadmap <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={() => setView('dashboard')} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:border-slate-300 transition-colors">
                  Open library
                </button>
              </div>
            </div>
            <ul className="hidden lg:block bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 text-sm text-slate-600">
              <li><strong className="text-slate-900">Ordered by prerequisites.</strong> Nodes unlock as you finish what they depend on.</li>
              <li><strong className="text-slate-900">Search-engineered resources.</strong> Each link is a precise query, not a random video.</li>
              <li><strong className="text-slate-900">Daily mission.</strong> A 15-minute task for your highest-leverage node.</li>
              <li><strong className="text-slate-900">Your data stays in this browser.</strong> No account, no server.</li>
            </ul>
          </div>
        )}

        {view === 'intake' && (
          <div className="flex-1 bg-white py-12 px-6 flex items-center justify-center overflow-y-auto">
            <IntakeForm onSubmit={handleGenerate} isLoading={isLoading} />
          </div>
        )}

        {view === 'career' && (
          <div className="flex-1 bg-slate-50 overflow-y-auto">
            <CareerPanel
              completedNodes={completedNodeTitles}
              defaultRole={savedRoadmaps[0]?.goal || savedRoadmaps[0]?.title || ''}
              onBack={() => setView('dashboard')}
              onMissingKey={() => setShowSettings(true)}
            />
          </div>
        )}

        <Suspense fallback={<LoadingFallback />}>
          {view === 'unified' && unifiedRoadmap && (
            <UnifiedGraphView roadmap={unifiedRoadmap} onClose={() => setView('dashboard')} />
          )}

          {showCertificate && activeRoadmap && (
            <CertificateView
              roadmap={activeRoadmap}
              onIssue={handleIssueCertificate}
              onClose={() => setShowCertificate(false)}
            />
          )}

          {view === 'roadmap' && activeRoadmap && (
            <div className="relative w-full flex-1 min-h-[480px] bg-slate-50">
              <RoadmapGraph
                nodes={activeRoadmap.nodes}
                edges={activeRoadmap.edges}
                selectedId={selectedNodeId}
                onNodeClick={n => setSelectedNodeId(n.id)}
              />
              {selectedNode && (
                <ResourcePanel
                  node={selectedNode}
                  onClose={() => setSelectedNodeId(null)}
                  onToggleResource={handleToggleResource}
                  onMarkComplete={handleMarkNodeComplete}
                  onMissingKey={() => setShowSettings(true)}
                />
              )}
              <div className="absolute top-4 left-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm z-10 w-60 space-y-3">
                <div>
                  <h2 className="text-base font-bold text-slate-900 mb-2 truncate" title={activeRoadmap.title}>{activeRoadmap.title}</h2>
                  <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                    <span>Progress</span>
                    <span>{activeRoadmap.progress.percentage}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden" role="progressbar"
                    aria-valuenow={activeRoadmap.progress.percentage} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-slate-900 transition-all duration-500 ease-out" style={{ width: `${activeRoadmap.progress.percentage}%` }} />
                  </div>
                </div>
                {activeRoadmap.progress.percentage === 100 && (
                  <button
                    onClick={() => setShowCertificate(true)}
                    className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <Medal className="w-3 h-3" /> {activeRoadmap.certificate ? 'View certificate' : 'Claim certificate'}
                  </button>
                )}
                <button onClick={() => setView('dashboard')} className="w-full py-2 bg-slate-50 text-xs font-semibold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                  Back to library
                </button>
              </div>
            </div>
          )}
        </Suspense>

        {view === 'dashboard' && (
          <div className="flex-1 bg-slate-50 p-4 md:p-12 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-10">
              <DailyWolfCard
                roadmaps={savedRoadmaps}
                unified={unifiedRoadmap}
                onOpenNode={handleOpenNodeFromWolf}
                onMissingKey={() => setShowSettings(true)}
              />
              <Dashboard
                roadmaps={savedRoadmaps}
                stats={stats}
                isSynthesizing={isSynthesizing}
                onOpen={openRoadmap}
                onDelete={handleDeleteRoadmap}
                onNew={openIntake}
                onSynthesize={handleSynthesize}
                onCareer={() => setView('career')}
                onViewUnified={unifiedRoadmap ? () => setView('unified') : undefined}
              />
            </div>
          </div>
        )}
      </main>

      {showSettings && (
        <SettingsModal
          onClose={() => { setShowSettings(false); setApiKeyReady(hasApiKey()); }}
        />
      )}
    </div>
  );
};

export default App;
