<script lang="ts">
	// Loading Animation Picker - randomly selects one of 4 animations on mount
	import ClapperboardAnimation from './ClapperboardAnimation.svelte';
	import FilmReelAnimation from './FilmReelAnimation.svelte';
	import PopcornAnimation from './PopcornAnimation.svelte';
	import SpotlightAnimation from './SpotlightAnimation.svelte';

	const animations = [
		{ component: ClapperboardAnimation, name: 'clapperboard' },
		{ component: FilmReelAnimation, name: 'filmreel' },
		{ component: PopcornAnimation, name: 'popcorn' },
		{ component: SpotlightAnimation, name: 'spotlight' }
	] as const;

	// Random selection happens once on component initialization
	const selectedIndex = Math.floor(Math.random() * animations.length);
	const SelectedAnimation = animations[selectedIndex].component;
</script>

<div class="loading-picker flex items-center justify-center min-h-[300px]">
	<SelectedAnimation />
</div>

<style>
	.loading-picker {
		animation: fadeIn 0.5s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style>
