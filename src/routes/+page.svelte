<script lang="ts">
	import { Film, History, Bookmark } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import MoviePreferencesForm from '$lib/components/MoviePreferencesForm.svelte';
	import StreamingResults from '$lib/components/StreamingResults.svelte';
	import HistoryModal from '$lib/components/HistoryModal.svelte';
	import WatchlistModal from '$lib/components/WatchlistModal.svelte';
	import TraktConnect from '$lib/components/TraktConnect.svelte';
	import ScrollButtons from '$lib/components/ScrollButtons.svelte';
	import { settings } from '$lib/store.svelte';
	import {
		isStreaming,
		currentResult,
		searchHistory,
		watchlist,
		traktUser,
		handleSubmit,
		loadHistory,
		deleteHistory,
		removeFromWatchlist,
		reset
	} from '$lib/stores/discover';

	type Language = 'el' | 'en';

	interface DiscoverTranslations {
		pageTitle: string;
		subtitle: string;
		history: string;
		watchlist: string;
		traktConnect: string;
	}

	const t: Record<Language, DiscoverTranslations> = {
		el: {
			pageTitle: 'AI Movie Consultant',
			subtitle: 'Συμπληρώστε τις προτιμήσεις σας και λάβετε εξατομικευμένες προτάσεις',
			history: 'Ιστορικό',
			watchlist: 'Watchlist',
			traktConnect: 'Trakt.tv'
		},
		en: {
			pageTitle: 'AI Movie Consultant',
			subtitle: 'Fill in your preferences and get personalized recommendations',
			history: 'History',
			watchlist: 'Watchlist',
			traktConnect: 'Trakt.tv'
		}
	};

	const tr = $derived(t[settings.lang as Language]);

	let showHistoryModal = $state(false);
	let showWatchlistModal = $state(false);

	function handleUserChange(user: any) {
		traktUser.set(user);
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
	<ScrollButtons />

	<div class="container mx-auto px-4 py-8 max-w-7xl">
		<!-- Header -->
		<div class="text-center mb-8">
			<div class="flex items-center justify-center gap-3 mb-4">
				<Film class="w-12 h-12 text-purple-400" />
				<h1 class="text-white text-2xl">{tr.pageTitle}</h1>
			</div>
			<p class="text-purple-200">
				{tr.subtitle}
			</p>

			<!-- Action Buttons -->
			<div class="mt-6 flex items-center justify-center gap-3 flex-wrap">
				<Button
					onclick={() => (showHistoryModal = true)}
					variant="outline"
					class="border-purple-400/50 text-purple-200 hover:bg-purple-500/20"
				>
					<History class="w-4 h-4 mr-2" />
					{tr.history} ({$searchHistory.length})
				</Button>

				<Button
					onclick={() => (showWatchlistModal = true)}
					variant="outline"
					class="border-purple-400/50 text-purple-200 hover:bg-purple-500/20"
				>
					<Bookmark class="w-4 h-4 mr-2" />
					{tr.watchlist} ({$watchlist.length})
				</Button>
			</div>

			<!-- Trakt Connection -->
			<div class="mt-4 max-w-md mx-auto">
				<TraktConnect onUserChange={handleUserChange} />
			</div>
		</div>

		<div class="grid lg:grid-cols-2 gap-8">
			<!-- Form Section -->
			<div class="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
				<MoviePreferencesForm
					onSubmit={handleSubmit}
					isLoading={$isStreaming}
					initialPreferences={$currentResult?.preferences}
				/>
			</div>

			<!-- Results Section -->
			<div class="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
				<StreamingResults />
			</div>
		</div>
	</div>

	<!-- Modals -->
	<HistoryModal bind:open={showHistoryModal} onLoad={loadHistory} onDelete={deleteHistory} />

	<WatchlistModal
		bind:open={showWatchlistModal}
		watchlist={$watchlist}
		onRemove={removeFromWatchlist}
	/>
</div>
