<script lang="ts">
	// Clapperboard animation - movie clapper that opens and closes with animated take numbers
	import { untrack } from 'svelte';
	import { settings } from '$lib/store.svelte';

	let takeNumber = $state(1);

	const t = {
		el: {
			production: 'ΠΑΡΑΓΩΓΗ',
			scene: 'ΣΚΗΝΗ',
			take: 'ΛΗΨΗ',
			action: 'Πάμε!',
			searching: 'Αναζήτηση με AI',
			preparing: 'Βρίσκουμε την τέλεια ταινία'
		},
		en: {
			production: 'PRODUCTION',
			scene: 'SCENE',
			take: 'TAKE',
			action: 'Action!',
			searching: 'AI SEARCH',
			preparing: 'Finding your perfect movie'
		}
	} as const;

	const currentLang = $derived(t[settings.lang as keyof typeof t] ?? t.en);

	// Increment take number every clap cycle (3 seconds) - use untrack to prevent effect re-running
	$effect(() => {
		const interval = setInterval(() => {
			untrack(() => {
				takeNumber = takeNumber >= 99 ? 1 : takeNumber + 1;
			});
		}, 3000);
		return () => clearInterval(interval);
	});
</script>

<div class="flex flex-col items-center justify-center gap-6">
	<!-- Clapperboard SVG -->
	<svg
		width="200"
		height="180"
		viewBox="0 0 200 180"
		class="drop-shadow-2xl"
		role="img"
		aria-label="Clapperboard loading animation"
	>
		<defs>
			<linearGradient id="boardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
				<stop offset="0%" style="stop-color:#1a1a2e" />
				<stop offset="100%" style="stop-color:#16213e" />
			</linearGradient>
			<linearGradient id="stripeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
				<stop offset="0%" style="stop-color:#fbbf24" />
				<stop offset="50%" style="stop-color:#f59e0b" />
				<stop offset="100%" style="stop-color:#fbbf24" />
			</linearGradient>
			<filter id="clapGlow">
				<feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#fbbf24" flood-opacity="0.3" />
			</filter>
		</defs>

		<!-- Main board body -->
		<rect
			x="20"
			y="50"
			width="160"
			height="110"
			rx="4"
			fill="url(#boardGrad)"
			stroke="#334155"
			stroke-width="2"
		/>

		<!-- Board text background -->
		<rect x="30" y="60" width="140" height="90" rx="2" fill="#0f172a" />

		<!-- Production info -->
		<text x="45" y="85" fill="#94a3b8" font-size="10" font-family="monospace"
			>{currentLang.production}</text
		>
		<text x="45" y="100" fill="#e2e8f0" font-size="12" font-family="monospace" font-weight="bold"
			>OPENPOPCORN</text
		>

		<text x="45" y="120" fill="#94a3b8" font-size="10" font-family="monospace"
			>{currentLang.scene}</text
		>
		<text x="45" y="135" fill="#fbbf24" font-size="14" font-family="monospace" font-weight="bold"
			>{currentLang.searching}</text
		>

		<!-- Take number -->
		<text x="130" y="85" fill="#94a3b8" font-size="10" font-family="monospace"
			>{currentLang.take}</text
		>
		<text
			x="130"
			y="110"
			fill="#fbbf24"
			font-size="24"
			font-family="monospace"
			font-weight="bold"
			class="take-number"
		>
			{String(takeNumber).padStart(2, '0')}
		</text>

		<!-- Animated clapper top (the part that moves) -->
		<g class="clapper-top" filter="url(#clapGlow)">
			<!-- Clapper stripes background -->
			<rect
				x="20"
				y="20"
				width="160"
				height="30"
				rx="4"
				fill="#1a1a2e"
				stroke="#334155"
				stroke-width="2"
			/>

			<!-- Yellow/Black stripes -->
			{#each [0, 1, 2, 3, 4] as i}
				<rect
					x={20 + i * 32}
					y="20"
					width="16"
					height="30"
					fill={i % 2 === 0 ? '#fbbf24' : '#1a1a2e'}
				/>
			{/each}

			<!-- Rounded corners overlay -->
			<rect
				x="20"
				y="20"
				width="160"
				height="30"
				rx="4"
				fill="transparent"
				stroke="#334155"
				stroke-width="2"
			/>
		</g>

		<!-- Hinge circle -->
		<circle cx="30" cy="50" r="6" fill="#475569" stroke="#64748b" stroke-width="2" />
	</svg>

	<!-- Loading text -->
	<div class="text-center">
		<p class="text-amber-200 text-xl font-semibold">
			{currentLang.action}<span class="inline-flex ml-1">
				<span class="animate-bounce-dot" style="animation-delay: 0s;">.</span>
				<span class="animate-bounce-dot" style="animation-delay: 0.2s;">.</span>
				<span class="animate-bounce-dot" style="animation-delay: 0.4s;">.</span>
			</span>
		</p>
		<p class="text-amber-300/70 text-sm mt-2">{currentLang.preparing}</p>
	</div>
</div>

<style>
	.clapper-top {
		transform-origin: 30px 50px;
		animation: clap 3s ease-in-out infinite;
	}

	@keyframes clap {
		0%,
		100% {
			transform: rotate(0deg);
		}
		10% {
			transform: rotate(-35deg);
		}
		20% {
			transform: rotate(0deg);
		}
	}

	.take-number {
		animation: flash 3s ease-in-out infinite;
	}

	@keyframes flash {
		0%,
		15%,
		100% {
			opacity: 1;
		}
		17%,
		19% {
			opacity: 0.3;
		}
		18% {
			opacity: 1;
		}
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
