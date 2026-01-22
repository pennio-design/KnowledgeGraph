
import React, { useState, useEffect, useCallback } from 'react';
import { generateRoadmap } from './services/geminiService';
import { Roadmap, RoadmapNode, UserStats, ActivityLog, Achievement } from './types';
import IntakeForm from './components/IntakeForm';
import RoadmapGraph from './components/RoadmapGraph';
import ResourcePanel from './components/ResourcePanel';
import { 
  Brain, LayoutDashboard, History, Settings, ChevronRight, Zap, Trophy, Timer, 
  Sparkles, CheckCircle, Target, Award, ArrowUpRight
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
        setStats(parsed.stats);
        if (parsed.activeRoadmap) setActiveRoadmap(parsed.activeRoadmap);
      } catch (e) {
        console.error("Failed to load saved state", e);
      }
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ stats, activeRoadmap }));
  }, [stats, activeRoadmap]);

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

  const handleToggleResource = (resourceId: string) => {
    if (!activeRoadmap || !selectedNode) return;
    
    const updatedRoadmap = { ...activeRoadmap };
    const node = updatedRoadmap.nodes.find(n => n.id === selectedNode.id);
    if (node) {
      const resource = node.resources.find(r => r.id === resourceId);
      if (resource) {
        resource.completed = !resource.completed;
        setSelectedNode({ ...node });
      }
    }
    setActiveRoadmap(updatedRoadmap);
  };

  const updateHistory = (hours: number) => {
    const today = new Date().toISOString().split('T')[0];
    setStats(prev => {
      const history = [...prev.history];
      const todayIndex = history.findIndex(h => h.date === today);
      
      if (todayIndex > -1) {
        history[todayIndex].hours += hours;
        history[todayIndex].nodesCompleted += 1;
      } else {
        history.push({ date: today, hours, nodesCompleted: 1 });
      }

      // Check for streaks
      const sortedHistory = [...history].sort((a, b) => a.date.localeCompare(b.date));
      let streak = 0;
      let lastDate = new Date();
      
      for (let i = sortedHistory.length - 1; i >= 0; i--) {
        const entryDate = new Date(sortedHistory[i].date);
        const diff = Math.floor((lastDate.getTime() - entryDate.getTime()) / (1000 * 3600 * 24));
        if (diff <= 1) {
          streak++;
          lastDate = entryDate;
        } else break;
      }

      return { ...prev, history, currentStreak: streak };
    });
  };

  const handleMarkNodeComplete = () => {
    if (!activeRoadmap || !selectedNode || selectedNode.status === 'completed') return;

    const updatedRoadmap = { ...activeRoadmap };
    const nodeIndex = updatedRoadmap.nodes.findIndex(n => n.id === selectedNode.id);
    
    if (nodeIndex !== -1) {
      const node = updatedRoadmap.nodes[nodeIndex];
      node.status = 'completed';
      
      // Unlock next nodes
      updatedRoadmap.nodes.forEach(n => {
        if (n.status === 'locked') {
          const allPrereqsMet = n.prerequisites.every(pId => 
            updatedRoadmap.nodes.find(rn => rn.id === pId)?.status === 'completed'
          );
          if (allPrereqsMet) n.status = 'available';
        }
      });

      // Update progress stats
      const completedCount = updatedRoadmap.nodes.filter(n => n.status === 'completed').length;
      updatedRoadmap.progress = {
        completedNodes: completedCount,
        totalNodes: updatedRoadmap.nodes.length,
        percentage: Math.round((completedCount / updatedRoadmap.nodes.length) * 100)
      };

      // Global Stats
      setStats(prev => ({
        ...prev,
        completedNodes: prev.completedNodes + 1,
        totalHours: prev.totalHours + node.estimatedHours
      }));

      updateHistory(node.estimatedHours);

      // Achievements
      unlockAchievement('first_node');
      if (stats.completedNodes + 1 >= 5) unlockAchievement('master_5');
      if (stats.currentStreak >= 3) unlockAchievement('streak_3');

      setActiveRoadmap(updatedRoadmap);
      setSelectedNode({ ...node });
    }
  };

  const getChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(today.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];
      const entry = stats.history.find(h => h.date === dateStr);
      return {
        name: days[date.getDay()],
        hours: entry ? entry.hours : 0
      };
    });
    return last7Days;
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
      {/* Navigation Header */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => setView('welcome')}
        >
          <div className="bg-blue-600 p-2 rounded-xl group-hover:rotate-12 transition-transform shadow-lg shadow-blue-200">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">KnowledgeGraph</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-500">
          <button 
            onClick={() => setView('dashboard')} 
            className={`hover:text-blue-600 transition-colors flex items-center gap-2 ${view === 'dashboard' ? 'text-blue-600' : ''}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button className="hover:text-blue-600 transition-colors flex items-center gap-2">
            <History className="w-4 h-4" />
            Activity
          </button>
          <button className="hover:text-blue-600 transition-colors flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </nav>

        <div className="flex items-center gap-4">
          {activeRoadmap && (
             <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                <Zap className="w-3.5 h-3.5" />
                {activeRoadmap.progress.percentage}% COMPLETE
             </div>
          )}
          <button 
            onClick={handleStartIntake}
            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            Start New
          </button>
        </div>
      </header>

      <main className="flex-1 relative overflow-hidden flex flex-col">
        {view === 'welcome' && (
          <div className="max-w-7xl mx-auto px-6 py-12 md:py-24 grid lg:grid-cols-2 gap-16 items-center flex-1">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-bold animate-pulse">
                <Sparkles className="w-4 h-4" />
                AI-Powered Learning Architecture
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.1] animate-in slide-in-from-left duration-700">
                Master Anything <br />
                <span className="text-blue-600">With Precision.</span>
              </h1>
              <p className="text-xl text-slate-500 leading-relaxed max-w-xl animate-in slide-in-from-left duration-700 delay-100">
                Answer 3 questions. Get a personalized learning roadmap with the best free resources from across the web, organized visually so you know exactly what to learn next.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 animate-in slide-in-from-left duration-700 delay-200">
                <button 
                  onClick={handleStartIntake}
                  className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-2 group"
                >
                  Start Learning
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  onClick={() => setView('dashboard')}
                  className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-bold text-lg hover:border-blue-200 transition-all flex items-center justify-center gap-2"
                >
                  View Dashboard
                </button>
              </div>
            </div>
            <div className="relative hidden lg:block animate-in zoom-in duration-1000">
              <div className="absolute inset-0 bg-blue-600 rounded-[3rem] rotate-3 opacity-5" />
              <div className="bg-white p-8 rounded-[3rem] shadow-2xl border border-slate-100 relative">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-100">KG</div>
                  <div>
                    <h3 className="font-bold text-lg">Knowledge Graph Prototype</h3>
                    <p className="text-sm text-slate-400">Personalized Learning Node</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {[
                    { label: 'Foundation Layer', status: 'completed', percentage: 100 },
                    { label: 'Core Principles', status: 'in_progress', percentage: 45 },
                    { label: 'Advanced Modules', status: 'locked', percentage: 0 },
                    { label: 'Specialization', status: 'locked', percentage: 0 }
                  ].map((item, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-slate-700">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ${item.status === 'completed' ? 'bg-emerald-400' : item.status === 'in_progress' ? 'bg-blue-400' : 'bg-slate-300'}`} style={{ width: `${item.percentage}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
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
          <div className="flex-1 relative flex">
            <RoadmapGraph 
              nodes={activeRoadmap.nodes} 
              edges={activeRoadmap.edges} 
              onNodeClick={setSelectedNode} 
            />
            {selectedNode && (
              <ResourcePanel 
                node={selectedNode} 
                onClose={() => setSelectedNode(null)} 
                onToggleResource={handleToggleResource}
                onMarkComplete={handleMarkNodeComplete}
              />
            )}
            <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl z-10 max-w-xs animate-in slide-in-from-top duration-500">
              <h2 className="text-lg font-bold text-slate-900 mb-1">{activeRoadmap.title}</h2>
              <p className="text-xs text-slate-500 mb-3">{activeRoadmap.domain}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                  <span>PROGRESS</span>
                  <span>{activeRoadmap.progress.percentage}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${activeRoadmap.progress.percentage}%` }} />
                </div>
              </div>
              <button 
                onClick={() => setView('dashboard')}
                className="mt-4 w-full py-2 bg-slate-50 text-[10px] font-bold text-slate-500 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1"
              >
                BACK TO DASHBOARD <LayoutDashboard className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="flex-1 bg-slate-50 p-6 md:p-12 overflow-y-auto">
            <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-black text-slate-900 mb-2">Welcome Back</h1>
                  <p className="text-slate-500 font-medium">You've completed {stats.completedNodes} nodes so far. Keep it up!</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-2 bg-amber-50 rounded-xl">
                      <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-slate-900">{stats.currentStreak} Days</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Streak</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="p-3 bg-blue-50 w-fit rounded-2xl mb-4">
                    <CheckCircle className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-4xl font-black text-slate-900 mb-1">{stats.completedNodes}</div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Nodes Done</div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="p-3 bg-emerald-50 w-fit rounded-2xl mb-4">
                    <Timer className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-4xl font-black text-slate-900 mb-1">{Math.floor(stats.totalHours)}h</div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Hours Learning</div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="p-3 bg-purple-50 w-fit rounded-2xl mb-4">
                    <Target className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-4xl font-black text-slate-900 mb-1">{stats.totalRoadmaps}</div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Roadmaps</div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="p-3 bg-amber-50 w-fit rounded-2xl mb-4">
                    <Award className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-4xl font-black text-slate-900 mb-1">{stats.achievements.filter(a => a.unlocked).length}</div>
                    <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Achievements</div>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center justify-between">
                    Weekly Activity
                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">Last 7 Days</span>
                  </h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={getChartData()}>
                        <defs>
                          <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }} 
                          cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5' }}
                        />
                        <Area type="monotone" dataKey="hours" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorHours)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Roadmap</h3>
                  <div className="space-y-4 flex-1">
                    {activeRoadmap ? (
                      <div 
                        className="p-5 bg-blue-50 border border-blue-100 rounded-2xl flex flex-col group cursor-pointer hover:bg-blue-100 transition-all" 
                        onClick={() => setView('roadmap')}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="bg-white p-3 rounded-xl shadow-sm">
                            <Zap className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="p-2 bg-white rounded-full hover:bg-blue-600 hover:text-white transition-colors">
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-lg mb-1">{activeRoadmap.title}</div>
                          <div className="text-xs font-bold text-slate-400 uppercase mb-4">{activeRoadmap.domain}</div>
                          <div className="flex justify-between items-center mb-2">
                             <span className="text-[10px] font-bold text-blue-600">{activeRoadmap.progress.percentage}% COMPLETE</span>
                             <span className="text-[10px] font-bold text-slate-400">{activeRoadmap.progress.completedNodes}/{activeRoadmap.progress.totalNodes} NODES</span>
                          </div>
                          <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600" style={{ width: `${activeRoadmap.progress.percentage}%` }} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
                          <Brain className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-medium">No roadmaps active yet.</p>
                        <button 
                          onClick={handleStartIntake} 
                          className="text-blue-600 font-bold hover:underline px-6 py-3 rounded-xl bg-blue-50"
                        >
                          Generate Now
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-bold text-slate-900 mb-8">Achievements</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.achievements.map((a) => (
                    <div 
                      key={a.id} 
                      className={`p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${a.unlocked ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-50 opacity-50 grayscale'}`}
                    >
                      <div className={`p-3 rounded-xl ${a.unlocked ? 'bg-white shadow-sm text-amber-500' : 'bg-slate-200 text-slate-400'}`}>
                        {getIcon(a.icon)}
                      </div>
                      <div>
                        <div className={`font-bold text-sm ${a.unlocked ? 'text-slate-900' : 'text-slate-400'}`}>{a.title}</div>
                        <div className="text-[10px] font-medium text-slate-400 leading-tight">{a.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Persistence / Footer Info */}
      <footer className="bg-white border-t border-slate-100 py-6 px-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Synchronized locally • Ready for offline learning
        </div>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
          <a href="#" className="hover:text-blue-600 transition-colors">Contact Support</a>
        </div>
      </footer>
    </div>
  );
};

export default App;
