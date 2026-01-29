
export type ResourceFormat = 'video' | 'article' | 'interactive' | 'documentation';

export interface Resource {
  id: string;
  url: string;
  title: string;
  author: string;
  platform: string;
  format: ResourceFormat;
  description: string;
  duration?: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isFree: boolean;
  completed?: boolean;
}

export type NodeStatus = 'locked' | 'available' | 'in_progress' | 'completed';
export type NodeType = 'concept' | 'milestone' | 'optional';

export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  nodeType: NodeType;
  category: string;
  difficulty: string;
  estimatedHours: number;
  prerequisites: string[];
  learningObjectives: string[];
  keyTopics: string[];
  status: NodeStatus;
  resources: Resource[];
  position: { x: number; y: number };
}

export interface RoadmapEdge {
  id: string;
  source: string;
  target: string;
}

export interface Roadmap {
  id: string;
  title: string;
  domain: string;
  nodes: RoadmapNode[];
  edges: RoadmapEdge[];
  progress: {
    completedNodes: number;
    totalNodes: number;
    percentage: number;
  };
  createdAt: number;
}

export interface ActivityLog {
  date: string; // YYYY-MM-DD
  hours: number;
  nodesCompleted: number;
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
  history: ActivityLog[];
  achievements: Achievement[];
}

// --- META-LEARNING TYPES ---

export interface UnifiedNode extends RoadmapNode {
  originRoadmapIds: string[]; // Which roadmaps does this belong to?
  globalPriorityScore: number; // 0-100 (Calculated via Pareto algo)
  synergyCount: number; // How many diverse domains does this unlock?
  isBottleneck: boolean; // Does this block >2 other high-priority nodes?
}

export interface UnifiedRoadmap {
  id: string;
  nodes: UnifiedNode[];
  edges: RoadmapEdge[]; // Consolidated edges
  totalMastery: number; // Global percentage
  goals: string[]; // List of all combined goals (e.g., "React Dev" + "UI Designer")
  generatedAt: number;
}
