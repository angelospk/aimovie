<script lang="ts">
	import type { MovieRecommendation, MovieUserRating, TraktUser } from '$lib/types/discover';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Eye, Bookmark, ThumbsDown, Check } from 'lucide-svelte';
	import { verifyImdbId } from '$lib/utils/imdbVerifier';
	import {
		saveWatchlistItem,
		removeWatchlistItem,
		saveMovieRating,
		getMovieRating,
		getWatchlist
	} from '$lib/utils/localStorage';
	import {
		refreshWatchlist,
		markAsNotInterested,
		removeFromNotInterested
	} from '$lib/stores/discover';
	import { addToTraktWatchlist, markAsWatchedOnTrakt } from '$lib/utils/traktApi';
	import { getViewingHistory, getNotInterested } from '$lib/browser-storage';
	import ClickablePoster from '$lib/components/ClickablePoster.svelte';
	import { settings } from '$lib/store.svelte';

	type Language = 'el' | 'en';

	interface CardTranslations {
		watched: string;
		watchlist: string;
		notForMe: string;
		clear: string;
		watchedBadge: string;
		wantBadge: string;
		notInterestedBadge: string;
	}

	const t: Record<Language, CardTranslations> = {
		el: {
			watched: 'Είδα',
			watchlist: 'Θέλω να δω',
			notForMe: 'Δεν με ενδιαφέρει',
			clear: 'Καθαρισμός',
			watchedBadge: 'Είδα',
			wantBadge: 'Θέλω',
			notInterestedBadge: 'Δεν ενδιαφέρει'
		},
		en: {
			watched: 'Watched',
			watchlist: 'Watchlist',
			notForMe: 'Not for me',
			clear: 'Clear',
			watchedBadge: 'Watched',
			wantBadge: 'Want',
			notInterestedBadge: 'Not interested'
		}
	};

	const tr = $derived(t[settings.lang as Language]);

	let { recommendation, traktUser } = $props<{
		recommendation: MovieRecommendation;
		traktUser: TraktUser | null;
	}>();

	let rating = $state<MovieUserRating | null>(null);
	let verifiedImdbId = $state<string | null>(null);
	let posterUrl = $state<string>(recommendation.imageUrl || '');

	// Load rating and list status on mount
	$effect(() => {
		const loadStatus = () => {
			const history = getViewingHistory();
			const watchlist = getWatchlist();
			const notInterested = getNotInterested();
			const correctImdbId = verifiedImdbId || recommendation.id;

			const isWatched = history.some((h) => h.id === correctImdbId);
			const isWatchlist = watchlist.some((w) => w.movie.id === correctImdbId);
			const isNotInterested = notInterested.some((n) => n.id === correctImdbId);

			rating = {
				watched: isWatched,
				wantsToWatch: isWatchlist,
				doesNotWant: isNotInterested
			};
		};

		loadStatus();
	});

	// Verify IMDb ID asynchronously and get poster image
	$effect(() => {
		if (recommendation.id && recommendation.title && recommendation.year) {
			verifyImdbId(recommendation.id, recommendation.title, recommendation.year).then((result) => {
				if (result) {
					verifiedImdbId = result.id;
					// Store image URL in recommendation if we don't have it yet
					if (result.imageUrl && !recommendation.imageUrl) {
						recommendation.imageUrl = result.imageUrl.replace('_V1_.', '_V1_UX550_.');
						posterUrl = result.imageUrl.replace('_V1_.', '_V1_UX550_.'); // Update reactive state
					}
				}
			});
		}
	});

	async function handleWatched() {
		const newRating: MovieUserRating = {
			watched: true,
			wantsToWatch: false,
			doesNotWant: false
		};
		// saveMovieRating(recommendation.id, newRating); -- Deprecated logic, rely on lists
		rating = newRating;

		// Use verified IMDb ID if available
		const correctImdbId = verifiedImdbId || recommendation.id;

		// Remove from watchlist and not interested
		removeWatchlistItem(correctImdbId);
		removeFromNotInterested(correctImdbId);
		refreshWatchlist();

		// Note: Watched status is handled by viewing history in browser storage via +page.svelte logic mainly,
		// but here we are in Discover. We should ideally add to viewing history here too if we want immediate feedback.
		// However, the current requirement is to sync logic. Let's assume handleWatched triggers navigation
		// or we need to add to history manually here?
		// For now updating UI state. Real 'Watched' list often implies clicking the movie to watch it.
		// If this button marks it as watched without viewing, we should add to history:
		// But wait, the requirement says "Watching an item updates lists".
		// This function is explicit "Mark as Watched". So we should add to viewing history.

		// Import needed dynamically to avoid circular deps if any, or just use browser storage directly
		// import { addViewingHistory } from '$lib/browser-storage'; -- using browser-storage directly

		// For now simply updating local state, assuming integration elsewhere or explicit add:
		// Actually, let's add to viewing history to be robust
		const { addViewingHistory } = await import('$lib/browser-storage');
		addViewingHistory({
			id: correctImdbId,
			title: recommendation.title,
			year: recommendation.year.toString(),
			type: recommendation.type,
			imageUrl: posterUrl
		});

		// Sync with Trakt if connected (use verified ID)
		if (traktUser) {
			await markAsWatchedOnTrakt(traktUser.accessToken, correctImdbId, recommendation.type);
		}
	}

	async function handleWantsToWatch() {
		const newRating: MovieUserRating = {
			watched: false,
			wantsToWatch: true,
			doesNotWant: false
		};
		// saveMovieRating(recommendation.id, newRating);
		rating = newRating;

		// Use verified IMDb ID if available, otherwise fallback to recommendation.id
		const correctImdbId = verifiedImdbId || recommendation.id;

		// Remove from not interested
		removeFromNotInterested(correctImdbId);

		// Create movie object with verified ID
		const movieToSave = {
			...recommendation,
			id: correctImdbId
		};

		// Add to watchlist with verified ID and image URL
		saveWatchlistItem({
			movie: movieToSave,
			explanation: recommendation.explanation,
			addedAt: Date.now(),
			imageUrl: posterUrl
		});
		refreshWatchlist();

		// Sync with Trakt if connected (use verified ID)
		if (traktUser) {
			await addToTraktWatchlist(traktUser.accessToken, correctImdbId, recommendation.type);
		}
	}

	async function handleDoesNotWant() {
		const newRating: MovieUserRating = {
			watched: false,
			wantsToWatch: false,
			doesNotWant: true
		};
		// saveMovieRating(recommendation.id, newRating);
		rating = newRating;

		// Use verified IMDb ID if available
		const correctImdbId = verifiedImdbId || recommendation.id;

		// Remove from watchlist
		removeWatchlistItem(correctImdbId);
		refreshWatchlist();

		// Add to Not Interested
		markAsNotInterested({
			id: correctImdbId,
			title: recommendation.title,
			year: recommendation.year.toString(),
			type: recommendation.type,
			imageUrl: posterUrl
		});
	}

	async function clearRating() {
		// saveMovieRating(recommendation.id, { ... });
		rating = null;

		// Use verified IMDb ID if available
		const correctImdbId = verifiedImdbId || recommendation.id;

		removeWatchlistItem(correctImdbId);
		removeFromNotInterested(correctImdbId);
		refreshWatchlist();

		// Also remove from viewing history
		const { removeViewingHistoryItem } = await import('$lib/browser-storage');
		removeViewingHistoryItem(correctImdbId);
	}
