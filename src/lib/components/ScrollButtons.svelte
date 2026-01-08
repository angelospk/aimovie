<script lang="ts">
	import { ArrowUp, ArrowDown } from 'lucide-svelte';

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}

	function scrollToBottom() {
		window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
	}
</script>

<div class="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
	<button
		onclick={scrollToTop}
		class="bg-purple-500/20 text-purple-200 hover:bg-purple-500/40 p-2 rounded-full"
		aria-label="Scroll to top"
	>
		<ArrowUp class="size-6" />
	</button>
	<button
		onclick={scrollToBottom}
		class="bg-purple-500/20 text-purple-200 hover:bg-purple-500/40 p-2 rounded-full"
		aria-label="Scroll to bottom"
	>
		<ArrowDown class="size-6" />
	</button>
</div>
