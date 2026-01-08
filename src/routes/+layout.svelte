<script lang="ts">
	import { page } from "$app/state";
	import { base } from "$app/paths";
	import { settings } from "$lib/store.svelte";
	import { QueryClientProvider } from "@tanstack/svelte-query";
	import { browser } from "$app/environment";
	import "../style.css";
	import type { Theme, Language, LayoutTranslations } from "$lib/types";
	import { Toaster } from "svelte-sonner";
	import AppFooter from "$lib/components/AppFooter.svelte";
	import { getQueryClient } from "$lib/queries/query-client";

	let { children }: { children: import("svelte").Snippet } = $props();

	// Use singleton QueryClient instance to preserve cache across navigation
	const queryClient = $derived(getQueryClient());

	// Language state
	let lang = $derived(settings.lang as Language);

	$effect(() => {
		if (typeof window !== "undefined") {
			localStorage.setItem("lang", settings.lang);
		}
	});

	// Translations
	const t: Record<Language, LayoutTranslations> = {
		el: {
			home: "Αρχική",
			discover: "Ανακάλυψε",
			faq: "Συχνές Ερωτήσεις",
			support: "Υποστήριξη",
			github: "GitHub",
			builtWith: "Φτιαγμένο με ",
		},
		en: {
			home: "Home",
			discover: "Discover",
			faq: "FAQ",
			support: "Support",
			github: "GitHub",
			builtWith: "Built with ",
		},
	};

	const tr = $derived(t[lang]);

	function toggleLang(): void {
		const newLang: Language = lang === "el" ? "en" : "el";
		settings.lang = newLang;
	}

	// Force dark mode
	$effect(() => {
		if (typeof window !== "undefined") {
			document.documentElement.classList.add("dark");
		}
	});
</script>

<svelte:head>
	<title>AI Movie Consultant</title>
	<meta name="description" content="AI Cinema Expert" />
</svelte:head>

{#if queryClient}
	<QueryClientProvider client={queryClient}>
		<div class="bg-background text-foreground font-sans antialiased dark">
			<div class="flex flex-col min-h-screen">
				<header
					class="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm"
				>
					<div class="container flex h-14 items-center">
						<a
							href="{base}/"
							class="mr-6 flex items-center space-x-2"
						>
							<span class="font-bold text-lg">🎬</span>
							<span class="font-bold text-lg hidden md:inline"
								>AI Movie</span
							>
						</a>
						<div
							class="flex flex-1 items-center justify-end space-x-4"
						>
							<button
								onclick={toggleLang}
								class="flex items-center justify-center rounded-full w-8 h-8 bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
								title="Language"
							>
								{lang === "el" ? "🇬🇷" : "🇬Β"}
							</button>
						</div>
					</div>
				</header>
				<main class="flex-1">
					<div class="container py-8">
						{@render children()}
					</div>
				</main>
				<AppFooter translations={tr} />
			</div>
		</div>
		<Toaster
			position="bottom-center"
			richColors
			closeButton
			duration={5000}
		/>
	</QueryClientProvider>
{:else}
	<div class="bg-background text-foreground font-sans antialiased dark">
		<div class="flex flex-col min-h-screen">
			{@render children()}
		</div>
	</div>
{/if}

<style>
	@import "tailwindcss";

	.container {
		@apply max-w-7xl mx-auto px-4;
	}
</style>
