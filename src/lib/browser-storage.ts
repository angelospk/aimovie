/**
 * Browser storage utility module with localStorage helpers
 * Handles errors gracefully for private/incognito modes and quota exceeded scenarios
 */

const STORAGE_KEYS = {
	SEARCH_HISTORY: 'openpopcorn_search_history',
	VIEWING_HISTORY: 'openpopcorn_viewing_history',
	EPISODE_SELECTION: 'openpopcorn_episode_selection',
	NOT_INTERESTED: 'openpopcorn_not_interested',
	WATCH_GUIDE_DISMISSED: 'watch-guide-dismissed',
	BRAVE_BANNER_DISMISSED: 'brave-banner-dismissed',
	AUTOPLAY_ENABLED: 'openpopcorn_autoplay_enabled'
} as const;

const MAX_HISTORY_ITEMS = 150;

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
	if (typeof window === 'undefined') return false;
	try {
		const test = '__storage_test__';
		localStorage.setItem(test, test);
		localStorage.removeItem(test);
		return true;
	} catch (e) {
		return false;
	}
}

/**
 * Safely get item from localStorage
 */
function getItem(key: string): string | null {
	if (!isStorageAvailable()) return null;
	try {
		return localStorage.getItem(key);
	} catch (e) {
		console.warn('Failed to read from localStorage:', e);
		return null;
	}
}

/**
 * Safely set item in localStorage
 */
function setItem(key: string, value: string): boolean {
	if (!isStorageAvailable()) return false;
	try {
		localStorage.setItem(key, value);
		return true;
	} catch (e) {
		console.warn('Failed to write to localStorage:', e);
		return false;
	}
}

/**
 * Search History
 */
export interface SearchHistoryItem {
	query: string;
	timestamp: number;
}

export function getSearchHistory(): SearchHistoryItem[] {
	const data = getItem(STORAGE_KEYS.SEARCH_HISTORY);
	if (!data) return [];
	try {
		const parsed = JSON.parse(data);
		return Array.isArray(parsed) ? parsed : [];
	} catch (e) {
		console.warn('Failed to parse search history:', e);
		return [];
	}
}

export function addSearchHistory(query: string): void {
	if (!query || query.trim().length < 2) return;
	const trimmed = query.trim();
	const history = getSearchHistory();

	// Remove exact duplicates
	let filtered = history.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase());

	// Remove prefix/suffix duplicates:
	// - If new query is shorter and is a prefix of an existing query, don't add it
	// - If an existing query is a prefix of the new query, remove the shorter one
	const normalized = trimmed.toLowerCase();
	filtered = filtered.filter((item) => {
		const existing = item.query.toLowerCase();
		// Don't keep existing if it's a prefix of the new query (new is more complete)
		if (existing.length < normalized.length && normalized.startsWith(existing)) {
			return false;
		}
		// Don't add new if it's a prefix of existing (existing is more complete)
		if (normalized.length < existing.length && existing.startsWith(normalized)) {
			return false;
		}
		return true;
	});

	// Add new item
	filtered.push({ query: trimmed, timestamp: Date.now() });

	// Keep only most recent 20
	const limited = filtered.slice(-MAX_HISTORY_ITEMS);

	setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(limited));
}

/**
 * Viewing History
 */
export interface ViewingHistoryItem {
	id: string;
	title: string;
	year?: string;
	type: string;
	imageUrl?: string;
	timestamp: number;
}

export function getViewingHistory(): ViewingHistoryItem[] {
	const data = getItem(STORAGE_KEYS.VIEWING_HISTORY);
	if (!data) return [];
	try {
		const parsed = JSON.parse(data);
		return Array.isArray(parsed) ? parsed : [];
	} catch (e) {
		console.warn('Failed to parse viewing history:', e);
		return [];
	}
}

export function addViewingHistory(item: Omit<ViewingHistoryItem, 'timestamp'>): void {
	if (!item.id || !item.title) return;
	const history = getViewingHistory();

	// Remove duplicates (same id) and update timestamp
	const filtered = history.filter((h) => h.id !== item.id);

	// Add new item
	filtered.push({ ...item, timestamp: Date.now() });

	// Keep only most recent 20
	const limited = filtered.slice(-MAX_HISTORY_ITEMS);

	setItem(STORAGE_KEYS.VIEWING_HISTORY, JSON.stringify(limited));
}

