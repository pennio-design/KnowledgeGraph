import {
  Difficulty, Progress, Resource, Roadmap, RoadmapEdge, RoadmapNode, NodeStatus,
} from '../types';

const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

const asString = (v: unknown, fallback = ''): string =>
  typeof v === 'string' && v.trim() ? v.trim() : fallback;

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.trim() !== '') : [];

const asPositive = (v: unknown, fallback: number): number => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export const NODE_X_GAP = 260;
export const NODE_Y_GAP = 170;

/** Drops edges that close a cycle (DFS back edges). Returns edges that form a DAG. */
export function breakCycles(ids: string[], edges: RoadmapEdge[]): RoadmapEdge[] {
  const out = new Map<string, RoadmapEdge[]>();
  ids.forEach(id => out.set(id, []));
  edges.forEach(e => out.get(e.source)?.push(e));

  const state = new Map<string, 0 | 1 | 2>(); // 1 = on stack, 2 = done
  const dropped = new Set<string>();

  const visit = (id: string) => {
    state.set(id, 1);
    for (const e of out.get(id) ?? []) {
      const s = state.get(e.target) ?? 0;
      if (s === 1) dropped.add(e.id);
      else if (s === 0) visit(e.target);
    }
    state.set(id, 2);
  };
  ids.forEach(id => { if (!state.get(id)) visit(id); });
  return edges.filter(e => !dropped.has(e.id));
}

/** Layered layout: row = longest path from any root, columns centred per row. */
export function layoutLayered(
  ids: string[],
  edges: { source: string; target: string }[],
): Map<string, { x: number; y: number }> {
  const incoming = new Map<string, string[]>();
  ids.forEach(id => incoming.set(id, []));
  edges.forEach(e => incoming.get(e.target)?.push(e.source));

  const depth = new Map<string, number>();
  const resolve = (id: string, trail: Set<string>): number => {
    const known = depth.get(id);
    if (known !== undefined) return known;
    if (trail.has(id)) return 0;
    trail.add(id);
    const d = Math.max(-1, ...(incoming.get(id) ?? []).map(p => resolve(p, trail))) + 1;
    trail.delete(id);
    depth.set(id, d);
    return d;
  };
  ids.forEach(id => resolve(id, new Set()));

  const rows = new Map<number, string[]>();
  ids.forEach(id => {
    const d = depth.get(id) ?? 0;
    rows.set(d, [...(rows.get(d) ?? []), id]);
  });

  const positions = new Map<string, { x: number; y: number }>();
  rows.forEach((row, d) => {
    row.forEach((id, i) => {
      positions.set(id, { x: (i - (row.length - 1) / 2) * NODE_X_GAP, y: d * NODE_Y_GAP });
    });
  });
  return positions;
}

export function computeStatuses(nodes: RoadmapNode[]): RoadmapNode[] {
  const done = new Set(nodes.filter(n => n.status === 'completed').map(n => n.id));
  return nodes.map(n => {
    if (n.status === 'completed') return n;
    const status: NodeStatus = n.prerequisites.every(p => done.has(p)) ? 'available' : 'locked';
    return status === n.status ? n : { ...n, status };
  });
}

export function progressOf(nodes: RoadmapNode[]): Progress {
  const completedNodes = nodes.filter(n => n.status === 'completed').length;
  const totalNodes = nodes.length;
  return {
    completedNodes,
    totalNodes,
    percentage: totalNodes === 0 ? 0 : Math.round((completedNodes / totalNodes) * 100),
  };
}

const edgeId = (s: string, t: string) => `e-${s}-${t}`;

function buildResourceUrl(platform: string, query: string): string {
  const q = encodeURIComponent(query);
  return platform.toLowerCase().includes('youtube')
    ? `https://www.youtube.com/results?search_query=${q}`
    : `https://www.google.com/search?q=${q}`;
}

function normalizeResource(raw: any, nodeIdx: number, i: number): Resource {
  const title = asString(raw?.title, 'Untitled resource');
  const platform = asString(raw?.platform, 'Google');
  const query = asString(raw?.searchQuery, title);
  return {
    id: `n${nodeIdx}-r${i}`,
    title,
    platform,
    format: asString(raw?.format, 'article'),
    description: asString(raw?.description),
    duration: asPositive(raw?.duration, 15),
    difficulty: asString(raw?.difficulty, 'beginner'),
    completed: false,
    searchQuery: query,
    isFree: raw?.isFree !== false,
    author: asString(raw?.author) || undefined,
    url: buildResourceUrl(platform, query),
  };
}

