/**
 * Type definitions for TanStack Query
 */

import type { QueryOptions } from '@tanstack/svelte-query';
import type { VideoMetadata } from './video';
import type { PlaylistData } from './playlist';
import type { ImdbSuggestionResponse } from './imdb';

/**
 * Query options for video metadata
 */
export type VideoDataQueryOptions = QueryOptions<
	VideoMetadata | null,
	Error,
	VideoMetadata | null,
	readonly ['video', 'data', string]
>;

/**
 * Query options for playlist data
 */
export type PlaylistQueryOptions = QueryOptions<
	PlaylistData,
	Error,
	PlaylistData,
	readonly ['proxy', 'playlist', string, string]
>;

/**
 * Query options for IMDb search
 */
export type ImdbSearchQueryOptions = QueryOptions<
	ImdbSuggestionResponse,
	Error,
	ImdbSuggestionResponse,
	readonly ['proxy', 'imdb-search', string]
>;
