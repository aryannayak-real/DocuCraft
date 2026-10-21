const FAVORITES_STORAGE_KEY = 'docucraft_favorite_tools';
const RECENTS_STORAGE_KEY = 'docucraft_recent_tools';

export function getFavoriteToolIds(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return ['merge', 'split', 'watermark', 'compress'];
    return JSON.parse(raw);
  } catch {
    return ['merge', 'split', 'watermark', 'compress'];
  }
}

export function toggleFavoriteToolId(toolId: string): string[] {
  try {
    const current = getFavoriteToolIds();
    let next: string[];
    if (current.includes(toolId)) {
      next = current.filter((id) => id !== toolId);
    } else {
      next = [...current, toolId];
    }
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export function getRecentToolIds(): string[] {
  try {
    const raw = localStorage.getItem(RECENTS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function recordRecentToolId(toolId: string): string[] {
  try {
    const current = getRecentToolIds().filter((id) => id !== toolId);
    const next = [toolId, ...current].slice(0, 8); // Keep top 8
    localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export function clearUserActivityPreferences(): void {
  try {
    localStorage.removeItem(FAVORITES_STORAGE_KEY);
    localStorage.removeItem(RECENTS_STORAGE_KEY);
  } catch {
    // ignore
  }
}
