/**
 * Type definitions for video metadata from db.haroldpoi.click API
 * Based on usage in src/lib/queries/video-queries.ts and src/routes/w/[id]/+page.svelte
 */

/**
 * Video metadata from db.haroldpoi.click API
 * Endpoint: https://db.haroldpoi.click/api/collections/tns/records/{imdbId}
 */
export interface VideoMetadata {
	/**
	 * IMDb ID (e.g., 'tt0944947')
	 * This is typically the record ID in the API
	 */
	id?: string;

	/**
	 * Whether this video has a playlist structure (for TV series)
	 */
	has_playlist?: boolean;

	/**
	 * Video URL or playlist URL
	 * If has_playlist is true and url ends with .txt, it's a playlist URL
	 * Otherwise, it's a direct video URL
	 */
	url?: string;

	/**
	 * TMDB ID for Player 3 integration
	 * Used for: https://pstream.mov/media/tmdb-tv-[tmdb_id] or movie-tv-[tmdb_id]
	 */
	tmdb_id?: string | number;

	/**
	 * Additional fields that might exist in the API response
	 */
	[key: string]: unknown;
}
