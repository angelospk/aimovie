<script lang="ts">
	import type { SearchResult } from "$lib/types/discover";
	import { Button } from "$lib/components/ui/button";
	import * as Dialog from "$lib/components/ui/dialog";
	import {
		searchHistory,
		loadHistory,
		deleteHistory,
	} from "$lib/stores/discover";
	import { Trash, Loader } from "lucide-svelte";
	import { settings } from "$lib/store.svelte";

	type Language = "el" | "en";

	interface HistoryTranslations {
		title: string;
		description: string;
		load: string;
		noHistory: string;
		delete: string;
	}

	const t: Record<Language, HistoryTranslations> = {
		el: {
			title: "Ιστορικό Αναζητήσεων",
			description:
				"Εδώ είναι οι πρόσφατες αναζητήσεις σας. Μπορείτε να φορτώσετε ή να διαγράψετε.",
			load: "Φόρτωση",
			noHistory: "Δεν υπάρχει ιστορικό ακόμα.",
			delete: "Διαγραφή",
		},
		en: {
			title: "Search History",
			description:
				"Here are your recent searches. You can load a previous result or delete it.",
			load: "Load",
			noHistory: "No history yet.",
			delete: "Delete",
		},
	};

	const tr = $derived(t[settings.lang as Language] ?? t.en);

	let {
		open = $bindable(false),
		onLoad,
		onDelete,
	} = $props<{
		open: boolean;
		onLoad: (result: SearchResult) => void;
		onDelete: (id: string) => void;
	}>();

	function handleLoad(result: SearchResult) {
		onLoad(result);
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="bg-slate-900/80 border-purple-500/30 text-white sm:max-w-3xl"
	>
		<Dialog.Header>
			<Dialog.Title>{tr.title}</Dialog.Title>
			<Dialog.Description>
				{tr.description}
			</Dialog.Description>
		</Dialog.Header>
		<div class="max-h-[60vh] overflow-y-auto space-y-3 pr-4">
			{#if $searchHistory.length === 0}
				<p class="text-purple-300 text-center py-8">{tr.noHistory}</p>
			{:else}
				{#each $searchHistory as item (item.id)}
					<div
						class="flex items-center justify-between gap-3 p-3 rounded-lg bg-purple-900/30"
					>
						<div class="flex-1 min-w-0">
							<p class="font-medium">{item.title}</p>
							<p class="text-sm text-purple-300 line-clamp-2">
								{item.summary}
							</p>
							<p class="text-xs text-purple-400/70">
								{new Date(item.timestamp).toLocaleString(
									settings.lang,
								)}
							</p>
						</div>
						<div class="flex gap-2 shrink-0">
							<Button
								onclick={() => handleLoad(item)}
								size="sm"
								variant="outline"
							>
								<Loader class="w-4 h-4 mr-2" />
								{tr.load}
							</Button>
							<Button
								onclick={() => onDelete(item.id)}
								size="sm"
								variant="destructive"
								aria-label={tr.delete}
							>
								<Trash class="w-4 h-4" />
							</Button>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
