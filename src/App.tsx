import React, { useState, useEffect } from 'react';
import { generateRoadmap, synthesizeRoadmaps } from './services/geminiService';
import { Roadmap, RoadmapNode, UserStats, Achievement, UnifiedRoadmap } from './types';
import IntakeForm from './components/IntakeForm';
import RoadmapGraph from './components/RoadmapGraph';
import ResourcePanel from './components/ResourcePanel';
import CareerPanel from './components/CareerPanel';
import UnifiedGraphView from './components/UnifiedGraphView';
import CertificateView from './components/CertificateView';
import DailyWolfCard from './components/DailyWolfCard';
import { 
  Brain, LayoutDashboard, Briefcase, ChevronRight, Zap, Trophy, Target, Award, Plus, Trash2, Map, Loader2, Network, Medal
} from 'lucide-react';

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_roadmap', title: 'The Architect', description: 'Generated your first learning roadmap', icon: 'Target', unlocked: false },
  { id: 'first_node', title: 'First Step', description: 'Completed your very first learning node', icon: 'Zap', unlocked: false },
  { id: 'master_5', title: 'Knowledge Seeker', description: 'Completed 5 learning nodes', icon: 'Award', unlocked: false },
  { id: 'streak_3', title: 'Consistent', description: 'Maintained a 3-day learning streak', icon: 'Trophy', unlocked: false },
];

const STORAGE_KEY = 'knowledge_graph_data';

