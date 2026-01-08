<script lang="ts">
	// Film reel animation - rotating film strip with frames that progressively light up
	import { untrack } from 'svelte';
	import { settings } from '$lib/store.svelte';

	let activeFrame = $state(0);

	const t = {
		el: {
			rolling: 'Γύρισμα',
			preparing: 'Προετοιμασία προτάσεων'
		},
		en: {
			rolling: 'Rolling',
			preparing: 'Preparing your recommendations'
		}
	} as const;

	const currentLang = $derived(t[settings.lang as keyof typeof t] ?? t.en);

	// Cycle through frames - use untrack to prevent effect re-running on each frame change
	$effect(() => {
		const interval = setInterval(() => {
			untrack(() => {
				activeFrame = (activeFrame + 1) % 8;
			});
		}, 400);
		return () => clearInterval(interval);
	});
</script>

<div class="flex flex-col items-center justify-center gap-6">
	<!-- Film Reel SVG -->
	<div class="relative">
		<svg
			width="200"
			height="200"
			viewBox="0 0 200 200"
			class="film-reel"
			role="img"
			aria-label="Film reel loading animation"
			aria-hidden="true"
		>
			<defs>
				<linearGradient id="reelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" style="stop-color:#374151" />
					<stop offset="50%" style="stop-color:#1f2937" />
					<stop offset="100%" style="stop-color:#374151" />
				</linearGradient>
				<filter id="reelGlow">
					<feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#a855f7" flood-opacity="0.5" />
				</filter>
				<filter id="frameGlow">
					<feDropShadow dx="0" dy="0" stdDeviation="4" flood-color="#fbbf24" flood-opacity="0.8" />
				</filter>
			</defs>

			<!-- Outer reel ring -->
			<circle cx="100" cy="100" r="90" fill="none" stroke="url(#reelGrad)" stroke-width="8" />

			<!-- Inner details -->
			<circle cx="100" cy="100" r="75" fill="none" stroke="#374151" stroke-width="2" />
			<circle cx="100" cy="100" r="30" fill="#1f2937" stroke="#4b5563" stroke-width="3" />
			<circle cx="100" cy="100" r="15" fill="#374151" stroke="#6b7280" stroke-width="2" />
			<circle cx="100" cy="100" r="5" fill="#9ca3af" />

			<!-- Film frames around the reel -->
			{#each Array(8) as _, i}
				{@const angle = (i * 45 * Math.PI) / 180}
				{@const x = 100 + Math.cos(angle) * 55}
				{@const y = 100 + Math.sin(angle) * 55}
				<g transform="translate({x}, {y}) rotate({i * 45 + 45})">
					<rect
						x="-12"
						y="-16"
						width="24"
						height="32"
						rx="2"
						fill={i === activeFrame ? '#fbbf24' : '#374151'}
						stroke={i === activeFrame ? '#fbbf24' : '#4b5563'}
						stroke-width="1"
						filter={i === activeFrame ? 'url(#frameGlow)' : 'none'}
						class="frame-rect"
					/>
					<!-- Sprocket holes -->
					<rect x="-10" y="-14" width="4" height="3" rx="0.5" fill="#1f2937" />
					<rect x="6" y="-14" width="4" height="3" rx="0.5" fill="#1f2937" />
					<rect x="-10" y="11" width="4" height="3" rx="0.5" fill="#1f2937" />
					<rect x="6" y="11" width="4" height="3" rx="0.5" fill="#1f2937" />
				</g>
			{/each}

			<!-- Spokes -->
			{#each Array(6) as _, i}
				{@const angle = (i * 60 * Math.PI) / 180}
				<line
					x1={100 + Math.cos(angle) * 30}
					y1={100 + Math.sin(angle) * 30}
					x2={100 + Math.cos(angle) * 75}
					y2={100 + Math.sin(angle) * 75}
					stroke="#4b5563"
					stroke-width="3"
				/>
			{/each}
		</svg>
	</div>

	<!-- Loading text -->
	<div class="text-center" role="status" aria-live="polite">
		<p class="text-purple-200 text-xl font-semibold">
			{currentLang.rolling}<span class="inline-flex ml-1">
				<span class="animate-bounce-dot" style="animation-delay: 0s;">.</span>
				<span class="animate-bounce-dot" style="animation-delay: 0.2s;">.</span>
				<span class="animate-bounce-dot" style="animation-delay: 0.4s;">.</span>
			</span>
		</p>
		<p class="text-purple-300/70 text-sm mt-2">{currentLang.preparing}</p>
	</div>
</div>

<style>
	.film-reel {
		animation: spin 8s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	.frame-rect {
		transition:
			fill 0.2s ease,
			filter 0.2s ease;
	}

	.animate-bounce-dot {
		animation: bounceDot 1s infinite;
		display: inline-block;
	}

	@keyframes bounceDot {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-6px);
		}
	}
</style>
