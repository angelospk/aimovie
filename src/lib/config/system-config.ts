/**
 * System configuration management module
 * Handles loading and caching of runtime configuration from external JSON
 */

import type { VideoMetadata } from '$lib/types';

/**
 * Database configuration structure
 */
export interface DatabaseConfig {
	baseUrl: string;
	healthEndpoint: string;
	apiEndpoint: string;
}

/**
 * Player configuration structure
 */
export interface PlayerConfig {
	embedUrl?: string; // Legacy single URL (deprecated, use embedUrls)
	embedUrls?: string[]; // Array of fallback URLs
	autoplay: boolean;
	defaultLanguage: string;
}

/**
 * External player configuration structure
 */
export interface ExternalPlayerConfig {
	id: string;
	name: {
		el: string;
		en: string;
	};
	urls: {
		movie: string;
		tv: string;
	};
}

/**
 * Proxy configuration structure
 */
export interface ProxyConfig {
	primary: string;
	fallback: string;
}

/**
 * TMDB configuration structure
 */
export interface TmdbConfig {
	apiKey: string;
	findUrl: string;
}

/**
 * Complete system configuration structure
 */
export interface SystemConfig {
	version: string;
	databases: {
		primary: DatabaseConfig;
		backup?: DatabaseConfig; // Legacy single backup
		backups?: DatabaseConfig[]; // Array of multiple backups
	};
	players: {
		player2: PlayerConfig;
		external: ExternalPlayerConfig[];
	};
	proxies: ProxyConfig;
	tmdb: TmdbConfig;
}

/**
 * Default configuration fallback
 * Used when external config fails to load
 */
export const DEFAULT_CONFIG: SystemConfig = {
	version: '0.0.2',
	databases: {
		primary: {
			baseUrl: 'https://db.haroldpoi.click',
			healthEndpoint: '/api/health',
			apiEndpoint: '/api/collections/tns/records'
		},
		backups: []
	},
	players: {
		player2: {
			embedUrls: [],
			autoplay: true,
			defaultLanguage: 'el'
		},
		external: []
	},
	proxies: {
		primary: 'https://corsproxy.io/?',
		fallback: 'https://openpopcorn.vercel.app/api/proxy'
	},
	tmdb: {
		apiKey:
			'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkZDM5MTJmMWJjMWM0OGRiNWYzYzBjYzljZjNhNTdiMSIsIm5iZiI6MTY2NzIyNjk3Mi40NzQsInN1YiI6IjYzNWZkZDVjZmQ2MzAwMDA3OWE5YTFhNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.GVDxwDra0PJZ8WqaEw80X3XSyRlk_EzVGdXVc-ssoIc',
		findUrl: 'https://api.themoviedb.org/3/find'
	}
};

/**
 * Configuration URLs - multiple endpoints for redundancy
 * Each will be tried in parallel race condition fashion
 */
const CONFIG_URLS = [
	'https://corsproxy.io/?url=http://api.jsonsilo.com/public/ba90ef40-53b7-4996-b381-f6e4edba263e',
	'https://corsproxy.io/?url=https://pastebin.com/raw/EAjeQzyn'
	// 'https://raw.githubusercontent.com/user/openpopcorn-config/main/config.json',
] as const;

/**
 * Validates configuration structure
 * Ensures all required fields are present and valid
 */