const App: React.FC = () => {
  const [view, setView] = useState<'welcome' | 'intake' | 'roadmap' | 'dashboard' | 'career' | 'unified'>('welcome');
  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);
  const [unifiedRoadmap, setUnifiedRoadmap] = useState<UnifiedRoadmap | null>(null);
  const [savedRoadmaps, setSavedRoadmaps] = useState<Roadmap[]>([]);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  
  const [stats, setStats] = useState<UserStats>({
    totalRoadmaps: 0,
    completedNodes: 0,
    currentStreak: 0,
    totalHours: 0,
    history: [],
    achievements: INITIAL_ACHIEVEMENTS
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStats(parsed.stats || stats);
        if (parsed.savedRoadmaps) {
           setSavedRoadmaps(parsed.savedRoadmaps);
           if (parsed.savedRoadmaps.length > 0) {
             setActiveRoadmap(parsed.savedRoadmaps[0]);
           }
        }
      } catch (e) {
        console.error("Failed to load saved state", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ stats, savedRoadmaps }));
  }, [stats, savedRoadmaps]);

  const handleStartIntake = () => setView('intake');

  const unlockAchievement = (id: string) => {
    setStats(prev => {
      const updated = prev.achievements.map(a => 
        a.id === id && !a.unlocked ? { ...a, unlocked: true, unlockedAt: Date.now() } : a
      );
      return { ...prev, achievements: updated };
    });
  };

  const handleGenerate = async (goal: string, background: string, constraints: string) => {
    setIsLoading(true);
    try {
      const roadmap = await generateRoadmap(goal, background, constraints);
      roadmap.createdAt = Date.now();
      
      const newSavedList = [roadmap, ...savedRoadmaps];
      setSavedRoadmaps(newSavedList);
      setActiveRoadmap(roadmap);
      
      setStats(prev => ({ ...prev, totalRoadmaps: prev.totalRoadmaps + 1 }));
      unlockAchievement('first_roadmap');
      setView('roadmap');
    } catch (error) {
      alert(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSynthesize = async () => {
    if (savedRoadmaps.length < 2) {
      alert("You need at least 2 roadmaps to synthesize a Unified Graph.");
      return;
    }
    setIsSynthesizing(true);
    try {
      const unified = await synthesizeRoadmaps(savedRoadmaps);
      setUnifiedRoadmap(unified);
      setView('unified');
    } catch (error) {
      alert("Failed to synthesize. Try again.");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const updateActiveRoadmapInList = (updatedMap: Roadmap) => {
    setActiveRoadmap(updatedMap);
    setSavedRoadmaps(prev => prev.map(r => r.id === updatedMap.id ? updatedMap : r));
  };

  const handleDeleteRoadmap = (e: React.MouseEvent, roadmapId: string) => {
    e.stopPropagation();
    if (confirm("Delete this roadmap? This cannot be undone.")) {
      const updatedList = savedRoadmaps.filter(r => r.id !== roadmapId);
      setSavedRoadmaps(updatedList);
      if (activeRoadmap?.id === roadmapId) {
        setActiveRoadmap(updatedList.length > 0 ? updatedList[0] : null);
      }
    }
  };

  const handleToggleResource = (resourceId: string) => {
    if (!activeRoadmap || !selectedNode) return;
    const updatedRoadmap = { ...activeRoadmap };
    const node = updatedRoadmap.nodes.find(n => n.id === selectedNode.id);
    if (node) {
      const resource = node.resources.find(r => r.id === resourceId);
      if (resource) {
        resource.completed = !resource.completed;
        setSelectedNode({ ...node });
        updateActiveRoadmapInList(updatedRoadmap);
      }
    }
  };

  const handleMarkNodeComplete = () => {
    if (!activeRoadmap || !selectedNode || selectedNode.status === 'completed') return;
    const updatedRoadmap = { ...activeRoadmap };
    const nodeIndex = updatedRoadmap.nodes.findIndex(n => n.id === selectedNode.id);
    if (nodeIndex !== -1) {
      const node = updatedRoadmap.nodes[nodeIndex];
      node.status = 'completed';
      
      updatedRoadmap.nodes.forEach(n => {
        if (n.status === 'locked') {
          const allPrereqsMet = n.prerequisites.every(pId => 
            updatedRoadmap.nodes.find(rn => rn.id === pId)?.status === 'completed'
          );
          if (allPrereqsMet) n.status = 'available';
        }
      });

      const completedCount = updatedRoadmap.nodes.filter(n => n.status === 'completed').length;
      updatedRoadmap.progress = {
        completedNodes: completedCount,
        totalNodes: updatedRoadmap.nodes.length,
        percentage: Math.round((completedCount / updatedRoadmap.nodes.length) * 100)
      };

      setStats(prev => {
         const newHistory = [...prev.history];
         const today = new Date().toISOString().split('T')[0];
         const todayIndex = newHistory.findIndex(h => h.date === today);
         if (todayIndex > -1) {
             newHistory[todayIndex].nodesCompleted += 1;
             newHistory[todayIndex].hours += node.estimatedHours;
         } else {
             newHistory.push({ date: today, hours: node.estimatedHours, nodesCompleted: 1 });
         }
         return {
            ...prev,
            completedNodes: prev.completedNodes + 1,
            totalHours: prev.totalHours + node.estimatedHours,
            history: newHistory
         };
      });
      
      unlockAchievement('first_node');
      if (stats.completedNodes + 1 >= 5) unlockAchievement('master_5');
      
      updateActiveRoadmapInList(updatedRoadmap);
      setSelectedNode({ ...node });
    }
  };

  const getAllCompletedNodes = () => {
    const titles: string[] = [];
    savedRoadmaps.forEach(map => {
        map.nodes.forEach(node => {
            if (node.status === 'completed') titles.push(node.title);
        });
    });
    return [...new Set(titles)];
  };

  const handleOpenNodeFromWolf = (roadmapId: string, nodeId: string) => {
    const targetMap = savedRoadmaps.find(r => r.id === roadmapId);
    if (targetMap) {
      setActiveRoadmap(targetMap);
      const targetNode = targetMap.nodes.find(n => n.id === nodeId);
      setSelectedNode(targetNode || null);
      setView('roadmap');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-inter bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('welcome')}>
          <div className="bg-slate-900 p-2 rounded-lg">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">KnowledgeGraph</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <button onClick={() => setView('dashboard')} className={`hover:text-slate-900 transition-colors flex items-center gap-2 ${view === 'dashboard' ? 'text-slate-900 font-semibold' : ''}`}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
          <button onClick={() => setView('career')} className={`hover:text-slate-900 transition-colors flex items-center gap-2 ${view === 'career' ? 'text-slate-900 font-semibold' : ''}`}>
            <Briefcase className="w-4 h-4" /> Career
          </button>
        </nav>
        <div className="flex items-center gap-4">
          <button onClick={handleStartIntake} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-800 transition-colors shadow-sm">
            Start New Path
          </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {view === 'welcome' && (
          <div className="max-w-5xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center flex-1">
             <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
                Architect your <br /> learning path.
              </h1>
              <p className="text-lg text-slate-600 leading-relaxed max-w-md">
                No fluff. No random videos. Just a structured, AI-generated curriculum tailored to your exact career goals.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button onClick={handleStartIntake} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2">
                  Build Roadmap <ChevronRight className="w-4 h-4" />
                </button>
                <button onClick={() => setView('dashboard')} className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:border-slate-300 transition-colors flex items-center justify-center">
                  Open Library
                </button>
              </div>
            </div>
            <div className="hidden lg:block bg-white border border-slate-200 rounded-xl p-6 h-80 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-50/50" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">
                   [Graph Visualization Preview]
                </div>
            </div>
          </div>
        )}

        {view === 'intake' && (
          <div className="flex-1 bg-white py-12 px-6 flex items-center justify-center overflow-y-auto">
            <IntakeForm onSubmit={handleGenerate} isLoading={isLoading} />
          </div>
        )}

        {view === 'career' && (
          <div className="flex-1 bg-slate-50 overflow-y-auto">
            <CareerPanel completedNodes={getAllCompletedNodes()} onBack={() => setView('dashboard')} />
          </div>
        )}
        
        {view === 'unified' && unifiedRoadmap && (
           <UnifiedGraphView roadmap={unifiedRoadmap} onClose={() => setView('dashboard')} />
        )}
        
        {showCertificate && activeRoadmap && (
           <CertificateView roadmap={activeRoadmap} onClose={() => setShowCertificate(false)} />
        )}

        {view === 'roadmap' && activeRoadmap && (
          <div className="relative w-full h-[calc(100vh-73px)] bg-slate-50">
            <RoadmapGraph nodes={activeRoadmap.nodes} edges={activeRoadmap.edges} onNodeClick={setSelectedNode} />
            {selectedNode && (
              <ResourcePanel 
                node={selectedNode} 
                onClose={() => setSelectedNode(null)} 
                onToggleResource={handleToggleResource}
                onMarkComplete={handleMarkNodeComplete}
              />
            )}
            <div className="absolute top-6 left-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm z-10 w-64 space-y-3">
              <div>
                 <h2 className="text-base font-bold text-slate-900 mb-2 truncate">{activeRoadmap.title}</h2>
                 <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1">
                    <span>Progress</span>
                    <span>{activeRoadmap.progress.percentage}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-slate-900 transition-all duration-500 ease-out" style={{ width: `${activeRoadmap.progress.percentage}%` }} />
                 </div>
              </div>
              
              {activeRoadmap.progress.percentage === 100 && (
                <button 
                  onClick={() => setShowCertificate(true)}
                  className="w-full py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm flex items-center justify-center gap-1 animate-pulse"
                >
                  <Medal className="w-3 h-3" /> Claim Certificate
                </button>
              )}
              
              <button onClick={() => setView('dashboard')} className="w-full py-2 bg-slate-50 text-xs font-semibold text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                Back to Library
              </button>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="flex-1 bg-slate-50 p-6 md:p-12 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-10">
              
              <DailyWolfCard 
                roadmaps={savedRoadmaps} 
                unified={unifiedRoadmap} 
                onOpenNode={handleOpenNodeFromWolf} 
              />

              <div className="flex items-end justify-between border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 mb-2">Library</h1>
                  <p className="text-slate-500">Manage your {savedRoadmaps.length} active projects.</p>
                </div>
                <div className="flex gap-3">
                    <button 
                      onClick={handleSynthesize}
                      disabled={isSynthesizing || savedRoadmaps.length < 2}
                      className="bg-purple-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSynthesizing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Network className="w-4 h-4" />}
                        {isSynthesizing ? 'Synthesizing...' : 'God Mode'}
                    </button>
                    
                    <button onClick={() => setView('career')} className="bg-white text-slate-700 border border-slate-200 px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2">
                        <Briefcase className="w-4 h-4" /> Career
                    </button>
                    <button onClick={handleStartIntake} className="bg-slate-900 text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm">
                        <Plus className="w-4 h-4" /> New Path
                    </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedRoadmaps.length > 0 ? (
                  savedRoadmaps.map(roadmap => (
                    <div key={roadmap.id} onClick={() => { setActiveRoadmap(roadmap); setView('roadmap'); }} className="group bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md transition-all cursor-pointer relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                          <Map className="w-5 h-5" />
                        </div>
                        <button onClick={(e) => handleDeleteRoadmap(e, roadmap.id)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{roadmap.title}</h3>
                      <p className="text-sm text-slate-500 mb-6">{roadmap.domain}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-slate-500">
                          <span>Completion</span>
                          <span>{roadmap.progress.percentage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-slate-900 transition-all duration-500 ease-out" style={{ width: `${roadmap.progress.percentage}%` }} />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-16 text-center bg-white rounded-xl border border-slate-200 border-dashed">
                    <p className="text-slate-500">No roadmaps initialized.</p>
                    <button onClick={handleStartIntake} className="mt-4 text-blue-600 font-semibold text-sm hover:underline">Create your first roadmap</button>
                  </div>
                )}
              </div>
              
              <div className="mt-12">
                 <h2 className="text-xl font-bold text-slate-900 mb-6">Performance</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="text-3xl font-bold text-slate-900 mb-1">{stats.completedNodes}</div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nodes Completed</div>
                    </div>
                     <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <div className="text-3xl font-bold text-slate-900 mb-1">{stats.currentStreak}</div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Day Streak</div>
                    </div>
                  </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
