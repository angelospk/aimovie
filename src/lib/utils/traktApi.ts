import type { TraktUser } from '$lib/types/discover';
import { browser } from '$app/environment';

const CLIENT_ID = 'f1a30cc4a3ea2e8e2f585e572f897351d1f567ad1a888968c44ed0117a2a824b';

/**
 * IMPORTANT: Trakt OAuth Configuration
 * 
 * The redirect URI used here MUST exactly match the URI registered in your Trakt app settings.
 * Go to https://trakt.tv/oauth/applications and ensure the Redirect URI matches:
 * - Development: http://localhost:5173
 * - Production: https://openpopcorn.vercel.app (or your deployment URL)
 */
export function initiateTraktAuth(): void {
	if (!browser) return;
	const REDIRECT_URI = window.location.origin;
	console.log('[Trakt OAuth] Initiating auth with redirect URI:', REDIRECT_URI);
	const authUrl = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
	window.location.href = authUrl;
}


export async function exchangeTraktCode(code: string): Promise<TraktUser | null> {
	try {
		if (!browser) return null;

		const redirect_uri = window.location.origin;

		// Call our server-side endpoint to exchange the code
		// This keeps the client_secret secure on the server
		const response = await fetch('/api/trakt/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ code, redirect_uri })
		});

		if (!response.ok) {
			const error = await response.json();
			console.error('Trakt token exchange failed:', error);
			return null;
		}

		const user: TraktUser = await response.json();
		return user;
	} catch (error) {
		console.error('Error exchanging Trakt code:', error);
		return null;
	}
}

export async function fetchTraktWatchedMovies(accessToken: string): Promise<string[]> {
	try {
		// Mock data - in production, call actual Trakt API
		// GET https://api.trakt.tv/sync/watched/movies
		const mockWatched = ['tt0111161', 'tt0068646', 'tt0071562', 'tt0468569', 'tt0050083'];
		return mockWatched;
	} catch (error) {
		console.error('Error fetching Trakt watched movies:', error);
		return [];
	}
}

export async function fetchTraktWatchedShows(accessToken: string): Promise<string[]> {
	try {
		// Mock data - in production, call actual Trakt API
		// GET https://api.trakt.tv/sync/watched/shows
		const mockWatched = ['tt0903747', 'tt0944947', 'tt2861424'];
		return mockWatched;
	} catch (error) {
		console.error('Error fetching Trakt watched shows:', error);
		return [];
	}
}

export async function addToTraktWatchlist(
	accessToken: string,
	imdbId: string,
	type: 'movie' | 'series'
): Promise<boolean> {
	try {
		// Mock implementation
		// POST https://api.trakt.tv/sync/watchlist
		console.log(`Adding to Trakt watchlist: ${imdbId} (${type})`);

		// In production:
		// const response = await fetch('https://api.trakt.tv/sync/watchlist', {
		//   method: 'POST',
		//   headers: {
		//     'Content-Type': 'application/json',
		//     'Authorization': `Bearer ${accessToken}`,
		//     'trakt-api-version': '2',
		//     'trakt-api-key': CLIENT_ID
		//   },
		//   body: JSON.stringify({
		//     movies: type === 'movie' ? [{ ids: { imdb: imdbId } }] : [],
		//     shows: type === 'series' ? [{ ids: { imdb: imdbId } }] : []
		//   })
		// });

		return true;
	} catch (error) {
		console.error('Error adding to Trakt watchlist:', error);
		return false;
	}
}

export async function markAsWatchedOnTrakt(
	accessToken: string,
	imdbId: string,
	type: 'movie' | 'series'
): Promise<boolean> {
	try {
		// Mock implementation
		// POST https://api.trakt.tv/sync/history
		console.log(`Marking as watched on Trakt: ${imdbId} (${type})`);

		return true;
	} catch (error) {
		console.error('Error marking as watched on Trakt:', error);
		return false;
	}
}

export async function removeFromTraktWatchlist(
	accessToken: string,
	imdbId: string,
	type: 'movie' | 'series'
): Promise<boolean> {
	try {
		// Mock implementation
		// POST https://api.trakt.tv/sync/watchlist/remove
		console.log(`Removing from Trakt watchlist: ${imdbId} (${type})`);

		return true;
	} catch (error) {
		console.error('Error removing from Trakt watchlist:', error);
		return false;
	}
}
