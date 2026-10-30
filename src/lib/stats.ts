import { Achievement, UserStats } from '../types';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_roadmap', title: 'The Architect', description: 'Generated your first learning roadmap', unlocked: false },
  { id: 'first_node', title: 'First Step', description: 'Completed your very first learning node', unlocked: false },
  { id: 'master_5', title: 'Knowledge Seeker', description: 'Completed 5 learning nodes', unlocked: false },
  { id: 'streak_3', title: 'Consistent', description: 'Maintained a 3-day learning streak', unlocked: false },
];

export const emptyStats = (): UserStats => ({
  totalRoadmaps: 0,
  completedNodes: 0,
  currentStreak: 0,
  totalHours: 0,
  history: [],
  achievements: INITIAL_ACHIEVEMENTS.map(a => ({ ...a })),
});

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar date key. (toISOString is UTC and shifts the day for evening users.) */
export const dateKey = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const shiftDays = (key: string, delta: number): string => {
  const [y, m, d] = key.split('-').map(Number);
  return dateKey(new Date(y, m - 1, d + delta));
};

/** Consecutive active days ending today (or yesterday, so the streak survives until midnight). */
export function computeStreak(history: UserStats['history'], today: string): number {
  const active = new Set(history.filter(h => h.nodesCompleted > 0).map(h => h.date));
  let cursor = active.has(today) ? today : shiftDays(today, -1);
  let streak = 0;
  while (active.has(cursor)) {
    streak += 1;
    cursor = shiftDays(cursor, -1);
  }
  return streak;
}

function unlock(a: Achievement[], id: string, now: number): Achievement[] {
  return a.map(x => (x.id === id && !x.unlocked ? { ...x, unlocked: true, unlockedAt: now } : x));
}

export function recordRoadmapCreated(stats: UserStats, now = Date.now()): UserStats {
  return {
    ...stats,
    totalRoadmaps: stats.totalRoadmaps + 1,
    achievements: unlock(stats.achievements, 'first_roadmap', now),
  };
}

export function recordNodeCompleted(stats: UserStats, hours: number, now = new Date()): UserStats {
  const today = dateKey(now);
  const exists = stats.history.some(h => h.date === today);
  const history = exists
    ? stats.history.map(h => (h.date === today
      ? { ...h, nodesCompleted: h.nodesCompleted + 1, hours: h.hours + hours }
      : h))
    : [...stats.history, { date: today, hours, nodesCompleted: 1 }];

  const completedNodes = stats.completedNodes + 1;
  const currentStreak = computeStreak(history, today);
  const t = now.getTime();

  let achievements = unlock(stats.achievements, 'first_node', t);
  if (completedNodes >= 5) achievements = unlock(achievements, 'master_5', t);
  if (currentStreak >= 3) achievements = unlock(achievements, 'streak_3', t);

  return { ...stats, history, completedNodes, currentStreak, totalHours: stats.totalHours + hours, achievements };
}

/** The stored streak goes stale overnight; recompute for display. */
export const displayStreak = (stats: UserStats, now = new Date()): number =>
  computeStreak(stats.history, dateKey(now));
