import type { ImdbSuggestionResponse } from '$lib/types/imdb';

/**
 * Verify that an IMDb ID exists and fetch poster image.
 * Returns object with verified ID and image URL, or null if not found.
 */
export async function verifyImdbId(
    imdbId: string,
    title: string,
    year: number
): Promise<{ id: string; imageUrl?: string } | null> {
    try {
        // Build IMDb suggestion URL with title and year
        const searchQuery = encodeURIComponent(title + ' (' + year + ')');
        const imdbUrl = `https://v3.sg.media-imdb.com/suggestion/x/${searchQuery}.json`;

        let data: ImdbSuggestionResponse | null = null;

        // Try corsproxy.io first with 1000ms timeout
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
                    data = (await response.json()) as ImdbSuggestionResponse;
                }
            } catch (error) {
                clearTimeout(timeoutId);
            }
        } catch (error) {
            // corsproxy failed, will try next fallback
        }

        // Fallback to Vercel proxy if corsproxy failed
        if (!data) {
            try {
                const vercelProxyUrl = `https://openpopcorn.vercel.app/api/proxy?url=${encodeURIComponent(imdbUrl)}`;
                const response = await fetch(vercelProxyUrl);

                if (response.ok) {
                    data = (await response.json()) as ImdbSuggestionResponse;
                }
            } catch (error) {
                // Vercel proxy failed, will try direct
            }
        }

        // Final fallback: try direct URL
        if (!data) {
            try {
                const response = await fetch(imdbUrl);
                if (response.ok) {
                    data = (await response.json()) as ImdbSuggestionResponse;
                }
            } catch (error) {
                // All attempts failed
                return null;
            }
        }

        // If we have data and at least one result, return the first result's ID and image
        if (!data || !data.d || !Array.isArray(data.d) || data.d.length === 0) {
            return null;
        }

        // Return the IMDb ID and image URL from the first search result that has a year
        // Skip results without 'y' (year) field as they may be incorrect matches
        const validResult = data.d.find((r) => r.y !== undefined);
        if (!validResult) {
            return null;
        }
        return {
            id: validResult.id,
            imageUrl: validResult.i?.imageUrl
        };
    } catch (error) {
        // Silently fail - don't show badge if search fails
        console.debug('IMDb search failed:', error);
        return null;
    }
}
