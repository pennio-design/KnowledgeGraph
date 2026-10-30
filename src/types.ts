export type NodeStatus = 'locked' | 'available' | 'completed';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Resource {
  id: string;
  title: string;
  url: string;
  platform: string;
  format: string;
  description: string;
  /** Minutes */
  duration: number;
  difficulty: string;
  completed: boolean;
  searchQuery?: string;
  isFree?: boolean;
  author?: string;
}

export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  nodeType: string;
  category: string;
  difficulty: Difficulty;
  estimatedHours: number;
  prerequisites: string[];
  learningObjectives: string[];
  keyTopics: string[];
  resources: Resource[];
  status: NodeStatus;
  position: { x: number; y: number };
}

export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
}

export interface Progress {
  completedNodes: number;
  totalNodes: number;
  percentage: number;
}

export interface Certificate {
  id: string;
  name: string;
  issuedAt: number;
}

export interface Roadmap {
  id: string;
  title: string;
  domain: string;
  /** The user's original goal; used as role context for AI features. */
  goal: string;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  progress: Progress;
  createdAt: number;
  certificate?: Certificate;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface HistoryEntry {
  /** Local calendar date, YYYY-MM-DD */
  date: string;
  hours: number;
  nodesCompleted: number;
}

export interface UserStats {
  totalRoadmaps: number;
  completedNodes: number;
  currentStreak: number;
  totalHours: number;
  history: HistoryEntry[];
  achievements: Achievement[];
}

export interface UnifiedNode {
  id: string;
  title: string;
  description: string;
  category: string;
  /** Roadmaps that contain this concept */
  originRoadmapIds: string[];
  /** `${roadmapId}::${nodeId}` refs of the source nodes merged into this one */
  memberRefs: string[];
  globalPriorityScore: number;
  synergyCount: number;
  isBottleneck: boolean;
  position: { x: number; y: number };
}

export interface UnifiedRoadmap {
  id: string;
  nodes: UnifiedNode[];
  edges: RoadmapEdge[];
  goals: string[];
  generatedAt: number;
}

export interface PersistedState {
  version: 2;
  stats: UserStats;
  savedRoadmaps: Roadmap[];
  unifiedRoadmap: UnifiedRoadmap | null;
}

export interface TutorLesson {
  academic: { source: string; content: string };
  practical: { source: string; content: string };
  analogy: { source: string; content: string };
  quiz: { question: string; options: string[]; answer: number; explanation: string }[];
}
