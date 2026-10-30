import { describe, it, expect } from 'vitest';
import { computeStreak, dateKey, emptyStats, recordNodeCompleted } from './stats';

const h = (date: string) => ({ date, hours: 1, nodesCompleted: 1 });

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    expect(computeStreak([h('2026-03-01'), h('2026-03-02'), h('2026-03-03')], '2026-03-03')).toBe(3);
  });
  it('survives until midnight (yesterday still counts)', () => {
    expect(computeStreak([h('2026-03-01'), h('2026-03-02')], '2026-03-03')).toBe(2);
  });
  it('resets after a gap', () => {
    expect(computeStreak([h('2026-03-01')], '2026-03-03')).toBe(0);
  });
  it('crosses month boundaries', () => {
    expect(computeStreak([h('2026-02-28'), h('2026-03-01')], '2026-03-01')).toBe(2);
  });
});

describe('recordNodeCompleted', () => {
  it('does not mutate previous stats and aggregates per day', () => {
    const s0 = emptyStats();
    const day = new Date(2026, 2, 3, 23, 30);
    const s1 = recordNodeCompleted(s0, 2, day);
    const s2 = recordNodeCompleted(s1, 3, day);
    expect(s0.history).toHaveLength(0);
    expect(s1.history[0].nodesCompleted).toBe(1);
    expect(s2.history).toEqual([{ date: dateKey(day), hours: 5, nodesCompleted: 2 }]);
    expect(s2.totalHours).toBe(5);
  });
  it('unlocks achievements from fresh counts, not stale state', () => {
    let s = emptyStats();
    for (let i = 0; i < 5; i++) s = recordNodeCompleted(s, 1, new Date(2026, 2, 3));
    const ids = s.achievements.filter(a => a.unlocked).map(a => a.id);
    expect(ids).toContain('first_node');
    expect(ids).toContain('master_5');
  });
});
