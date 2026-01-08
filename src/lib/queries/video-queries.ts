/**
 * Video data query functions for TanStack Query
 * Handles fetching video metadata from database API with health-check-based database selection
 */

import { videoKeys } from './query-keys';
import type { VideoMetadata } from '$lib/types';
import { getVideoDataUrlFromIndex, getTmdbFindUrl } from '$lib/config/system-config';
import { settings } from '$lib/store.svelte';
import type { SystemConfig } from '$lib/config/system-config';

/**
 * Fetch video data from database API using system configuration
 * Automatically uses the healthy database (primary or backup) based on health checks
 * @param imdbId The IMDb ID (e.g., 'tt0096895')
 * @returns Video data object or null if not found (404) or all databases failed
 */
export async function fetchVideoData(imdbId: string): Promise<VideoMetadata | null> {
	if (!imdbId) {
		throw new Error('IMDb ID is required');
	}

	// Get config and active database from settings
	const config: SystemConfig | null = settings.systemConfig;
	const activeDatabaseIndex: number | null = settings.activeDatabaseIndex;

	// If config not loaded yet, fallback to default URL (shouldn't happen in practice)
	if (!config) {
		console.warn('[fetchVideoData] System config not loaded, using fallback URL');
		const fallbackUrl = `https://db.haroldpoi.click/api/collections/tns/records/${imdbId}`;
		return fetchVideoDataFromUrl(fallbackUrl, imdbId);
	}

	// If all databases failed, return null (no point in trying)
	if (activeDatabaseIndex === null || activeDatabaseIndex === -999) {
		console.error('[fetchVideoData] All databases failed health check, cannot fetch video data');
		return null;
	}

	// Build URL from config and active database index
	const videoUrl = getVideoDataUrlFromIndex(config, activeDatabaseIndex, imdbId);

	if (!videoUrl) {
		console.error('[fetchVideoData] Failed to build video data URL');
		return null;
	}

	console.log(
		`[fetchVideoData] Fetching from ${activeDatabaseIndex === -1 ? 'primary' : `backup ${activeDatabaseIndex + 1}`} database: ${videoUrl}`
	);
	return fetchVideoDataFromUrl(videoUrl, imdbId);
}

/**
 * Helper function to fetch video data from a specific URL
 * @param url The complete API URL
 * @param imdbId The IMDb ID for logging purposes
 * @returns Video data object or null if not found (404)
 */
async function fetchVideoDataFromUrl(url: string, imdbId: string): Promise<VideoMetadata | null> {
	try {
		const response = await fetch(url);

		// Handle 404 as a valid "not found" state, not an error
		if (response.status === 404) {
			console.log(`Video record not found for ${imdbId}, will attempt TMDB lookup`);
			return null;
		}

		if (!response.ok) {
			// Throw error for other non-200 responses (500s, network issues, etc.)
			throw new Error(`Video data API returned ${response.status}: ${response.statusText}`);
		}

		return (await response.json()) as VideoMetadata;
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		console.error(`[fetchVideoData] Error fetching from ${url}:`, errorMsg);
		throw error;
	}
}

/**
 * TMDB API response interface for find endpoint
 */
interface TmdbFindResponse {
	movie_results: Array<{ id: number }>;
	tv_results: Array<{ id: number }>;
	tv_episode_results: Array<{ id: number }>;
	tv_season_results: Array<{ id: number }>;
}

/**
 * Fetch TMDB ID using IMDb ID via TMDB API
 * Uses system configuration for API key and URL
 * @param imdbId The IMDb ID (e.g., 'tt4295140')
 * @returns TMDB ID as number or null if not found
 */
export async function fetchTmdbId(imdbId: string): Promise<number | null> {
	if (!imdbId) {
		console.error('IMDb ID is required for TMDB lookup');
		return null;
	}

	// Get config from settings
	const config: SystemConfig | null = settings.systemConfig;

	// If config not loaded, fallback to default values (shouldn't happen in practice)
	if (!config) {
		console.warn('[fetchTmdbId] System config not loaded, using fallback TMDB config');
		const fallbackApiKey =
			'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkZDM5MTJmMWJjMWM0OGRiNWYzYzBjYzljZjNhNTdiMSIsIm5iZiI6MTY2NzIyNjk3Mi40NzQsInN1YiI6IjYzNWZkZDVjZmQ2MzAwMDA3OWE5YTFhNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.GVDxwDra0PJZ8WqaEw80X3XSyRlk_EzVGdXVc-ssoIc';
		const fallbackUrl = `https://api.themoviedb.org/3/find/${imdbId}?external_source=imdb_id`;
		return fetchTmdbIdFromUrl(fallbackUrl, fallbackApiKey, imdbId);
	}

	// Build TMDB URL from config
	const tmdbUrl = getTmdbFindUrl(config, imdbId);
	const tmdbApiKey = config.tmdb.apiKey;

	return fetchTmdbIdFromUrl(tmdbUrl, tmdbApiKey, imdbId);
}

/**
 * Helper function to fetch TMDB ID from a specific URL
 * @param tmdbUrl The complete TMDB API URL
 * @param apiKey The TMDB API key
 * @param imdbId The IMDb ID for logging purposes
 * @returns TMDB ID as number or null if not found
 */
async function fetchTmdbIdFromUrl(
	tmdbUrl: string,
	apiKey: string,
	imdbId: string
): Promise<number | null> {
	try {
		const response = await fetch(tmdbUrl, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				accept: 'application/json'
			}
		});

		if (!response.ok) {
			console.error(`TMDB API returned ${response.status}`);
			return null;
		}

		const data = (await response.json()) as TmdbFindResponse;

		// Check movie results first
		if (data.movie_results && data.movie_results.length > 0) {
			console.log(`Found TMDB movie ID: ${data.movie_results[0].id}`);
			return data.movie_results[0].id;
		}

		// Check TV results
		if (data.tv_results && data.tv_results.length > 0) {
			console.log(`Found TMDB TV ID: ${data.tv_results[0].id}`);
			return data.tv_results[0].id;
		}

		console.log('No TMDB ID found for IMDb ID:', imdbId);
		return null;
	} catch (error) {
		console.error('Error fetching TMDB ID:', error);
		return null;
	}
}

/**
 * Helper function to check if TMDB lookup is needed
 * @param metadata Video metadata or null (404 case)
 * @returns true if TMDB lookup should be attempted
 */
export function needsTmdbLookup(metadata: VideoMetadata | null): boolean {
	// If no metadata at all (404 case), we need lookup
	if (!metadata) {
		return true;
	}

	// If metadata exists, check if tmdb_id is missing or invalid
	return (
		metadata.tmdb_id === undefined ||
		metadata.tmdb_id === null ||
		metadata.tmdb_id === '' ||
		metadata.tmdb_id === 0
	);
}

/**
 * Query options for video data fetching
 * Includes caching to avoid redundant API calls
 */
export const videoDataQueryOptions = (imdbId: string) => ({
	queryKey: videoKeys.data(imdbId),
	queryFn: () => fetchVideoData(imdbId),
	staleTime: 2 * 60 * 60 * 1000, // 2 hours - video data doesn't change frequently
	gcTime: 12 * 60 * 60 * 1000, // 12 hours - keep cached data for half a day
	retry: (failureCount: number, error: unknown) => {
		// fetchVideoData now returns null for 404s, so no need to check for them here
		// Only retry actual errors (network issues, 500s, etc.)
		return failureCount < 2;
	},
	retryDelay: 1000 // 1 second between retries
});
