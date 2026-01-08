/**
 * Centralized type exports
 * Import types from this file for convenience
 */

// IMDb types
export type {
	ImdbImage,
	ImdbSuggestionItem,
	ImdbSuggestionResponse,
	ImdbContentDetails
} from './imdb';

// Video metadata types
export type { VideoMetadata } from './video';

// Playlist types
export type { PlaylistItem, PlaylistSeason, PlaylistData } from './playlist';
export { hasNestedSeasons } from './playlist';

// Application types
export type {
	Theme,
	Language,
	AppSettings,
	FAQItem,
	FAQTranslations,
	AboutTranslations,
	LayoutTranslations,
	SearchTranslations,
	WatchTranslations
} from './app';

// Query types
export type {
	VideoDataQueryOptions,
	PlaylistQueryOptions,
	ImdbSearchQueryOptions
} from './queries';
