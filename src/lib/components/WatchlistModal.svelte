<script lang="ts">
	import type { WatchlistItem } from "$lib/types/discover";
	import { Button } from "$lib/components/ui/button";
	import * as Dialog from "$lib/components/ui/dialog";
	import { Trash } from "lucide-svelte";
	import { settings } from "$lib/store.svelte";

	type Language = "el" | "en";

	interface WatchlistTranslations {
		title: string;
		description: string;
		empty: string;
	}

	const t: Record<Language, WatchlistTranslations> = {
		el: {
			title: "Η Λίστα μου",
			description: "Ταινίες και σειρές που θέλετε να δείτε αργότερα.",
			empty: "Η λίστα σας είναι άδεια.",
		},
		en: {
			title: "My Watchlist",
			description: "Movies and series you want to watch later.",
			empty: "Your watchlist is empty.",
		},
	};

	const tr = $derived(t[settings.lang as Language]);

	let {
		open = $bindable(false),
		watchlist,
		onRemove,
	} = $props<{
		open: boolean;
		watchlist: WatchlistItem[];
		onRemove: (id: string) => void;
	}>();
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="bg-slate-900/80 border-purple-500/30 text-white sm:max-w-3xl"
	>
		<Dialog.Header>
			<Dialog.Title>{tr.title}</Dialog.Title>
			<Dialog.Description>{tr.description}</Dialog.Description>
		</Dialog.Header>
		<div class="max-h-[60vh] overflow-y-auto space-y-3 pr-4">
			{#if watchlist.length === 0}
				<p class="text-purple-300 text-center py-8">{tr.empty}</p>
			{:else}
				{#each watchlist as item (item.movie.id)}
					<div
						class="flex items-center justify-between gap-3 p-3 rounded-lg bg-purple-900/30"
					>
						<div class="flex-1 min-w-0">
							<p class="font-medium">
								{item.movie.title} ({item.movie.year})
							</p>
							<p class="text-sm text-purple-300 line-clamp-3">
								{item.explanation}
							</p>
						</div>
						<div class="shrink-0">
							<Button
								onclick={() => onRemove(item.movie.id)}
								size="sm"
								variant="destructive"
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
