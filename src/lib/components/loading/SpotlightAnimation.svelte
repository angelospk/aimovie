<script lang="ts">
	// Spotlight animation - sweeping light beam with dust particles
	import { onMount } from 'svelte';
	import { settings } from '$lib/store.svelte';

	interface Particle {
		id: number;
		x: number;
		y: number;
		size: number;
		opacity: number;
		duration: number;
	}

	let particles = $state<Particle[]>([]);

	const t = {
		el: {
			searching: 'Αναζήτηση',
			scanning: 'Σάρωση της ταινιοθήκης'
		},
		en: {
			searching: 'Searching',
			scanning: 'Scanning the film library'
		}
	} as const;

	const currentLang = $derived(t[settings.lang as keyof typeof t] ?? t.en);

	onMount(() => {
		// Generate dust particles
		const generateParticles = () => {
			particles = Array.from({ length: 20 }, (_, i) => ({
				id: i,
				x: 20 + Math.random() * 60,
				y: 20 + Math.random() * 60,
				size: 2 + Math.random() * 4,
				opacity: 0.3 + Math.random() * 0.5,
				duration: 3 + Math.random() * 4
			}));
		};
		generateParticles();
	});
</script>

<div class="flex flex-col items-center justify-center gap-6">
	<!-- Spotlight container -->
	<div class="relative w-56 h-48 overflow-hidden rounded-lg spotlight-container">
		<!-- Dark background -->
		<div class="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950"></div>

		<!-- Spotlight beam SVG -->
		<svg
			width="100%"
			height="100%"
			viewBox="0 0 224 192"
			class="absolute inset-0"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<radialGradient id="spotGrad" cx="50%" cy="0%" r="100%" fx="50%" fy="0%">
					<stop offset="0%" style="stop-color:#fef3c7;stop-opacity:0.4" />
					<stop offset="40%" style="stop-color:#fde68a;stop-opacity:0.15" />
					<stop offset="100%" style="stop-color:#fef3c7;stop-opacity:0" />
				</radialGradient>
				<filter id="spotBlur">
					<feGaussianBlur stdDeviation="2" />
				</filter>
			</defs>

			<!-- Spotlight cone -->
			<g class="spotlight-beam">
				<polygon points="112,0 30,192 194,192" fill="url(#spotGrad)" filter="url(#spotBlur)" />
				<!-- Bright center line -->
				<line x1="112" y1="0" x2="112" y2="192" stroke="#fef3c7" stroke-width="2" opacity="0.3" />
			</g>

			<!-- Spotlight source -->
			<ellipse cx="112" cy="8" rx="20" ry="8" fill="#fef3c7" opacity="0.8">
				<animate attributeName="opacity" values="0.8;0.5;0.8" dur="2s" repeatCount="indefinite" />
			</ellipse>
		</svg>

		<!-- Dust particles -->
		{#each particles as particle (particle.id)}
			<div
				class="dust-particle"
				style="
					--x: {particle.x}%;
					--y: {particle.y}%;
					--size: {particle.size}px;
					--opacity: {particle.opacity};
					--duration: {particle.duration}s;
				"
			></div>
		{/each}

		<!-- Search hint icons floating -->
		<div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 opacity-40">
			<span class="text-2xl floating-icon" style="animation-delay: 0s;">🎬</span>
			<span class="text-2xl floating-icon" style="animation-delay: 0.5s;">🎥</span>
			<span class="text-2xl floating-icon" style="animation-delay: 1s;">🎞️</span>
		</div>
	</div>

	<!-- Loading text -->
	<div class="text-center">
		<p class="text-amber-100 text-xl font-semibold">
			{currentLang.searching}<span class="inline-flex ml-1">
				<span class="animate-bounce-dot" style="animation-delay: 0s;">.</span>
				<span class="animate-bounce-dot" style="animation-delay: 0.2s;">.</span>
				<span class="animate-bounce-dot" style="animation-delay: 0.4s;">.</span>
			</span>
		</p>
		<p class="text-amber-200/60 text-sm mt-2">{currentLang.scanning}</p>
	</div>
</div>

<style>
	.spotlight-container {
		box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.8);
	}

	.spotlight-beam {
		transform-origin: 112px 0;
		animation: sweep 4s ease-in-out infinite;
	}

	@keyframes sweep {
		0%,
		100% {
			transform: rotate(-20deg);
		}
		50% {
			transform: rotate(20deg);
		}
	}

	.dust-particle {
		position: absolute;
		left: var(--x);
		top: var(--y);
		width: var(--size);
		height: var(--size);
		background: radial-gradient(circle, rgba(254, 243, 199, var(--opacity)) 0%, transparent 70%);
		border-radius: 50%;
		animation: float var(--duration) ease-in-out infinite;
		pointer-events: none;
	}

	@keyframes float {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
			opacity: var(--opacity);
		}
		25% {
			transform: translate(10px, -15px) scale(1.2);
		}
		50% {
			transform: translate(-5px, -25px) scale(0.8);
			opacity: calc(var(--opacity) * 0.5);
		}
		75% {
			transform: translate(15px, -10px) scale(1.1);
		}
	}

	.floating-icon {
		animation: iconFloat 3s ease-in-out infinite;
	}

	@keyframes iconFloat {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-8px);
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
