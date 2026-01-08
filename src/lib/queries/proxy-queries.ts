/**
* Proxy query functions for TanStack Query
* Handles playlist fetching with fallback proxy logic and extended caching
*/

import { proxyKeys } from './query-keys';
import type { PlaylistData, ImdbSuggestionResponse } from '$lib/types';

/**
 * Parse JSON response from proxy, handling both JSON and text content types
 */
async function parseProxyResponse<T = unknown>(response: Response): Promise<T> {
	const contentType = response.headers.get('content-type') || '';

	if (contentType.includes('application/json')) {
		return (await response.json()) as T;
	} else {
		// Try parsing as JSON even if content-type is text/plain
		const text = await response.text();
		try {
			return JSON.parse(text) as T;
		} catch (parseError) {
			console.error('Failed to parse proxy response as JSON:', parseError);
			throw new Error(
				`Failed to parse JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`
			);
		}
	}
}

/**
 * Try fetching via a public proxy URL
 * Returns parsed data if successful, throws error if failed
 * @param timeoutMs - Timeout in milliseconds (default 1000 for corsproxy.io)
 */
async function tryPublicProxy(
	targetUrl: string,
	proxyName: string,
	proxyUrl: string,
	timeoutMs: number = 1000
): Promise<PlaylistData> {
	console.log(`Trying public proxy: ${proxyName}...`);

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(proxyUrl, {
			signal: controller.signal
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			throw new Error(`${proxyName} returned ${response.status}`);
		}

		const parsedData = await parseProxyResponse<PlaylistData>(response);

		if (!parsedData || !parsedData.playlist) {
			throw new Error(`${proxyName} returned data but no playlist found`);
		}

		console.log(`Successfully loaded via ${proxyName}`);
		return parsedData;
	} catch (error) {
		clearTimeout(timeoutId);
		const errorMsg = error instanceof Error ? error.message : String(error);
		console.error(`${proxyName} failed:`, errorMsg);
		throw error;
	}
}

/**
 * Fetch playlist data via proxy with fallback logic
 * Tries: public proxies → edge proxy → node proxy
 *
 * Cache duration: 4 hours staleTime, 24 hours gcTime
 * These extended durations are appropriate for proxy requests which are slow and expensive
 */
export async function fetchPlaylistViaProxy(
	imdbId: string,
	playlistUrl: string
): Promise<PlaylistData> {
	// Validate playlistUrl first
	if (!playlistUrl || playlistUrl.trim() === '') {
		throw new Error('Playlist URL is empty or invalid');
	}

	// Validate URL format
	try {
		new URL(playlistUrl);
	} catch (urlError) {
		throw new Error(`Invalid playlist URL format: ${playlistUrl}`);
	}

	console.log(`Fetching playlist via proxy for ${imdbId}: ${playlistUrl}`);

	// Try public CORS proxies first (corsproxy.io with 1000ms timeout)
	console.log('Trying corsproxy.io first...');
	try {
		return await tryPublicProxy(
			playlistUrl,
			'corsproxy.io',
			`https://corsproxy.io/?${encodeURIComponent(playlistUrl)}`,
			1000
		);
	} catch (proxyError) {
		console.log('corsproxy.io failed, trying custom endpoints...');
	}

	// If corsproxy.io fails, try Vercel endpoint as fallback
	console.log('Trying Vercel proxy endpoint...');
	try {
		const vercelProxyUrl = `https://openpopcorn.vercel.app/api/proxy?url=${encodeURIComponent(playlistUrl)}`;
		const response = await fetch(vercelProxyUrl);

		if (response.ok) {
			const data = await parseProxyResponse<PlaylistData>(response);
			console.log('Successfully loaded via Vercel proxy');
			return data;
		}

		throw new Error(`Vercel proxy returned ${response.status}`);
	} catch (vercelError) {
		console.log('Vercel proxy failed, trying direct URL...');
		// Final fallback: try direct URL fetch (may work if CORS is allowed)
		try {
			const response = await fetch(playlistUrl);

			if (!response.ok) {
				throw new Error(`Direct URL fetch returned ${response.status}`);
			}

			const data = await parseProxyResponse<PlaylistData>(response);
			console.log('Successfully loaded via direct URL');
			return data;
		} catch (directError) {
			const errorMsg = directError instanceof Error ? directError.message : String(directError);
			console.error('All proxy attempts failed:', errorMsg);
			throw new Error(`All proxy attempts failed. Last error: ${errorMsg}`);
		}
	}
}