function validateConfig(data: unknown): data is SystemConfig {
	if (!data || typeof data !== 'object') {
		return false;
	}

	const config = data as Partial<SystemConfig>;

	// Check required top-level fields
	if (typeof config.version !== 'string') return false;
	if (!config.databases || typeof config.databases !== 'object') return false;
	if (!config.players || typeof config.players !== 'object') return false;
	if (!config.proxies || typeof config.proxies !== 'object') return false;
	if (!config.tmdb || typeof config.tmdb !== 'object') return false;

	// Validate databases
	const { primary, backup, backups } = config.databases;
	if (!primary || typeof primary.baseUrl !== 'string') return false;

	// Validate backup(s) - support both legacy single backup and new array
	if (backup && typeof backup.baseUrl === 'string') {
		// Legacy single backup format OK
	} else if (backups && Array.isArray(backups)) {
		// New multiple backups format - validate all
		for (const b of backups) {
			if (
				typeof b.baseUrl !== 'string' ||
				typeof b.healthEndpoint !== 'string' ||
				typeof b.apiEndpoint !== 'string'
			) {
				return false;
			}
		}
	} else {
		// Must have either backup or backups
		return false;
	}

	// Validate players
	const { player2, external } = config.players;
	if (!player2) return false;
	// Support both legacy embedUrl and new embedUrls array
	const player2Any = player2 as any; // Type assertion for validation
	if (!player2Any.embedUrl && !player2Any.embedUrls) return false;
	if (player2Any.embedUrl && typeof player2Any.embedUrl !== 'string') return false;
	if (player2Any.embedUrls && !Array.isArray(player2Any.embedUrls)) return false;

	// Validate external players array
	if (!Array.isArray(external)) return false;
	for (const player of external) {
		if (!player.id || typeof player.id !== 'string') return false;
		if (!player.name || typeof player.name.el !== 'string' || typeof player.name.en !== 'string')
			return false;
		if (!player.urls || typeof player.urls.movie !== 'string' || typeof player.urls.tv !== 'string')
			return false;
	}

	// Validate proxies
	if (typeof config.proxies.primary !== 'string') return false;
	if (typeof config.proxies.fallback !== 'string') return false;

	// Validate TMDB
	if (typeof config.tmdb.apiKey !== 'string') return false;
	if (typeof config.tmdb.findUrl !== 'string') return false;

	return true;
}

/**
 * Attempts to load configuration from a single URL
 * Returns validated config or null if failed
 */
