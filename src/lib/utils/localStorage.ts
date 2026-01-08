import type {
	SearchResult,
	MovieUserRating,
	LockedFilters,
	TraktUser,
	WatchlistItem,
	MoviePreferences
} from '$lib/types/discover';

export type { WatchlistItem } from '$lib/types/discover';

const SEARCH_HISTORY_KEY = 'movie_search_history';
const MOVIE_RATINGS_KEY = 'movie_ratings';
const LOCKED_FILTERS_KEY = 'locked_filters';
const TRAKT_USER_KEY = 'trakt_user';
const WATCHLIST_KEY = 'watchlist';

export function saveSearchResult(result: SearchResult): void {
	try {
		const history = getSearchHistory();
		history.unshift(result);
		// Keep only last 50 searches
		const trimmedHistory = history.slice(0, 50);
		localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(trimmedHistory));
	} catch (error) {
		console.error('Error saving search result:', error);
	}
}

export function getSearchHistory(): SearchResult[] {
	try {
		const data = localStorage.getItem(SEARCH_HISTORY_KEY);
		return data ? JSON.parse(data) : [];
	} catch (error) {
		console.error('Error reading search history:', error);
		return [];
	}
}

export function deleteSearchResult(id: string): void {
	try {
		const history = getSearchHistory();
		const filtered = history.filter((item) => item.id !== id);
		localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
	} catch (error) {
		console.error('Error deleting search result:', error);
	}
}

export function saveMovieRating(movieId: string, rating: MovieUserRating): void {
	try {
		const ratings = getMovieRatings();
		ratings[movieId] = rating;
		localStorage.setItem(MOVIE_RATINGS_KEY, JSON.stringify(ratings));
	} catch (error) {
		console.error('Error saving movie rating:', error);
	}
}

export function getMovieRatings(): Record<string, MovieUserRating> {
	try {
		const data = localStorage.getItem(MOVIE_RATINGS_KEY);
		return data ? JSON.parse(data) : {};
	} catch (error) {
		console.error('Error reading movie ratings:', error);
		return {};
	}
}

export function getMovieRating(movieId: string): MovieUserRating | null {
	const ratings = getMovieRatings();
	return ratings[movieId] || null;
}

export function saveLockedFilters(filters: LockedFilters): void {
	try {
		localStorage.setItem(LOCKED_FILTERS_KEY, JSON.stringify(filters));
	} catch (error) {
		console.error('Error saving locked filters:', error);
	}
}

export function getLockedFilters(): LockedFilters {
	try {
		const data = localStorage.getItem(LOCKED_FILTERS_KEY);
		return data ? JSON.parse(data) : {};
	} catch (error) {
		console.error('Error reading locked filters:', error);
		return {};
	}
}

export function saveLockedFilterValues(values: Partial<MoviePreferences>): void {
	try {
		localStorage.setItem('locked_filter_values', JSON.stringify(values));
	} catch (error) {
		console.error('Error saving locked filter values:', error);
	}
}

export function getLockedFilterValues(): Partial<MoviePreferences> {
	try {
		const data = localStorage.getItem('locked_filter_values');
		return data ? JSON.parse(data) : {};
	} catch (error) {
		console.error('Error reading locked filter values:', error);
		return {};
	}
}


export function saveTraktUser(user: TraktUser): void {
	try {
		localStorage.setItem(TRAKT_USER_KEY, JSON.stringify(user));
	} catch (error) {
		console.error('Error saving Trakt user:', error);
	}
}

export function getTraktUser(): TraktUser | null {
	try {
		const data = localStorage.getItem(TRAKT_USER_KEY);
		return data ? JSON.parse(data) : null;
	} catch (error) {
		console.error('Error reading Trakt user:', error);
		return null;
	}
}

export function clearTraktUser(): void {
	try {
		localStorage.removeItem(TRAKT_USER_KEY);
	} catch (error) {
		console.error('Error clearing Trakt user:', error);
	}
}

export function saveWatchlistItem(item: WatchlistItem): void {
	try {
		const watchlist = getWatchlist();
		// Check if already exists
		const exists = watchlist.some((w) => w.movie.id === item.movie.id);
		if (!exists) {
			watchlist.unshift(item);
			localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
		}
	} catch (error) {
		console.error('Error saving watchlist item:', error);
	}
}

export function removeWatchlistItem(movieId: string): void {
	try {
		const watchlist = getWatchlist();
		const filtered = watchlist.filter((item) => item.movie.id !== movieId);
		localStorage.setItem(WATCHLIST_KEY, JSON.stringify(filtered));
	} catch (error) {
		console.error('Error removing watchlist item:', error);
	}
}

export function getWatchlist(): WatchlistItem[] {
	try {
		const data = localStorage.getItem(WATCHLIST_KEY);
		return data ? JSON.parse(data) : [];
	} catch (error) {
		console.error('Error reading watchlist:', error);
		return [];
	}
}
