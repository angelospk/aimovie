/**
 * Application state and configuration types
 */

/**
 * Supported theme options
 */
export type Theme = 'dark' | 'light';

/**
 * Supported language codes
 */
export type Language = 'el' | 'en';

/**
 * Application settings
 */
export interface AppSettings {
	theme: Theme;
	lang: Language;
}

/**
 * FAQ item structure
 */
export interface FAQItem {
	q: string; // Question
	a: string; // Answer
}

/**
 * Translation object structure for FAQ component
 */
export interface FAQTranslations {
	title: string;
	faqs: FAQItem[];
}

/**
 * Translation object structure for about page
 */
export interface AboutTranslations {
	title: string;
	intro: string;
	player1Title: string;
	player1Desc: string;
	player2Title: string;
	player2Desc: string;
	disclaimer: string;
}

/**
 * Translation object structure for layout/navigation
 */
export interface LayoutTranslations {
	home: string;
	discover: string;
	faq: string;
	support: string;
	github: string;
	builtWith: string;
}

/**
 * Translation object structure for search page
 */
export interface SearchTranslations {
	title: string;
	placeholder: string;
	loading: string;
	noResults: string;
	error: string;
	movie: string;
	series: string;
	searchHistory: string;
	viewingHistory: string;
	watchlist: string;
	deleted: string;
	undo: string;
}

/**
 * Translation object structure for watch page
 */
export interface WatchTranslations {
	player1: string;
	player2: string;
	loading: string;
	error: string;
	notAvailable: string;
	copyUrl: string;
	copyUrlForManager: string;
	copied: string;
	download: string;
	viewOnImdb: string;
	viewOnTmdb: string;
	back: string;
	play: string;
	season: string;
	episode: string;
	selectEpisode: string;
	bulkCopy: string;
	selectAll: string;
	deselectAll: string;
	copySelected: string;
	cancel: string;
	selectedCount: string;
	selectSeason: string;
	streamingGuide: string;
	downloadGuide: string;
	dismissGuide: string;
	closeModal: string;
	nextEpisode: string;
	externalPlayers: string;
	morePlayers: string;
	braveRecommendation: string;
	autoplay: string;
	previousEpisode: string;
}
