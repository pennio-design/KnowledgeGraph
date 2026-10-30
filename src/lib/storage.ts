import { PersistedState } from '../types';
import { emptyStats, INITIAL_ACHIEVEMENTS } from './stats';

export const STORAGE_KEY = 'knowledge_graph_data';
const BRIEF_PREFIX = 'wolf_brief_';
const API_KEY_STORAGE = 'knowledge_graph_gemini_key';

export const emptyState = (): PersistedState => ({
  version: 2,
  stats: emptyStats(),
  savedRoadmaps: [],
  unifiedRoadmap: null,
});

/** Reads state synchronously; accepts the legacy un-versioned shape. Never throws. */
export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    const base = emptyState();
    const stats = { ...base.stats, ...(parsed.stats ?? {}) };
    // Add achievements introduced after the user's data was saved
    stats.achievements = INITIAL_ACHIEVEMENTS.map(a => ({
      ...a,
      ...(stats.achievements?.find((x: { id: string }) => x.id === a.id) ?? {}),
    }));
    return {
      version: 2,
      stats,
      savedRoadmaps: Array.isArray(parsed.savedRoadmaps) ? parsed.savedRoadmaps : [],
      unifiedRoadmap: parsed.unifiedRoadmap ?? null,
    };
  } catch (e) {
    console.error('Failed to load saved state', e);
    return emptyState();
  }
}

/** Returns false if the browser refused the write (quota, private mode). */
export function saveState(state: PersistedState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.error('Failed to save state', e);
    return false;
  }
}

const safeGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

export const getStoredApiKey = (): string => safeGet(API_KEY_STORAGE) ?? '';
export const setStoredApiKey = (key: string) => safeSet(API_KEY_STORAGE, key.trim());

/** Daily briefs are cached per node *per day* so the "daily" brief actually changes. */
export const briefCacheKey = (nodeId: string, day: string) => `${BRIEF_PREFIX}${day}_${nodeId}`;
export const getCachedBrief = (k: string) => safeGet(k);
export const setCachedBrief = (k: string, v: string) => safeSet(k, v);
