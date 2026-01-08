<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';

	let {
		imageUrl,
		title,
		fullSize = false
	} = $props<{
		imageUrl: string;
		title: string;
		fullSize?: boolean;
	}>();

	// Get thumbnail URL (smaller for performance)
	// Replace any UX size with UX150 for thumbnails
	const thumbnailUrl = $derived(imageUrl.replace(/UX\d+/, 'UX250'));

	// Get full-size image URL for dialog (high quality)
	// Replace any UX size with UX1024 for maximum quality
	const fullImageUrl = $derived(imageUrl.replace(/UX\d+/, 'UX1024'));
</script>

{#if imageUrl}
	<Dialog.Root>
		<Dialog.Trigger
			class="w-full cursor-pointer transition-all duration-200 hover:opacity-90"
			onmouseenter={() => {
				// Preload the full-size image on hover
				const img = new Image();
				img.src = fullImageUrl;
			}}
		>
			<img
				src={fullSize ? imageUrl : thumbnailUrl}
				alt={title}
				class={fullSize
					? 'w-full h-auto max-h-[120px] md:max-h-[160px] lg:max-h-[200px] object-cover rounded-lg flex-shrink-0'
					: 'h-40 w-full object-cover rounded-md'}
			/>
		</Dialog.Trigger>
		<Dialog.Content class="max-w-6xl max-h-[95vh] overflow-y-auto">
			<div class="space-y-4">
				<img
					src={fullImageUrl}
					alt={title}
					class="w-full h-auto max-h-[85vh] object-contain rounded-lg"
				/>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{:else}
	<div class="flex h-40 w-full items-center justify-center bg-white/5 rounded-md">
		<span class="text-4xl text-purple-300/50">🎬</span>
	</div>
{/if}
