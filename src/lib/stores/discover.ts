import { writable } from 'svelte/store';
import type {
	SearchResult,
	WatchlistItem,
	TraktUser,
	MoviePreferences,
	MovieRecommendation
} from '$lib/types/discover';
import {
	getSearchHistory,
	saveSearchResult,
	deleteSearchResult,
	getWatchlist,
	removeWatchlistItem,
	saveWatchlistItem
} from '$lib/utils/localStorage';
import {
	getNotInterested,
	addToNotInterested as addToNotInterestedStorage,
	removeFromNotInterested as removeFromNotInterestedStorage,
	type NotInterestedItem
} from '$lib/browser-storage';
import { generatePromptText } from '$lib/utils/promptGenerator';
import { browser } from '$app/environment';
import { settings } from '$lib/store.svelte';

export const isStreaming = writable(false);
export const currentResult = writable<SearchResult | null>(null);
export const searchHistory = writable<SearchResult[]>([]);
export const watchlist = writable<WatchlistItem[]>([]);
export const notInterested = writable<NotInterestedItem[]>([]);
export const traktUser = writable<TraktUser | null>(null);

export function refreshWatchlist() {
	if (!browser) return;
	watchlist.set(getWatchlist());
}

export function refreshNotInterested() {
	if (!browser) return;
	notInterested.set(getNotInterested());
}

export function refreshHistory() {
	if (!browser) return;
	searchHistory.set(getSearchHistory());
}

if (browser) {
	refreshHistory();
	refreshWatchlist();
	refreshNotInterested();
}

export async function handleSubmit(prefs: MoviePreferences) {
	currentResult.set(null);
	isStreaming.set(true);

	try {
		// Generate prompt from preferences (in user's language)
		const lang = (settings.lang === 'en' ? 'en' : 'el') as 'el' | 'en';
		const prompt = generatePromptText(prefs, lang);

		// Call AI API endpoint
		const response = await fetch('/api/ai/recommendations', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ prompt, language: settings.lang })
		});

		if (!response.ok) {
			// Parse error response for structured error details
			let errorData: { error?: string; errorType?: string; retryAfter?: number } = {};
			try {
				errorData = await response.json();
			} catch {
				// Response might not be JSON
			}

			const errorType = errorData.errorType || '';
			const retryAfter = errorData.retryAfter;
			const baseMessage = errorData.error || 'AI request failed';

			// Create a custom error with errorType attached
			const customError = new Error(baseMessage) as Error & {
				errorType?: string;
				retryAfter?: number;
			};
			customError.errorType = errorType;
			customError.retryAfter = retryAfter;
			throw customError;
		}

		const data = await response.json();

		if (!data.recommendations || !Array.isArray(data.recommendations)) {
			const customError = new Error('AI returned invalid data format.') as Error & {
				errorType?: string;
			};
			customError.errorType = 'INVALID_RESPONSE';
			throw customError;
		}

		// Generate fallback title if AI doesn't provide one
		let searchTitle = data.searchTitle;
		if (!searchTitle || searchTitle.trim() === '') {
			// Fallback: generate title from preferences
			if (prefs.genres.length > 0) {
				searchTitle = prefs.genres.slice(0, 2).join(' & ');
				if (prefs.period) {
					searchTitle = `${prefs.period} ${searchTitle}`;
				}
			} else if (prefs.freeText && prefs.freeText.length > 0) {
				searchTitle = prefs.freeText.slice(0, 50) + (prefs.freeText.length > 50 ? '...' : '');
			} else {
				searchTitle = 'Κινηματογραφικές Προτάσεις AI';
			}
		}

		const result: SearchResult = {
			id: `search_${Date.now()}`,
			timestamp: Date.now(),
			title: searchTitle,
			summary: prefs.freeText
				? prefs.freeText.slice(0, 60) + (prefs.freeText.length > 60 ? '...' : '')
				: `${prefs.genres.slice(0, 2).join(', ') || 'Γενικές'} προτάσεις`,
			preferences: prefs,
			recommendations: data.recommendations,
			userRatings: {}
		};

		currentResult.set(result);
		isStreaming.set(false);
		saveSearchResult(result);
		refreshHistory();
	} catch (error) {
		isStreaming.set(false);
		console.error('AI recommendations error:', error);
		// Re-throw to let error boundary handle it
		throw error;
	}
}

