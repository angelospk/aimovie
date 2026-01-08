/**
 * Singleton QueryClient instance
 * Created once and reused across the application to preserve cache
 */

import { QueryClient } from '@tanstack/svelte-query';
import { browser } from '$app/environment';

let queryClientInstance: QueryClient | null = null;

/**
 * Get or create the singleton QueryClient instance
 * This ensures cache persists across navigation
 */
export function getQueryClient(): QueryClient | null {
	if (!browser) return null;

	if (!queryClientInstance) {
		queryClientInstance = new QueryClient({
			defaultOptions: {
				queries: {
					// Default staleTime for queries (can be overridden per query)
					staleTime: 1000 * 60 * 5, // 5 minutes
					// Default gcTime (cache retention time)
					gcTime: 1000 * 60 * 60, // 1 hour
					// Retry configuration
					retry: 1,
					retryDelay: 1000
				}
			}
		});
	}

	return queryClientInstance;
}
