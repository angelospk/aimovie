/**
 * Type definitions for IMDb API responses
 * Based on IMDb suggestion API: https://v3.sg.media-imdb.com/suggestion/x/{query}.json
 */

/**
 * IMDb image object from API response
 */
export interface ImdbImage {
	imageUrl?: string;
	width?: number;
	height?: number;
}

/**
 * Raw IMDb suggestion item from API response
 */
export interface ImdbSuggestionItem {
	id: string; // IMDb ID (e.g., 'tt0944947')
	l?: string; // Title (label)
	yr?: string; // Year (release year)
	y?: string; // Alternative year field
	qid?: string; // Content type/quality ID ('tvSeries', 'tvMiniSeries', 'movie', 'musicVideo', 'podcastSeries', 'video', etc.)
	s?: string; // Stars (cast/director information)
	i?: ImdbImage; // Image object
	[key: string]: unknown; // Allow additional fields we might not know about
}

/**
 * IMDb suggestion API response
 */
export interface ImdbSuggestionResponse {
	d?: ImdbSuggestionItem[]; // Array of suggestion items
	v?: number; // Version
	q?: string; // Query
	[key: string]: unknown; // Allow additional root-level fields
}

/**
 * Processed IMDb content details (after filtering and transformation)
 */
export interface ImdbContentDetails {
	id: string;
	title: string;
	year: string | null;
	type: string;
	stars: string;
	imageUrl: string | null;
}