/**
 * Fetch IMDb search results via proxy
 * Tries corsproxy.io first with 1000ms timeout, then custom proxy
 *
 * Cache duration: 10 minutes staleTime, 1 hour gcTime
 * Extended from default 5 minutes to reduce redundant proxy calls
 */
export async function fetchImdbSearchViaProxy(query: string): Promise<ImdbSuggestionResponse> {
	const imdbUrl = `https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(query)}.json?includeVideos=0`;

	// Try corsproxy.io first with 1000ms timeout
	console.log('Trying corsproxy.io for IMDb search...');
	try {
		const corsUrl = `https://corsproxy.io/?${encodeURIComponent(imdbUrl)}`;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 1000);

		try {
			const response = await fetch(corsUrl, {
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (response.ok) {
				console.log('Successfully loaded via corsproxy.io');
				return (await response.json()) as ImdbSuggestionResponse;
			}

			throw new Error(`corsproxy.io returned ${response.status}`);
		} catch (error) {
			clearTimeout(timeoutId);
			if (error instanceof Error && error.name === 'AbortError') {
				console.log('corsproxy.io timeout, trying custom proxy...');
			} else {
				console.log('corsproxy.io failed, trying custom proxy...');
			}
		}
	} catch (error) {
		console.log('corsproxy.io failed, trying custom proxy...');
	}

	// Fallback to Vercel proxy
	try {
		const vercelProxyUrl = `https://openpopcorn.vercel.app/api/proxy?url=${encodeURIComponent(imdbUrl)}`;
		const response = await fetch(vercelProxyUrl);

		if (response.ok) {
			console.log('Successfully loaded via Vercel proxy');
			return (await response.json()) as ImdbSuggestionResponse;
		}

		throw new Error(`Vercel proxy returned ${response.status}`);
	} catch (vercelError) {
		console.log('Vercel proxy failed, trying direct URL...');
		// Final fallback: try direct URL fetch (may work if CORS is allowed)
		try {
			const response = await fetch(imdbUrl);

			if (!response.ok) {
				throw new Error(`Direct URL fetch returned ${response.status}`);
			}

			console.log('Successfully loaded via direct URL');
			return (await response.json()) as ImdbSuggestionResponse;
		} catch (directError) {
			const errorMsg = directError instanceof Error ? directError.message : String(directError);
			throw new Error(`All proxy attempts failed. Last error: ${errorMsg}`);
		}
	}
}

/**
 * Query options for playlist fetching
 * Includes extended cache durations for proxy requests
 */
export const playlistQueryOptions = (imdbId: string, playlistUrl: string) => ({
	queryKey: proxyKeys.playlist(imdbId, playlistUrl),
	queryFn: () => fetchPlaylistViaProxy(imdbId, playlistUrl),
	staleTime: 4 * 60 * 60 * 1000, // 4 hours - extended duration for slow proxy operations
	gcTime: 24 * 60 * 60 * 1000, // 24 hours - keep cached data for a full day
	retry: 2, // Retry failed requests twice
	retryDelay: 1000 // 1 second between retries
});

/**
 * Query options for IMDb search via proxy
 * Includes extended cache duration from default 5 minutes
 */
export const imdbSearchQueryOptions = (query: string) => ({
	queryKey: proxyKeys.imdbSearch(query) as readonly string[],
	queryFn: () => fetchImdbSearchViaProxy(query),
	staleTime: 10 * 60 * 1000, // 10 minutes - extended from default 5 minutes
	gcTime: 60 * 60 * 1000, // 1 hour - keep cached search results for an hour
	retry: 1, // Retry once for search queries
	retryDelay: 500 // 500ms between retries
});
