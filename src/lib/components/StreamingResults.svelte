<script lang="ts">
	import { currentResult, isStreaming, reset, traktUser } from '$lib/stores/discover';
	import RecommendationCard from './RecommendationCard.svelte';
	import AiThinkingAnimation from './AiThinkingAnimation.svelte';
	import { Button } from '$lib/components/ui/button';
	import { RefreshCw, AlertTriangle } from 'lucide-svelte';
	import { settings } from '$lib/store.svelte';

	type Language = 'el' | 'en';

	interface ResultsTranslations {
		newSearch: string;
		tryAgain: string;
		errorTitle: string;
		quotaError: string;
		networkError: string;
		parseError: string;
		genericError: string;
		retryIn: string;
		emptyStateTitle: string;
		emptyStateSubtitle: string;
	}

	const t: Record<Language, ResultsTranslations> = {
		el: {
			newSearch: 'Νέα Αναζήτηση',
			tryAgain: 'Προσπαθήστε Ξανά',
			errorTitle: 'Ωχ! Κάτι πήγε στραβά',
			quotaError: 'Το όριο χρήσης API ξεπεράστηκε.',
			networkError: 'Αποτυχία σύνδεσης με την υπηρεσία AI. Ελέγξτε τη σύνδεσή σας.',
			parseError: 'Το AI επέστρεψε μη έγκυρα δεδομένα. Προσπαθήστε ξανά.',
			genericError: 'Προέκυψε ένα απροσδόκητο σφάλμα κατά τη δημιουργία προτάσεων.',
			retryIn: 'Δοκιμάστε ξανά σε',
			emptyStateTitle: 'Οι προτάσεις σας θα εμφανιστούν εδώ.',
			emptyStateSubtitle:
				'Συμπληρώστε τη φόρμα και αφήστε το AI να βρει την επόμενη αγαπημένη σας ταινία ή σειρά.'
		},
		en: {
			newSearch: 'New Search',
			tryAgain: 'Try Again',
			errorTitle: 'Oops! Something went wrong',
			quotaError: 'API quota exceeded.',
			networkError: 'Failed to connect to AI service. Check your connection and try again.',
			parseError: 'AI returned invalid data format. Please try again.',
			genericError: 'An unexpected error occurred while generating recommendations.',
			retryIn: 'Try again in',
			emptyStateTitle: 'Your recommendations will appear here.',
			emptyStateSubtitle:
				'Fill out the form and let the AI find your next favorite movie or series.'
		}
	};

	const tr = $derived(t[settings.lang as Language] ?? t.en);

	let error = $state<unknown>(null);
	let resetBoundary = $state<(() => void) | null>(null);

	function handleError(e: unknown, r: () => void) {
		error = e;
		resetBoundary = r;
		console.error('StreamingResults error:', e);
	}

	function retry() {
		if (resetBoundary) {
			error = null;
			resetBoundary();
			reset();
		}
	}

	function getErrorMessage(err: unknown): string {
		if (err instanceof Error) {
			return err.message;
		}
		return String(err);
	}

	type ErrorType =
		| 'QUOTA_EXCEEDED'
		| 'ALL_MODELS_EXHAUSTED'
		| 'NETWORK_ERROR'
		| 'INVALID_RESPONSE'
		| 'CONFIG_ERROR'
		| '';

	function getErrorType(err: unknown): ErrorType {
		const errWithType = err as { errorType?: ErrorType };
		return errWithType?.errorType || '';
	}

	function getRetryAfter(err: unknown): number | undefined {
		const errWithRetry = err as { retryAfter?: number };
		return errWithRetry?.retryAfter;
	}
</script>

<svelte:boundary onerror={handleError}>
	<div>
		{#if $isStreaming}
			<div class="flex flex-col items-center justify-center h-[500px]">
				<AiThinkingAnimation />
			</div>
		{:else if $currentResult}
			<div>
				<div class="flex justify-between items-center mb-4">
					<h2 class="text-xl font-semibold text-white">{$currentResult.title}</h2>
					<Button
						onclick={() => {
							// Notify parent to reset non-locked filters
							reset();
						}}
						variant="ghost"
						size="sm"
					>
						<RefreshCw class="w-4 h-4 mr-2" />
						{tr.newSearch}
					</Button>
				</div>
				<p class="text-sm text-purple-200 mb-6">{$currentResult.summary}</p>

				<div class="grid md:grid-cols-2 gap-4">
					{#each $currentResult.recommendations as recommendation (recommendation.id)}
						<RecommendationCard {recommendation} traktUser={$traktUser} />
					{/each}
				</div>
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center h-[500px] text-center">
				<p class="text-lg text-purple-200">{tr.emptyStateTitle}</p>
				<p class="text-sm text-purple-400/70">
					{tr.emptyStateSubtitle}
				</p>
			</div>
		{/if}
	</div>

	{#snippet failed(err, resetFn)}
		{@const errMsg = getErrorMessage(err)}
		{@const errorType = getErrorType(err)}
		{@const retryAfter = getRetryAfter(err)}
		<div class="flex flex-col items-center justify-center h-[500px] gap-6 text-center px-4">
			<div class="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10">
				<AlertTriangle class="w-8 h-8 text-red-400" />
			</div>

			<div>
				<h3 class="text-xl font-semibold text-white mb-2">{tr.errorTitle}</h3>
				<p class="text-purple-200 max-w-md">
					{#if errorType === 'QUOTA_EXCEEDED' || errorType === 'ALL_MODELS_EXHAUSTED'}
						{tr.quotaError}
						{#if retryAfter}
							<br /><span class="text-sm text-purple-400">{tr.retryIn} {retryAfter}s</span>
						{/if}
					{:else if errorType === 'NETWORK_ERROR' || errorType === 'CONFIG_ERROR'}
						{tr.networkError}
					{:else if errorType === 'INVALID_RESPONSE'}
						{tr.parseError}
					{:else}
						{errMsg || tr.genericError}
					{/if}
				</p>
			</div>

			<Button
				onclick={() => {
					error = null;
					resetFn();
					reset();
				}}
				class="bg-purple-600 hover:bg-purple-700"
			>
				<RefreshCw class="w-4 h-4 mr-2" />
				{tr.tryAgain}
			</Button>
		</div>
	{/snippet}

	{#snippet pending()}
		<div class="flex flex-col items-center justify-center h-[500px]">
			<AiThinkingAnimation />
		</div>
	{/snippet}
</svelte:boundary>
