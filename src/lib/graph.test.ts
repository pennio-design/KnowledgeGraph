import { describe, it, expect } from 'vitest';
import { normalizeRoadmap, completeNode, toggleResource, breakCycles, layoutLayered } from './graph';

const raw = (nodes: any[], extra: any = {}) => ({ title: 'T', domain: 'D', nodes, ...extra });

describe('normalizeRoadmap', () => {
  it('derives edges from prerequisites even when the model returns edges: []', () => {
    const r = normalizeRoadmap(raw([
      { id: '1', title: 'A', prerequisites: [] },
      { id: '2', title: 'B', prerequisites: ['1'] },
    ], { edges: [] }), 'goal');
    expect(r.edges).toEqual([{ id: 'e-1-2', source: '1', target: '2' }]);
  });

  it('drops unknown/self prerequisites so nodes cannot be locked forever', () => {
    const r = normalizeRoadmap(raw([
      { id: '1', title: 'A', prerequisites: ['ghost', '1'] },
      { id: '2', title: 'B', prerequisites: ['1'] },
    ]), 'goal');
    expect(r.nodes[0].prerequisites).toEqual([]);
    expect(r.nodes[0].status).toBe('available');
    expect(r.nodes[1].status).toBe('locked');
  });

  it('only the first node is not forced available when it has prerequisites', () => {
    const r = normalizeRoadmap(raw([
      { id: 'a', title: 'A', prerequisites: ['b'] },
      { id: 'b', title: 'B', prerequisites: [] },
    ]), 'goal');
    expect(r.nodes.find(n => n.id === 'a')!.status).toBe('locked');
    expect(r.nodes.find(n => n.id === 'b')!.status).toBe('available');
  });

  it('breaks prerequisite cycles so at least one node is startable', () => {
    const r = normalizeRoadmap(raw([
      { id: '1', title: 'A', prerequisites: ['2'] },
      { id: '2', title: 'B', prerequisites: ['1'] },
    ]), 'goal');
    expect(r.nodes.some(n => n.status === 'available')).toBe(true);
  });

  it('survives missing fields and de-duplicates ids', () => {
    const r = normalizeRoadmap(raw([{ id: '1' }, { id: '1', title: 'Dup' }, {}]), 'goal');
    expect(new Set(r.nodes.map(n => n.id)).size).toBe(3);
    expect(r.nodes[0].resources).toEqual([]);
    expect(r.progress).toEqual({ completedNodes: 0, totalNodes: 3, percentage: 0 });
  });

  it('rejects an empty roadmap', () => {
    expect(() => normalizeRoadmap(raw([]), 'goal')).toThrow();
  });

  it('builds search URLs per platform with unique resource ids', () => {
    const r = normalizeRoadmap(raw([{ id: '1', title: 'A', resources: [
      { title: 'x', platform: 'YouTube', searchQuery: 'react hooks' },
      { title: 'y', platform: 'GitHub', searchQuery: 'site:github.com react' },
    ] }]), 'goal');
    expect(r.nodes[0].resources[0].url).toContain('youtube.com/results?search_query=react%20hooks');
    expect(r.nodes[0].resources[1].url).toContain('google.com/search');
    expect(new Set(r.nodes[0].resources.map(x => x.id)).size).toBe(2);
  });
});

describe('layout', () => {
  it('places dependants on deeper rows', () => {
    const p = layoutLayered(['a', 'b', 'c'], [{ source: 'a', target: 'b' }, { source: 'b', target: 'c' }]);
    expect(p.get('a')!.y).toBeLessThan(p.get('b')!.y);
    expect(p.get('b')!.y).toBeLessThan(p.get('c')!.y);
  });
  it('breakCycles keeps an acyclic subset', () => {
    const e = [{ id: '1', source: 'a', target: 'b' }, { id: '2', source: 'b', target: 'a' }];
    expect(breakCycles(['a', 'b'], e)).toHaveLength(1);
  });
});

describe('progress mutations', () => {
  const base = () => normalizeRoadmap(raw([
    { id: '1', title: 'A', prerequisites: [], resources: [{ title: 'r' }] },
    { id: '2', title: 'B', prerequisites: ['1'] },
  ]), 'goal');

  it('completeNode unlocks dependants, updates progress and does not mutate the input', () => {
    const before = base();
    const after = completeNode(before, '1');
    expect(before.nodes[0].status).toBe('available');
    expect(after.nodes[0].status).toBe('completed');
    expect(after.nodes[1].status).toBe('available');
    expect(after.progress.percentage).toBe(50);
  });

  it('cannot complete a locked node', () => {
    const before = base();
    expect(completeNode(before, '2')).toBe(before);
  });

  it('toggleResource is immutable', () => {
    const before = base();
    const after = toggleResource(before, '1', before.nodes[0].resources[0].id);
    expect(before.nodes[0].resources[0].completed).toBe(false);
    expect(after.nodes[0].resources[0].completed).toBe(true);
  });
});
