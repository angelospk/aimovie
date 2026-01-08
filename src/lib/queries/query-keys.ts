/**
 * Query key factories for TanStack Query
 * Provides type-safe, hierarchical query keys for consistent caching
 */

export const proxyKeys = {
	all: ['proxy'] as const,
	playlists: () => [...proxyKeys.all, 'playlist'] as const,
	playlist: (imdbId: string, url: string) => [...proxyKeys.playlists(), imdbId, url] as const,
	imdbSearch: (query: string) => [...proxyKeys.all, 'imdb-search', query] as const,
	publicProxy: (url: string, proxyName: string) =>
		[...proxyKeys.all, 'public-proxy', proxyName, url] as const
};

export const imdbKeys = {
	all: ['imdb'] as const,
	searches: () => [...imdbKeys.all, 'search'] as const,
	search: (query: string) => [...imdbKeys.searches(), query] as const,
	content: (id: string) => [...imdbKeys.all, 'content', id] as const
};

export const videoKeys = {
	all: ['video'] as const,
	data: (imdbId: string) => [...videoKeys.all, 'data', imdbId] as const,
	playlist: (imdbId: string, url: string) => [...videoKeys.all, 'playlist', imdbId, url] as const
};

export const configKeys = {
	all: ['config'] as const,
	system: () => [...configKeys.all, 'system'] as const,
	databaseHealth: (dbType: string) => [...configKeys.all, 'database-health', dbType] as const
};
