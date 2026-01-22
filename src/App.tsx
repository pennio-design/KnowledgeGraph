import React, { useState, useEffect } from 'react';
import { generateRoadmap } from './services/geminiService';
import { Roadmap, RoadmapNode, UserStats, Achievement } from './types';
import IntakeForm from './components/IntakeForm';
import RoadmapGraph from './components/RoadmapGraph';
import ResourcePanel from './components/ResourcePanel';
import { 
  Brain, LayoutDashboard, History, Settings, ChevronRight, Zap, Trophy, Timer, 
  Sparkles, CheckCircle, Target, Award, ArrowUpRight, Plus, Trash2, Map
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_roadmap', title: 'The Architect', description: 'Generated your first learning roadmap', icon: 'Target', unlocked: false },
  { id: 'first_node', title: 'First Step', description: 'Completed your very first learning node', icon: 'Zap', unlocked: false },
  { id: 'master_5', title: 'Knowledge Seeker', description: 'Completed 5 learning nodes', icon: 'Award', unlocked: false },
  { id: 'streak_3', title: 'Consistent', description: 'Maintained a 3-day learning streak', icon: 'Trophy', unlocked: false },
];

const STORAGE_KEY = 'knowledge_graph_data';

const App: React.FC = () => {
  const [view, setView] = useState<'welcome' | 'intake' | 'roadmap' | 'dashboard'>('welcome');
  const [activeRoadmap, setActiveRoadmap] = useState<Roadmap | null>(null);
  const [savedRoadmaps, setSavedRoadmaps] = useState<Roadmap[]>([]); // NEW: Store multiple maps
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    totalRoadmaps: 0,
    completedNodes: 0,
    currentStreak: 0,
    totalHours: 0,
    history: [],
    achievements: INITIAL_ACHIEVEMENTS
  });

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStats(parsed.stats || stats);
        if (parsed.savedRoadmaps) {
           setSavedRoadmaps(parsed.savedRoadmaps);
           // If there are roadmaps, set the most recent one as active
           if (parsed.savedRoadmaps.length > 0) {
             setActiveRoadmap(parsed.savedRoadmaps[0]);
           }
        }
      } catch (e) {
        console.error("Failed to load saved state", e);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
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
      
      // Add new roadmap to the START of the list
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

  const handleSwitchRoadmap = (roadmapId: string) => {
    const target = savedRoadmaps.find(r => r.id === roadmapId);
    if (target) {
      setActiveRoadmap(target);
      setView('roadmap');
    }
  };

  const handleDeleteRoadmap = (e: React.MouseEvent, roadmapId: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this roadmap?")) {
      const updatedList = savedRoadmaps.filter(r => r.id !== roadmapId);
      setSavedRoadmaps(updatedList);
      if (activeRoadmap?.id === roadmapId) {
        setActiveRoadmap(updatedList.length > 0 ? updatedList[0] : null);
      }
    }
  };

  // ... (Keep handleToggleResource, updateHistory, and handleMarkNodeComplete logic same as before, 
  // just ensure they update the `savedRoadmaps` array too!) ...
  
  // REPLACEMENT HELPER for updating a specific roadmap in the list
  const updateActiveRoadmapInList = (updatedMap: Roadmap) => {
    setActiveRoadmap(updatedMap);
    setSavedRoadmaps(prev => prev.map(r => r.id === updatedMap.id ? updatedMap : r));
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
        updateActiveRoadmapInList(updatedRoadmap); // Update list
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

      setStats(prev => ({
        ...prev,
        completedNodes: prev.completedNodes + 1,
        totalHours: prev.totalHours + node.estimatedHours
      }));

      // updateHistory logic here... (simplified for brevity)
      
      unlockAchievement('first_node');
      if (stats.completedNodes + 1 >= 5) unlockAchievement('master_5');
      
      updateActiveRoadmapInList(updatedRoadmap); // Update list
      setSelectedNode({ ...node });
    }
  };

  const getChartData = () => {
     // ... (Keep existing chart logic)
     const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
     const today = new Date();
     return Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const entry = stats.history.find(h => h.date === dateStr);
      return { name: days[date.getDay()], hours: entry ? entry.hours : 0 };
    });
  };

  const getIcon = (name: string) => {
    switch (name) {
      case 'Target': return <Target className="w-5 h-5" />;
      case 'Zap': return <Zap className="w-5 h-5" />;
      case 'Award': return <Award className="w-5 h-5" />;
      case 'Trophy': return <Trophy className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-inter">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setView('welcome')}>
          <div className="bg-blue-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-blue-200">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">KnowledgeGraph</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
          <button onClick={() => setView('dashboard')} className={`hover:text-blue-600 transition-colors flex items-center gap-2 ${view === 'dashboard' ? 'text-blue-600' : ''}`}>
            <LayoutDashboard className="w-4 h-4" /> Dashboard
          </button>
        </nav>
        <div className="flex items-center gap-4">
          <button onClick={handleStartIntake} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
            Start New
          </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {view === 'welcome' && (
          <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 grid lg:grid-cols-2 gap-16 items-center flex-1">
             {/* Same Welcome Content */}
             <div className="space-y-8">
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1]">
                Master Anything <br /><span className="text-blue-600">With Precision.</span>
              </h1>
              <p className="text-xl text-slate-500 leading-relaxed max-w-xl">
                Answer 3 questions. Get a personalized learning roadmap with the best free resources.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handleStartIntake} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2">
                  Start Learning <ChevronRight className="w-5 h-5" />
                </button>
                <button onClick={() => setView('dashboard')} className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-bold text-lg hover:border-blue-200">
                  My Library
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'intake' && (
          <div className="flex-1 bg-slate-50 py-12 px-6 flex items-center justify-center overflow-y-auto">
            <IntakeForm onSubmit={handleGenerate} isLoading={isLoading} />
          </div>
        )}

        {view === 'roadmap' && activeRoadmap && (
          <div className="relative w-full h-[calc(100vh-80px)] bg-slate-50">
            <RoadmapGraph nodes={activeRoadmap.nodes} edges={activeRoadmap.edges} onNodeClick={setSelectedNode} />
            {selectedNode && (
              <ResourcePanel 
                node={selectedNode} 
                onClose={() => setSelectedNode(null)} 
                onToggleResource={handleToggleResource}
                onMarkComplete={handleMarkNodeComplete}
              />
            )}
            {/* Dashboard Back Button Overlay */}
            <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl z-10 max-w-xs">
              <h2 className="text-lg font-bold text-slate-900 mb-1">{activeRoadmap.title}</h2>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                 <span>{activeRoadmap.progress.percentage}% DONE</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${activeRoadmap.progress.percentage}%` }} />
              </div>
              <button onClick={() => setView('dashboard')} className="mt-4 w-full py-2 bg-slate-50 text-[10px] font-bold text-slate-500 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1">
                BACK TO LIBRARY
              </button>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="flex-1 bg-slate-50 p-6 md:p-12 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-10">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 mb-2">My Library</h1>
                  <p className="text-slate-500 font-medium">You have {savedRoadmaps.length} active learning paths.</p>
                </div>
                <button onClick={handleStartIntake} className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200">
                  <Plus className="w-5 h-5" /> New Roadmap
                </button>
              </div>

              {/* ROADMAP LIBRARY GRID */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedRoadmaps.length > 0 ? (
                  savedRoadmaps.map(roadmap => (
                    <div key={roadmap.id} onClick={() => handleSwitchRoadmap(roadmap.id)} className="group bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                          <Map className="w-6 h-6" />
                        </div>
                        <button onClick={(e) => handleDeleteRoadmap(e, roadmap.id)} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full text-slate-300 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1 line-clamp-1">{roadmap.title}</h3>
                      <p className="text-sm text-slate-400 font-medium mb-6">{roadmap.domain}</p>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-slate-400">
                          <span>Progress</span>
                          <span>{roadmap.progress.percentage}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-400 transition-all duration-1000" style={{ width: `${roadmap.progress.percentage}%` }} />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-12 text-center bg-white rounded-[2rem] border border-slate-100 border-dashed">
                    <p className="text-slate-400 font-medium">No roadmaps yet. Start your first journey!</p>
                  </div>
                )}
              </div>
              
              {/* Stats Section (Simplified) */}
              <div className="mt-12 pt-12 border-t border-slate-200">
                 <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Stats</h2>
                 {/* ... (Existing stats grid code) ... */}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