export function removeViewingHistoryItem(id: string): void {
	if (!id) return;
	const history = getViewingHistory();

	// Remove item with matching id
	const filtered = history.filter((h) => h.id !== id);

	setItem(STORAGE_KEYS.VIEWING_HISTORY, JSON.stringify(filtered));
}

/**
 * Not Interested List
 */
export interface NotInterestedItem {
	id: string;
	title: string;
	year?: string;
	type: string;
	imageUrl?: string;
	timestamp: number;
}

export function getNotInterested(): NotInterestedItem[] {
	const data = getItem(STORAGE_KEYS.NOT_INTERESTED);
	if (!data) return [];
	try {
		const parsed = JSON.parse(data);
		return Array.isArray(parsed) ? parsed : [];
	} catch (e) {
		console.warn('Failed to parse not interested list:', e);
		return [];
	}
}

export function addToNotInterested(item: Omit<NotInterestedItem, 'timestamp'>): void {
	if (!item.id || !item.title) return;
	const list = getNotInterested();

	// Remove duplicates (same id)
	const filtered = list.filter((h) => h.id !== item.id);

	// Add new item
	filtered.push({ ...item, timestamp: Date.now() });

	// Keep only most recent items to prevent unbounded growth
	const limited = filtered.slice(-MAX_HISTORY_ITEMS);

	setItem(STORAGE_KEYS.NOT_INTERESTED, JSON.stringify(limited));
}

export function removeFromNotInterested(id: string): void {
	if (!id) return;
	const list = getNotInterested();

	// Remove item with matching id
	const filtered = list.filter((h) => h.id !== id);

	setItem(STORAGE_KEYS.NOT_INTERESTED, JSON.stringify(filtered));
}

/**
 * Episode Selection Persistence
 */
export interface EpisodeSelection {
	season: number;
	episode: number;
}

export function getEpisodeSelection(imdbId: string): EpisodeSelection | null {
	const data = getItem(`${STORAGE_KEYS.EPISODE_SELECTION}_${imdbId}`);
	if (!data) return null;
	try {
		const parsed = JSON.parse(data);
		if (typeof parsed.season === 'number' && typeof parsed.episode === 'number') {
			return { season: parsed.season, episode: parsed.episode };
		}
		return null;
	} catch (e) {
		console.warn('Failed to parse episode selection:', e);
		return null;
	}
}

export function saveEpisodeSelection(imdbId: string, selection: EpisodeSelection): void {
	if (!imdbId) return;
	const key = `${STORAGE_KEYS.EPISODE_SELECTION}_${imdbId}`;
	setItem(key, JSON.stringify(selection));
}

/**
 * Watch Guide Position Preference
 * When dismissed, guides move to the bottom of the page instead of being hidden.
 */
export function isWatchGuideDismissed(): boolean {
	const data = getItem(STORAGE_KEYS.WATCH_GUIDE_DISMISSED);
	return data === 'true';
}

export function setWatchGuideDismissed(dismissed: boolean): void {
	setItem(STORAGE_KEYS.WATCH_GUIDE_DISMISSED, dismissed ? 'true' : 'false');
}

/**
 * Brave Banner Visibility Preference
 * When dismissed, the Brave browser recommendation banner is hidden.
 */
export function isBraveBannerDismissed(): boolean {
	const data = getItem(STORAGE_KEYS.BRAVE_BANNER_DISMISSED);
	return data === 'true';
}

export function setBraveBannerDismissed(dismissed: boolean): void {
	setItem(STORAGE_KEYS.BRAVE_BANNER_DISMISSED, dismissed ? 'true' : 'false');
}

/**
 * Autoplay Preference
 * When enabled, Player 1 will autoplay videos by default.
 */
export function getAutoplayPreference(): boolean {
	const data = getItem(STORAGE_KEYS.AUTOPLAY_ENABLED);
	return data === 'true';
}

export function setAutoplayPreference(enabled: boolean): void {
	setItem(STORAGE_KEYS.AUTOPLAY_ENABLED, enabled ? 'true' : 'false');
}
