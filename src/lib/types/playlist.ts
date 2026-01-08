/**
 * Type definitions for playlist data structures
 * Playlists can be flat (simple array of episodes) or nested (seasons with episodes)
 */

/**
 * Individual playlist item (episode/file)
 * Based on usage in src/routes/w/[id]/+page.svelte
 */
export interface PlaylistItem {
	file: string; // Video file URL
	comment: string; // Episode/File title/description
	[key: string]: unknown; // Allow additional fields that might exist
}

/**
 * Season object for nested playlist structures
 * Used when playlist has seasons with nested episodes
 */
export interface PlaylistSeason {
	comment: string; // Season name/title
	playlist: PlaylistItem[]; // Episodes in this season
	[key: string]: unknown; // Allow additional season fields
}

/**
 * Root playlist data structure
 * Can contain either flat episodes or nested seasons
 */
export interface PlaylistData {
	playlist: PlaylistItem[] | PlaylistSeason[];
	[key: string]: unknown; // Allow additional root-level fields
}

/**
 * Type guard to check if playlist has nested seasons
 */
export function hasNestedSeasons(data: PlaylistData): data is { playlist: PlaylistSeason[] } {
	return data.playlist && data.playlist.length > 0 && 'playlist' in data.playlist[0];
}