</script>

<div
	class="bg-white/5 p-4 rounded-lg border border-white/10 flex flex-col gap-3 {rating?.doesNotWant
		? 'opacity-50'
		: ''}"
>
	<ClickablePoster imageUrl={posterUrl} title={recommendation.title} />

	<!-- Status Badges Row (if any) -->
	{#if rating?.watched || rating?.wantsToWatch || rating?.doesNotWant}
		<div class="flex gap-2">
			{#if rating?.watched}
				<Badge variant="default" class="bg-green-600">
					<Check class="w-3 h-3 mr-1" />
					{tr.watchedBadge}
				</Badge>
			{:else if rating?.wantsToWatch}
				<Badge variant="default" class="bg-blue-600">
					<Bookmark class="w-3 h-3 mr-1" />
					{tr.wantBadge}
				</Badge>
			{:else if rating?.doesNotWant}
				<Badge variant="destructive">
					<ThumbsDown class="w-3 h-3 mr-1" />
					{tr.notInterestedBadge}
				</Badge>
			{/if}
		</div>
	{/if}

	<div class="flex justify-between items-start gap-2">
		<div class="flex-1 min-w-0">
			<h3 class="font-semibold text-white">{recommendation.title} ({recommendation.year})</h3>
			<p class="text-sm text-purple-300">{recommendation.director}</p>
		</div>
		<div class="flex gap-2 items-center flex-shrink-0">
			<Badge variant="secondary" class="capitalize">{recommendation.type}</Badge>
			{#if verifiedImdbId}
				<a
					href="https://www.imdb.com/title/{verifiedImdbId}"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center px-1.5 py-1 rounded hover:opacity-80 transition-opacity"
					title="View on IMDb"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="32"
						height="16"
						viewBox="0 0 64 32"
						class="drop-shadow-sm"
					>
						<rect width="64" height="32" fill="#f5c518" rx="4" />
						<text
							x="50%"
							y="50%"
							dominant-baseline="middle"
							text-anchor="middle"
							font-family="Arial, sans-serif"
							font-weight="bold"
							font-size="18"
							fill="#000"
						>
							IMDb
						</text>
					</svg>
				</a>
			{/if}
		</div>
	</div>

	<div class="flex flex-wrap gap-1">
		{#each recommendation.genres as genre (genre)}
			<Badge variant="outline" class="text-xs">{genre}</Badge>
		{/each}
	</div>

	<p class="text-purple-200 text-sm leading-relaxed">{recommendation.explanation}</p>

	<div class="mt-auto pt-3 flex flex-wrap gap-2">
		{#if rating?.watched || rating?.wantsToWatch || rating?.doesNotWant}
			<Button
				onclick={clearRating}
				size="sm"
				variant="ghost"
				class="text-purple-300 hover:text-white hover:bg-purple-500/20"
			>
				{tr.clear}
			</Button>
		{:else}
			<Button
				onclick={handleWatched}
				size="sm"
				variant="outline"
				class="border-green-500/50 text-green-300 hover:bg-green-500/20"
			>
				<Eye class="w-4 h-4 mr-1" />
				{tr.watched}
			</Button>

			<Button
				onclick={handleWantsToWatch}
				size="sm"
				variant="outline"
				class="border-blue-500/50 text-blue-300 hover:bg-blue-500/20"
			>
				<Bookmark class="w-4 h-4 mr-1" />
				{tr.watchlist}
			</Button>

			<Button
				onclick={handleDoesNotWant}
				size="sm"
				variant="outline"
				class="border-red-500/50 text-red-300 hover:bg-red-500/20"
			>
				<ThumbsDown class="w-4 h-4 mr-1" />
				{tr.notForMe}
			</Button>
		{/if}
	</div>
</div>
