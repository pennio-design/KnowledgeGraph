// 1. ADDED: Explicit export for NodeStatus to fix build error in RoadmapGraph.tsx
export type NodeStatus = 'locked' | 'available' | 'completed';

export interface Resource {
  id: string;
  title: string;
  url: string;
  platform: string;
  type?: 'video' | 'article' | 'documentation' | 'course'; 
  format: string; 
  description: string;
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
  difficulty: string;
  estimatedHours: number;
  prerequisites: string[];
  learningObjectives: string[];
  keyTopics: string[];
  resources: Resource[];
  status: NodeStatus; // Updated to use the exported type
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

export interface Roadmap {
  id: string;
  title: string;
  domain: string;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  progress: Progress;
  createdAt: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface UserStats {
  totalRoadmaps: number;
  completedNodes: number;
  currentStreak: number;
  totalHours: number;
  history: { date: string; hours: number; nodesCompleted: number }[];
  achievements: Achievement[];
}

export interface UnifiedNode extends RoadmapNode {
  originRoadmapIds: string[]; 
  globalPriorityScore: number; 
  synergyCount: number; 
  isBottleneck: boolean; 
}

export interface UnifiedRoadmap {
  id: string;
  nodes: UnifiedNode[];
  edges: RoadmapEdge[];
  totalMastery: number;
  goals: string[];
  generatedAt: number;
}