async function tryLoadConfigFromUrl(url: string): Promise<SystemConfig | null> {
	try {
		console.log(`[SystemConfig] Attempting to load from: ${url}`);

		// Remove Content-Type header to avoid preflight request
		// For GET requests, we don't need to send Content-Type
		// This might help with CORS for some servers
		const response = await fetch(url, {
			method: 'GET',
			headers: {
				Accept: 'application/json'
			},
			cache: 'no-store' // Always fetch fresh config
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();

		// Validate configuration structure
		if (!validateConfig(data)) {
			console.warn(`[SystemConfig] Invalid config structure from ${url}`);
			return null;
		}

		console.log(`[SystemConfig] Successfully loaded from ${url}`);
		return data as SystemConfig;
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		console.warn(`[SystemConfig] Failed from ${url}: ${errorMsg}`);
		return null;
	}
}

/**
 * Loads system configuration from external URLs using race condition
 * Tries all endpoints in parallel, returns first successful, falls back to defaults if all fail
 */
export async function loadSystemConfig(): Promise<SystemConfig> {
	console.log(
		`[SystemConfig] Starting race condition load from ${CONFIG_URLS.length} endpoints...`
	);

	// Create promises for all URLs
	const loadPromises = CONFIG_URLS.map((url) => tryLoadConfigFromUrl(url));

	// Race condition: wait for the first successful result
	// Use Promise.allSettled to wait for all without failing on individual errors
	const results = await Promise.allSettled(loadPromises);

	// Find first successful result
	for (let i = 0; i < results.length; i++) {
		const result = results[i];
		if (result.status === 'fulfilled' && result.value !== null) {
			console.log(
				`[SystemConfig] Configuration loaded from endpoint ${i + 1}/${CONFIG_URLS.length}`
			);
			return result.value;
		}
	}

	// All endpoints failed
	console.error('[SystemConfig] All configuration endpoints failed');
	console.log('[SystemConfig] Falling back to default configuration');
	return DEFAULT_CONFIG;
}

/**
 * Performs health check on a database
 * @param databaseConfig Database configuration to check
 * @returns true if healthy, false otherwise
 */
export async function checkDatabaseHealth(databaseConfig: DatabaseConfig): Promise<boolean> {
	try {
		const healthUrl = `${databaseConfig.baseUrl}${databaseConfig.healthEndpoint}`;
		console.log('[SystemConfig] Checking database health:', healthUrl);

		const response = await fetch(healthUrl, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		if (!response.ok) {
			console.warn(`[SystemConfig] Database health check failed: ${response.status}`);
			return false;
		}

		const data = await response.json();

		// Expected response: {"message":"API is healthy.","code":200,"data":{}}
		if (data && typeof data === 'object' && data.code === 200) {
			console.log('[SystemConfig] Database is healthy');
			return true;
		}

		console.warn('[SystemConfig] Database health check returned unexpected response');
		return false;
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		console.error('[SystemConfig] Database health check error:', errorMsg);
		return false;
	}
}

/**
 * Get all available backups (legacy single backup or new array)
 * @param config System configuration
 * @returns Array of backup database configurations
 */
export function getAllBackups(config: SystemConfig): DatabaseConfig[] {
	if (config.databases.backups && Array.isArray(config.databases.backups)) {
		return config.databases.backups;
	}
	if (config.databases.backup) {
		return [config.databases.backup];
	}
	return [];
}

/**
 * Get the appropriate database URL based on health check result
 * @param config System configuration
 * @param useBackup Whether to use backup database
 * @param backupIndex Index of backup to use (if multiple)
 * @returns Database configuration to use
 */
export function getActiveDatabase(
	config: SystemConfig,
	useBackup: boolean,
	backupIndex: number = 0
): DatabaseConfig {
	if (useBackup) {
		const backups = getAllBackups(config);
		if (backupIndex >= 0 && backupIndex < backups.length) {
			return backups[backupIndex];
		}
		// Fallback to first backup if index invalid
		if (backups.length > 0) {
			return backups[0];
		}
		// Last resort: return primary if no backups available
		console.warn('[SystemConfig] No backups available, using primary database');
		return config.databases.primary;
	}
	return config.databases.primary;
}

/**
 * Build video data API URL
 * @param config System configuration
 * @param useBackup Whether to use backup database
 * @param imdbId IMDb ID
 * @param backupIndex Index of backup to use (if multiple, default: 0)
 * @returns Complete API URL
 */
export function getVideoDataUrl(
	config: SystemConfig,
	useBackup: boolean,
	imdbId: string,
	backupIndex: number = 0
): string {
	const database = getActiveDatabase(config, useBackup, backupIndex);
	return `${database.baseUrl}${database.apiEndpoint}/${imdbId}`;
}

/**
 * Build video data API URL using active database index
 * @param config System configuration
 * @param activeDatabaseIndex Database index (-1 for primary, 0+ for backups, null uses primary as fallback)
 * @param imdbId IMDb ID
 * @returns Complete API URL or null if all databases failed
 */
export function getVideoDataUrlFromIndex(
	config: SystemConfig,
	activeDatabaseIndex: number | null,
	imdbId: string
): string | null {
	// If all databases failed, return null
	if (activeDatabaseIndex === null || activeDatabaseIndex === -999) {
		return null;
	}

	// -1 means primary database
	if (activeDatabaseIndex === -1) {
		const database = config.databases.primary;
		return `${database.baseUrl}${database.apiEndpoint}/${imdbId}`;
	}

	// 0+ means backup database at that index
	const backups = getAllBackups(config);
	if (activeDatabaseIndex >= 0 && activeDatabaseIndex < backups.length) {
		const database = backups[activeDatabaseIndex];
		return `${database.baseUrl}${database.apiEndpoint}/${imdbId}`;
	}

	// Invalid index, fallback to primary
	console.warn(`[SystemConfig] Invalid database index ${activeDatabaseIndex}, using primary`);
	const database = config.databases.primary;
	return `${database.baseUrl}${database.apiEndpoint}/${imdbId}`;
}

/**
 * Build Player 2 embed URL
 * @param config System configuration
 * @param type Content type (movie/tv)
 * @param imdbId IMDb ID
 * @param userLanguage User's selected language (el/en) - overrides default from config
 * @returns Complete embed URL
 */
export function getPlayer2EmbedUrl(
	config: SystemConfig,
	type: string,
	imdbId: string,
	userLanguage?: string
): string {
	const embedType = type.includes('Series') ? 'tv' : 'movie';
	const { embedUrl, embedUrls, defaultLanguage } = config.players.player2;
	const autoplayParam = config.players.player2.autoplay ? '&autoplay=1' : '';

	// Use first URL from embedUrls array, or fallback to legacy embedUrl
	const baseUrl = embedUrls && embedUrls.length > 0 ? embedUrls[0] : embedUrl || '';

	// Use user's language if provided, otherwise use default from config
	const language = userLanguage || defaultLanguage;

	return `${baseUrl}/${embedType}?imdb=${imdbId}&ds_lang=${language}${autoplayParam}`;
}

/**
 * Build TMDB find URL
 * @param config System configuration
 * @param imdbId IMDb ID
 * @returns Complete TMDB API URL
 */
export function getTmdbFindUrl(config: SystemConfig, imdbId: string): string {
	return `${config.tmdb.findUrl}/${imdbId}?external_source=imdb_id`;
}

/**
 * Build primary proxy URL
 * @param config System configuration
 * @param targetUrl URL to proxy
 * @returns Complete proxy URL
 */
export function getPrimaryProxyUrl(config: SystemConfig, targetUrl: string): string {
	return `${config.proxies.primary}${encodeURIComponent(targetUrl)}`;
}

/**
 * Build fallback proxy URL
 * @param config System configuration
 * @param targetUrl URL to proxy
 * @returns Complete proxy URL
 */
export function getFallbackProxyUrl(config: SystemConfig, targetUrl: string): string {
	return `${config.proxies.fallback}?url=${encodeURIComponent(targetUrl)}`;
}

/**
 * Build external player URL
 * @param config System configuration
 * @param playerId Player identifier
 * @param tmdbId TMDB ID
 * @param type Content type (movie/tv)
 * @returns Complete player URL or null if player not found
 */
export function getExternalPlayerUrl(
	config: SystemConfig,
	playerId: string,
	tmdbId: string | number,
	type: string
): string | null {
	const player = config.players.external.find((p) => p.id === playerId);
	if (!player) {
		console.warn(`[SystemConfig] External player not found: ${playerId}`);
		return null;
	}

	const isMovie = type === 'movie' || type === 'Movie';
	const tmdbIdStr = String(tmdbId);
	const urlTemplate = isMovie ? player.urls.movie : player.urls.tv;

	// Replace {tmdbId} placeholder in URL template
	return urlTemplate.replace('{tmdbId}', tmdbIdStr);
}

/**
 * Get all external player configurations
 * @param config System configuration
 * @returns Array of external player configurations
 */
export function getExternalPlayers(config: SystemConfig): ExternalPlayerConfig[] {
	return config.players.external;
}

/**
 * Find first working database by checking health of primary, then all backups
 * @param config System configuration
 * @returns Promise resolving to first healthy database index (-1 for primary, 0+ for backups) or null if all failed
 */
export async function findWorkingDatabase(config: SystemConfig): Promise<number | null> {
	// Check primary first
	console.log('[SystemConfig] Checking primary database health...');
	const primaryHealthy = await checkDatabaseHealth(config.databases.primary);
	if (primaryHealthy) {
		console.log('[SystemConfig] Primary database is healthy');
		return -1; // -1 indicates primary
	}

	// If primary fails, try all backups
	const backups = getAllBackups(config);
	console.log(`[SystemConfig] Primary failed, checking ${backups.length} backup(s)...`);

	for (let i = 0; i < backups.length; i++) {
		console.log(`[SystemConfig] Checking backup ${i + 1}/${backups.length}...`);
		const healthy = await checkDatabaseHealth(backups[i]);
		if (healthy) {
			console.log(`[SystemConfig] Backup ${i + 1} is healthy`);
			return i; // Return index of working backup
		}
	}

	// All databases failed
	console.error('[SystemConfig] All databases failed health check');
	return null;
}