function simulateStreaming(prefs: MoviePreferences) {
	// Mock JSON response structure with mixed movies and series
	const mockRecommendations: MovieRecommendation[] = [
		{
			id: 'tt0120737',
			title: 'The Lord of the Rings: The Fellowship of the Ring',
			year: 2001,
			director: 'Peter Jackson',
			genres: ['Adventure', 'Drama', 'Fantasy'],
			explanation:
				'Επική φαντασία με εκπληκτική ανάπτυξη χαρακτήρων και οπτικά εφέ που σημάδεψαν εποχή.',
			type: 'movie'
		},
		{
			id: 'tt0903747',
			title: 'Breaking Bad',
			year: 2008,
			director: 'Vince Gilligan',
			genres: ['Crime', 'Drama', 'Thriller'],
			explanation:
				'Μια από τις καλύτερες σειρές όλων των εποχών. Η μεταμόρφωση του Walter White είναι συναρπαστική.',
			type: 'series'
		},
		{
			id: 'tt0137523',
			title: 'Fight Club',
			year: 1999,
			director: 'David Fincher',
			genres: ['Drama'],
			explanation:
				'Ψυχολογική αφήγηση με plot twist που θα σας αφήσει άφωνους. Σκοτεινό και προκλητικό.',
			type: 'movie'
		},
		{
			id: 'tt0468569',
			title: 'The Dark Knight',
			year: 2008,
			director: 'Christopher Nolan',
			genres: ['Action', 'Crime', 'Drama'],
			explanation:
				'Η απόλυτη superhero ταινία με φιλοσοφικό βάθος και την καλύτερη ερμηνεία κακού όλων των εποχών.',
			type: 'movie'
		},
		{
			id: 'tt0944947',
			title: 'Game of Thrones',
			year: 2011,
			director: 'David Benioff, D.B. Weiss',
			genres: ['Action', 'Adventure', 'Drama', 'Fantasy'],
			explanation:
				'Επικό φαντασιακό δράμα με πολύπλοκες πλοκές και απρόβλεπτες εξελίξεις (τουλάχιστον τις πρώτες σεζόν).',
			type: 'series'
		},
		{
			id: 'tt0816692',
			title: 'Interstellar',
			year: 2014,
			director: 'Christopher Nolan',
			genres: ['Adventure', 'Drama', 'Sci-Fi'],
			explanation:
				'Συναισθηματικό space opera που συνδυάζει επιστήμη με ανθρωπινή σύνδεση. Εκπληκτική μουσική επένδυση.',
			type: 'movie'
		},
		{
			id: 'tt0110912',
			title: 'Pulp Fiction',
			year: 1994,
			director: 'Quentin Tarantino',
			genres: ['Crime', 'Drama'],
			explanation:
				'Μη-γραμμική αφήγηση που επαναπροσδιόρισε το σινεμά. Εικονικοί διάλογοι και χαρακτήρες.',
			type: 'movie'
		},
		{
			id: 'tt1375666',
			title: 'Inception',
			year: 2010,
			director: 'Christopher Nolan',
			genres: ['Action', 'Sci-Fi', 'Thriller'],
			explanation:
				'Πολυεπίπεδη πλοκή που παίζει με την πραγματικότητα. Απαιτεί προσοχή αλλά ανταμείβει.',
			type: 'movie'
		},
		{
			id: 'tt2861424',
			title: 'Rick and Morty',
			year: 2013,
			director: 'Dan Harmon, Justin Roiland',
			genres: ['Animation', 'Comedy', 'Sci-Fi'],
			explanation:
				'Έξυπνη και σκοτεινή κωμωδία sci-fi με φιλοσοφικά ερωτήματα μέσα από απίθανες περιπέτειες.',
			type: 'series'
		},
		{
			id: 'tt0167260',
			title: 'The Lord of the Rings: The Return of the King',
			year: 2003,
			director: 'Peter Jackson',
			genres: ['Adventure', 'Drama', 'Fantasy'],
			explanation:
				'Η επική ολοκλήρωση της τριλογίας. Νικητής 11 Όσκαρ. Συγκινητικό και μεγαλειώδες φινάλε.',
			type: 'movie'
		},
		{
			id: 'tt0109830',
			title: 'Forrest Gump',
			year: 1994,
			director: 'Robert Zemeckis',
			genres: ['Drama', 'Romance'],
			explanation:
				'Συγκινητική ιστορία ζωής που καλύπτει δεκαετίες αμερικανικής ιστορίας με χιούμορ και καρδιά.',
			type: 'movie'
		},
		{
			id: 'tt0133093',
			title: 'The Matrix',
			year: 1999,
			director: 'Lana Wachowski, Lilly Wachowski',
			genres: ['Action', 'Sci-Fi'],
			explanation:
				'Επαναστατικό sci-fi που άλλαξε τον κινηματογράφο δράσης. Φιλοσοφικές ερωτήσεις σε cyberpunk setting.',
			type: 'movie'
		}
	];

	const result: SearchResult = {
		id: `search_${Date.now()}`,
		timestamp: Date.now(),
		title: 'Κινηματογραφικές Προτάσεις AI',
		summary: prefs.freeText
			? prefs.freeText.slice(0, 60) + (prefs.freeText.length > 60 ? '...' : '')
			: `${prefs.genres.slice(0, 2).join(', ') || 'Γενικές'} προτάσεις`,
		preferences: prefs,
		recommendations: mockRecommendations,
		userRatings: {}
	};

	// Simulate streaming delay
	if (browser) {
		setTimeout(() => {
			currentResult.set(result);
			isStreaming.set(false);
			saveSearchResult(result);
			refreshHistory();
		}, 2000);
	}
}

export function loadHistory(result: SearchResult) {
	currentResult.set(result);
	isStreaming.set(false);
}

export function deleteHistory(id: string) {
	deleteSearchResult(id);
	refreshHistory();
}

export function removeFromWatchlist(movieId: string) {
	removeWatchlistItem(movieId);
	refreshWatchlist();
}

export function markAsNotInterested(item: Omit<NotInterestedItem, 'timestamp'>) {
	addToNotInterestedStorage(item);
	refreshNotInterested();
}

export function removeFromNotInterested(id: string) {
	removeFromNotInterestedStorage(id);
	refreshNotInterested();
}

export const resetSignal = writable(0);

export function reset() {
	currentResult.set(null);
	isStreaming.set(false);
	resetSignal.update((n) => n + 1);
}