/**
 * Turns untrusted model output into a valid Roadmap: unique ids, prerequisites that
 * point at real nodes, an acyclic graph, edges derived from prerequisites, statuses
 * and a computed layout. Throws if there is nothing usable.
 */
export function normalizeRoadmap(raw: any, goal: string, now = Date.now()): Roadmap {
  const rawNodes: any[] = Array.isArray(raw?.nodes) ? raw.nodes : [];
  if (rawNodes.length === 0) throw new Error('The model returned a roadmap with no nodes. Try again.');

  // Stable unique ids
  const seen = new Set<string>();
  const idOf = rawNodes.map((n, i) => {
    let id = asString(n?.id !== undefined ? String(n.id) : '', `node-${i + 1}`);
    while (seen.has(id)) id = `${id}-${i + 1}`;
    seen.add(id);
    return id;
  });
  const valid = new Set(idOf);

  // Prerequisite edges + any extra edges the model supplied
  const candidate: RoadmapEdge[] = [];
  const edgeKeys = new Set<string>();
  const addEdge = (source: string, target: string) => {
    const key = `${source}>${target}`;
    if (source === target || !valid.has(source) || !valid.has(target) || edgeKeys.has(key)) return;
    edgeKeys.add(key);
    candidate.push({ id: edgeId(source, target), source, target });
  };
  rawNodes.forEach((n, i) => asStringArray(n?.prerequisites).forEach(p => addEdge(String(p), idOf[i])));
  (Array.isArray(raw?.edges) ? raw.edges : []).forEach((e: any) =>
    addEdge(asString(e?.source != null ? String(e.source) : ''), asString(e?.target != null ? String(e.target) : '')),
  );

  const edges = breakCycles(idOf, candidate);
  const prereqs = new Map<string, string[]>();
  idOf.forEach(id => prereqs.set(id, []));
  edges.forEach(e => prereqs.get(e.target)!.push(e.source));

  const positions = layoutLayered(idOf, edges);

  const nodes: RoadmapNode[] = rawNodes.map((n, i) => {
    const difficulty = DIFFICULTIES.includes(n?.difficulty) ? n.difficulty : 'beginner';
    return {
      id: idOf[i],
      title: asString(n?.title, `Step ${i + 1}`),
      description: asString(n?.description),
      nodeType: asString(n?.nodeType, 'concept'),
      category: asString(n?.category, 'Core'),
      difficulty,
      estimatedHours: asPositive(n?.estimatedHours, 2),
      prerequisites: prereqs.get(idOf[i])!,
      learningObjectives: asStringArray(n?.learningObjectives),
      keyTopics: asStringArray(n?.keyTopics),
      resources: (Array.isArray(n?.resources) ? n.resources : []).map((r: any, j: number) =>
        normalizeResource(r, i, j)),
      status: 'locked',
      position: positions.get(idOf[i]) ?? { x: 0, y: i * NODE_Y_GAP },
    };
  });

  const withStatus = computeStatuses(nodes);
  return {
    id: `roadmap-${now}`,
    title: asString(raw?.title, goal),
    domain: asString(raw?.domain, 'Custom Learning Path'),
    goal,
    nodes: withStatus,
    edges,
    progress: progressOf(withStatus),
    createdAt: now,
  };
}

export function toggleResource(roadmap: Roadmap, nodeId: string, resourceId: string): Roadmap {
  return {
    ...roadmap,
    nodes: roadmap.nodes.map(n =>
      n.id !== nodeId ? n : {
        ...n,
        resources: n.resources.map(r => (r.id === resourceId ? { ...r, completed: !r.completed } : r)),
      }),
  };
}

/** Marks a node complete (if it is available), unlocks dependants and recomputes progress. */
export function completeNode(roadmap: Roadmap, nodeId: string): Roadmap {
  const target = roadmap.nodes.find(n => n.id === nodeId);
  if (!target || target.status !== 'available') return roadmap;
  const nodes = computeStatuses(
    roadmap.nodes.map(n => (n.id === nodeId ? { ...n, status: 'completed' as const } : n)),
  );
  return { ...roadmap, nodes, progress: progressOf(nodes) };
}
