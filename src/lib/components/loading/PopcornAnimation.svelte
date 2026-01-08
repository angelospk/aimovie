<script lang="ts">
	// Popcorn animation - popcorn pieces flying in all directions from the bucket
	import { onMount } from 'svelte';
	import { settings } from '$lib/store.svelte';

	interface Popcorn {
		id: number;
		x: number;
		angle: number; // Direction angle in degrees
		distance: number; // How far it travels
		rotation: number; // Spin rotation
		size: number;
	}

	let popcorns = $state<Popcorn[]>([]);
	let nextId = 0;

	const t = {
		el: {
			popping: 'Σκάσιμο',
			cooking: 'Ετοιμάζουμε τις προτάσεις'
		},
		en: {
			popping: 'Popping',
			cooking: 'Cooking up recommendations'
		}
	} as const;

	const currentLang = $derived(t[settings.lang as keyof typeof t] ?? t.en);

	onMount(() => {
		// Spawn new popcorn periodically
		const interval = setInterval(() => {
			// Create 2-3 popcorns at once for explosion effect
			const count = 2 + Math.floor(Math.random() * 2);
			const newPopcorns: Popcorn[] = [];

			for (let i = 0; i < count; i++) {
				newPopcorns.push({
					id: nextId++,
					x: 40 + Math.random() * 20, // Spawn from center of bucket
					angle: -180 + Math.random() * 360, // Any direction (but mostly upward arc)
					distance: 60 + Math.random() * 80, // Variable distance
					rotation: Math.random() * 720 - 360, // Random spin
					size: 0.7 + Math.random() * 0.5
				});
			}

			popcorns = [...popcorns.slice(-15), ...newPopcorns];
		}, 350);

		return () => clearInterval(interval);
	});
</script>

<div class="flex flex-col items-center justify-center gap-6">
	<!-- Popcorn container -->
	<div class="relative w-52 h-64 overflow-visible">
		<!-- Flying popcorn pieces -->
		{#each popcorns as pop (pop.id)}
			<div
				class="popcorn-fly"
				style="
					--start-x: {pop.x}%;
					--angle: {pop.angle}deg;
					--distance: {pop.distance}px;
					--rotation: {pop.rotation}deg;
					--size: {pop.size};
				"
			>
				<svg width="28" height="28" viewBox="0 0 28 28">
					<g fill="#fef3c7" stroke="#fbbf24" stroke-width="0.5">
						<circle cx="14" cy="10" r="5" />
						<circle cx="9" cy="14" r="4" />
						<circle cx="19" cy="14" r="4" />
						<circle cx="14" cy="17" r="3.5" />
						<circle cx="11" cy="10" r="3.5" />
						<circle cx="17" cy="10" r="3.5" />
					</g>
				</svg>
			</div>
		{/each}

		<!-- Bucket SVG -->
		<svg
			width="208"
			height="256"
			viewBox="0 0 208 256"
			class="absolute inset-0"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<linearGradient id="bucketGrad" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" style="stop-color:#dc2626" />
					<stop offset="50%" style="stop-color:#ef4444" />
					<stop offset="100%" style="stop-color:#dc2626" />
				</linearGradient>
				<linearGradient id="bucketStripe" x1="0%" y1="0%" x2="100%" y2="0%">
					<stop offset="0%" style="stop-color:#fef3c7" />
					<stop offset="50%" style="stop-color:#fef9c3" />
					<stop offset="100%" style="stop-color:#fef3c7" />
				</linearGradient>
				<filter id="bucketShadow">
					<feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity="0.3" />
				</filter>
			</defs>

			<!-- Bucket body -->
			<path
				d="M 44 100 L 58 220 Q 60 232 72 232 L 136 232 Q 148 232 150 220 L 164 100 Z"
				fill="url(#bucketGrad)"
				filter="url(#bucketShadow)"
			/>

			<!-- Bucket stripes -->
			<path
				d="M 48 120 L 62 210 L 146 210 L 160 120 Z"
				fill="none"
				stroke="url(#bucketStripe)"
				stroke-width="6"
			/>
			<path
				d="M 50 145 L 64 195 L 144 195 L 158 145 Z"
				fill="none"
				stroke="url(#bucketStripe)"
				stroke-width="4"
			/>

			<!-- Bucket rim -->
			<ellipse cx="104" cy="100" rx="62" ry="14" fill="#b91c1c" />
			<ellipse cx="104" cy="97" rx="58" ry="12" fill="#ef4444" />

			<!-- POPCORN text -->
			<text
				x="104"
				y="172"
				text-anchor="middle"
				fill="#fef3c7"
				font-size="14"
				font-weight="bold"
				font-family="sans-serif"
			>
				POPCORN
			</text>

			<!-- Popcorn pile INSIDE the bucket (below rim) -->
			<g class="pile-inside">
				<!-- Back layer of popcorn -->
				<g fill="#e5dbb8" stroke="#d4a017" stroke-width="0.3">
					<circle cx="85" cy="95" r="7" />
					<circle cx="104" cy="93" r="8" />
					<circle cx="123" cy="95" r="7" />
				</g>
				<!-- Front layer of popcorn (brighter, on top) -->
				<g fill="#fef3c7" stroke="#fbbf24" stroke-width="0.3">
					<circle cx="78" cy="100" r="6" />
					<circle cx="92" cy="98" r="7" />
					<circle cx="104" cy="100" r="8" />
					<circle cx="116" cy="98" r="7" />
					<circle cx="130" cy="100" r="6" />
					<!-- Additional depth -->
					<circle cx="86" cy="104" r="5" />
					<circle cx="98" cy="106" r="6" />
					<circle cx="110" cy="106" r="6" />
					<circle cx="122" cy="104" r="5" />
				</g>
			</g>
		</svg>
	</div>

	<!-- Loading text -->
	<div class="text-center">
		<p class="text-yellow-200 text-xl font-semibold">
			{currentLang.popping}<span class="inline-flex ml-1">
				<span class="animate-bounce-dot" style="animation-delay: 0s;">.</span>
				<span class="animate-bounce-dot" style="animation-delay: 0.2s;">.</span>
				<span class="animate-bounce-dot" style="animation-delay: 0.4s;">.</span>
			</span>
		</p>
		<p class="text-yellow-300/70 text-sm mt-2">{currentLang.cooking}</p>
	</div>
</div>

<style>
	.popcorn-fly {
		position: absolute;
		left: var(--start-x);
		top: 35%;
		transform-origin: center center;
		animation: flyOut 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
		pointer-events: none;
	}

	@keyframes flyOut {
		0% {
			opacity: 1;
			transform: translate(0, 0) rotate(0deg) scale(0.3);
		}
		20% {
			opacity: 1;
			transform: translate(
					calc(cos(var(--angle)) * var(--distance) * 0.3),
					calc(sin(var(--angle)) * var(--distance) * 0.3 - 20px)
				)
				rotate(calc(var(--rotation) * 0.3)) scale(calc(var(--size)));
		}
		60% {
			opacity: 1;
			transform: translate(
					calc(cos(var(--angle)) * var(--distance) * 0.8),
					calc(sin(var(--angle)) * var(--distance) * 0.8 - 10px)
				)
				rotate(calc(var(--rotation) * 0.8)) scale(calc(var(--size)));
		}
		100% {
			opacity: 0;
			transform: translate(
					calc(cos(var(--angle)) * var(--distance)),
					calc(sin(var(--angle)) * var(--distance) + 30px)
				)
				rotate(var(--rotation)) scale(calc(var(--size) * 0.8));
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
