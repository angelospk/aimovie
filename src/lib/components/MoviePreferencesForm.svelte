<script lang="ts">
	import type { MoviePreferences, LockedFilters } from '$lib/types/discover';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import * as ToggleGroup from '$lib/components/ui/toggle-group';
	import * as Collapsible from '$lib/components/ui/collapsible';
	import { generatePromptText } from '$lib/utils/promptGenerator';
	import {
		getLockedFilters,
		saveLockedFilters,
		getLockedFilterValues,
		saveLockedFilterValues
	} from '$lib/utils/localStorage';
	import { resetSignal } from '$lib/stores/discover';
	import { ChevronDown, ChevronUp, Copy, Lock, Unlock } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import { onMount, untrack } from 'svelte';
	import { browser } from '$app/environment';
	import { settings } from '$lib/store.svelte';

	type Language = 'el' | 'en';

	interface FilterTranslations {
		freeTextLabel: string;
		freeTextPlaceholder: string;
		genres: string;
		subGenres: string;
		contentType: string;
		contentTypeOptions: {
			both: string;
			moviesOnly: string;
			seriesOnly: string;
		};
		countries: string;
		period: string;
		periodPlaceholder: string;
		moodTone: string;
		showAdvanced: string;
		hideAdvanced: string;
		copyPrompt: string;
		newSearch: string;
		getRecommendations: string;
		generating: string;
		none: string;
		// Advanced filter labels
		pacing: string;
		endingType: string;
		duration: string;
		episodeDuration: string;
		seriesDuration: string;
		intensity: string;
		awards: string;
		criticAudience: string;
		basedOn: string;
		discovery: string;
		// Placeholders
		selectPacing: string;
		selectEndingType: string;
		selectDuration: string;
		selectEpisodeDuration: string;
		selectSeriesDuration: string;
		selectIntensity: string;
		selectAwards: string;
		selectCriticAudience: string;
		selectDiscovery: string;

		// Option translations
		countryOptions: Record<string, string>;
		basedOnOptions: Record<string, string>;
		pacingOptions: Record<string, string>;
		endingTypeOptions: Record<string, string>;
		durationOptions: Record<string, string>;
		episodeDurationOptions: Record<string, string>;
		seriesDurationOptions: Record<string, string>;
		intensityOptions: Record<string, string>;
		awardsOptions: Record<string, string>;
		criticAudienceOptions: Record<string, string>;
		discoveryOptions: Record<string, string>;
		includeHistory: string;
	}

	const t: Record<Language, FilterTranslations> = {
		el: {
			freeTextLabel: 'Περιγράψτε τι θέλετε να δείτε',
			freeTextPlaceholder: 'π.χ., μια ταινία sci-fi που θα σας κάνει να σκεφτείτε...',
			genres: 'Είδη',
			subGenres: 'Υποκατηγορίες',
			contentType: 'Τύπος Περιεχομένου',
			contentTypeOptions: {
				both: 'Ταινίες και Σειρές',
				moviesOnly: 'Μόνο Ταινίες',
				seriesOnly: 'Μόνο Σειρές'
			},
			countries: 'Χώρες',
			period: 'Περίοδος',
			periodPlaceholder: 'Επιλέξτε περίοδο',
			moodTone: 'Διάθεση/Τόνος',
			showAdvanced: 'Εμφάνιση Προηγμένων Φίλτρων',
			hideAdvanced: 'Απόκρυψη Προηγμένων Φίλτρων',
			copyPrompt: 'Αντιγραφή Prompt',
			newSearch: 'Νέα Αναζήτηση',
			getRecommendations: 'Λήψη Προτάσεων',
			generating: 'Δημιουργία...',
			none: '-- Κανένα --',
			// Advanced filter labels
			pacing: 'Ρυθμός',
			endingType: 'Τύπος Τέλους',
			duration: 'Διάρκεια Ταινίας',
			episodeDuration: 'Διάρκεια Επεισοδίου',
			seriesDuration: 'Διάρκεια Σειράς',
			intensity: 'Ένταση',
			awards: 'Βραβεία',
			criticAudience: 'Κριτικοί vs Κοινό',
			basedOn: 'Βασισμένο σε',
			discovery: 'Προτίμηση Ανακάλυψης',
			// Placeholders
			selectPacing: 'Επιλέξτε ρυθμό',
			selectEndingType: 'Επιλέξτε τύπο τέλους',
			selectDuration: 'Επιλέξτε διάρκεια',
			selectEpisodeDuration: 'Επιλέξτε διάρκεια επεισοδίου',
			selectSeriesDuration: 'Επιλέξτε διάρκεια σειράς',
			selectIntensity: 'Επιλέξτε ένταση',
			selectAwards: 'Επιλέξτε προτίμηση βραβείων',
			selectCriticAudience: 'Επιλέξτε προτίμηση',
			selectDiscovery: 'Επιλέξτε προτίμηση ανακάλυψης',
			// Option translations
			countryOptions: {
				US: 'Αμερικανικό',
				EU: 'Ευρωπαϊκό',
				OTHER: 'Άλλο'
			},
			basedOnOptions: {
				BOOK: 'Βιβλίο/Κόμικ',
				TRUE_STORY: 'Αληθινή Ιστορία',
				ORIGINAL: 'Πρωτότυπο Σενάριο',
				GAME: 'Video Game',
				PLAY: 'Θεατρικό',
				REMAKE: 'Remake'
			},
			pacingOptions: {
				SLOW: 'Αργός (Slow Burn)',
				MEDIUM: 'Μέτριος',
				FAST: 'Γρήγορος',
				ACTION: 'Καταιγιστικός'
			},
			endingTypeOptions: {
				HAPPY: 'Χαρούμενο',
				SAD: 'Λυπηρό/Τραγικό',
				OPEN: 'Αμφίσημο/Ανοιχτό',
				TWIST: 'Ανατροπή',
				BITTERSWEET: 'Γλυκόπικρο',
				CLIFFHANGER: 'Cliffhanger'
			},
			durationOptions: {
				SHORT: 'Μικρή (< 90λ)',
				MEDIUM: 'Κανονική (90-120λ)',
				LONG: 'Μεγάλη (> 120λ)',
				EPIC: 'Έπος (> 150λ)'
			},
			episodeDurationOptions: {
				SHORT: 'Μικρά (< 30λ)',
				MEDIUM: 'Κανονικά (30-60λ)',
				LONG: 'Μεγάλα (> 60λ)'
			},
			seriesDurationOptions: {
				MINI: 'Μίνι Σειρά',
				SHORT: '1-3 Σεζόν',
				MEDIUM: '4-6 Σεζόν',
				LONG: '7+ Σεζόν'
			},
			intensityOptions: {
				LIGHT: 'Χαλαρό',
				MODERATE: 'Μέτριο',
				HIGH: 'Έντονο',
				EXTREME: 'Ακραίο'
			},
			awardsOptions: {
				OSCARS: 'Οσκαρικά',
				FESTIVAL: 'Φεστιβαλικά (Cannes, Venice)',
				POPULAR: 'Δημοφιλή',
				HIDDEN_GEMS: 'Κρυμμένα Διαμάντια'
			},
			criticAudienceOptions: {
				CRITICS: 'Αγαπημένα Κριτικών',
				AUDIENCE: 'Αγαπημένα Κοινού',
				BOTH: 'Αγαπημένα Όλων',
				DIVISIVE: 'Διχασμένα'
			},
			discoveryOptions: {
				POPULAR: 'Δημοφιλή Τώρα',
				CLASSICS: 'Κλασικά',
				UNDERRATED: 'Υποτιμημένα',
				NEW_RELEASES: 'Νέες Κυκλοφορίες'
			},
			includeHistory: 'Συμπερίληψη ιστορικού θέασης'
		},
		en: {
			freeTextLabel: 'Describe what you want to watch',
			freeTextPlaceholder: 'e.g., a mind-bending sci-fi movie...',
			genres: 'Genres',
			subGenres: 'Sub-genres',
			contentType: 'Content Type',
			contentTypeOptions: {
				both: 'Movies and Series',
				moviesOnly: 'Movies Only',
				seriesOnly: 'Series Only'
			},
			countries: 'Countries',
			period: 'Period',
			periodPlaceholder: 'Select period',
			moodTone: 'Mood/Tone',
			showAdvanced: 'Show Advanced Filters',
			hideAdvanced: 'Hide Advanced Filters',
			copyPrompt: 'Copy Prompt',
			newSearch: 'New Search',
			getRecommendations: 'Get Recommendations',
			generating: 'Generating...',
			none: '-- None --',
			// Advanced filter labels
			pacing: 'Pacing',
			endingType: 'Ending Type',
			duration: 'Movie Duration',
			episodeDuration: 'Episode Duration',
			seriesDuration: 'Series Duration',
			intensity: 'Intensity',
			awards: 'Awards',
			criticAudience: 'Critic vs Audience',
			basedOn: 'Based On',
			discovery: 'Discovery Preference',
			// Placeholders
			selectPacing: 'Select pacing',
			selectEndingType: 'Select ending type',
			selectDuration: 'Select duration',
			selectEpisodeDuration: 'Select episode duration',
			selectSeriesDuration: 'Select series duration',
			selectIntensity: 'Select intensity',
			selectAwards: 'Select awards preference',
			selectCriticAudience: 'Select preference',
			selectDiscovery: 'Select discovery preference',
			// Option translations
			countryOptions: {
				US: 'American',
				EU: 'European',
				OTHER: 'Other'
			},
			basedOnOptions: {
				BOOK: 'Book/Comic',
				TRUE_STORY: 'True Story',
				ORIGINAL: 'Original Screenplay',
				GAME: 'Video Game',
				PLAY: 'Play',
				REMAKE: 'Remake'
			},
			pacingOptions: {
				SLOW: 'Slow Burn',
				MEDIUM: 'Medium',
				FAST: 'Fast Paced',
				ACTION: 'Non-stop Action'
			},
			endingTypeOptions: {
				HAPPY: 'Happy Ending',
				SAD: 'Sad/Tragic',
				OPEN: 'Ambiguous/Open',
				TWIST: 'Twist Ending',
				BITTERSWEET: 'Bittersweet',
				CLIFFHANGER: 'Cliffhanger'
			},
			durationOptions: {
				SHORT: 'Short (< 90m)',
				MEDIUM: 'Standard (90-120m)',
				LONG: 'Long (> 120m)',
				EPIC: 'Epic (> 150m)'
			},
			episodeDurationOptions: {
				SHORT: 'Short (< 30m)',
				MEDIUM: 'Standard (30-60m)',
				LONG: 'Long (> 60m)'
			},
			seriesDurationOptions: {
				MINI: 'Miniseries',
				SHORT: '1-3 Seasons',
				MEDIUM: '4-6 Seasons',
				LONG: '7+ Seasons'
			},
			intensityOptions: {
				LIGHT: 'Light',
				MODERATE: 'Moderate',
				HIGH: 'Intense',
				EXTREME: 'Extreme'
			},
			awardsOptions: {
				OSCARS: 'Oscar Winners',
				FESTIVAL: 'Festival Darlings',
				POPULAR: 'Popular',
				HIDDEN_GEMS: 'Hidden Gems'
			},
			criticAudienceOptions: {
				CRITICS: "Critics' Favorites",
				AUDIENCE: 'Audience Favorites',
				BOTH: 'Universally Acclaimed',
				DIVISIVE: 'Divisive'
			},
			discoveryOptions: {
				POPULAR: 'Trending Now',
				CLASSICS: 'Classics',
				UNDERRATED: 'Underrated',
				NEW_RELEASES: 'New Releases'
			},
			includeHistory: 'Include viewing history'
		}
	};

	const tr = $derived(t[settings.lang as Language]);

	interface Props {
		initialPreferences?: MoviePreferences | null;
		onSubmit: (prefs: MoviePreferences) => void;
		isLoading: boolean;
		onReset?: () => void;
	}

	let { initialPreferences, onSubmit, isLoading, onReset }: Props = $props();

	// Default preferences
	const defaultPrefs: MoviePreferences = {
		freeText: '',
		includeHistory: true,
		genres: [],
		countries: [],
		period: '',
		contentType: 'Και Ταινίες και Σειρές',
		mood: [],
		pacing: '',
		endingType: '',
		duration: '',
		episodeDuration: '',
		seriesDuration: '',
		intensity: '',
		awards: '',
		criticAudience: '',
		basedOn: [],
		discovery: '',
		genreKeywords: {}
	};

	let prefs: MoviePreferences = $state(initialPreferences || { ...defaultPrefs });
	let lockedFilters = $state<LockedFilters>({});
	let showAdvanced = $state(false);

	// Load locked filters and values from localStorage on mount
	onMount(() => {
		if (browser) {
			lockedFilters = getLockedFilters();
			const savedValues = getLockedFilterValues();

			// Apply saved values for locked filters
			const newPrefs = { ...prefs };
			let hasChanges = false;

			for (const key in lockedFilters) {
				if (lockedFilters[key] && savedValues[key as keyof MoviePreferences] !== undefined) {
					// @ts-ignore - dynamic assignment
					newPrefs[key] = savedValues[key as keyof MoviePreferences];
					hasChanges = true;
				}
			}

			if (hasChanges) {
				prefs = newPrefs;
			}
		}
	});

	// Save locked filter values whenever prefs or locks change
	$effect(() => {
		if (browser && Object.keys(lockedFilters).length > 0) {
			const valuesToSave: Partial<MoviePreferences> = {};
			for (const key in lockedFilters) {
				if (lockedFilters[key]) {
					// @ts-ignore - dynamic access
					valuesToSave[key] = prefs[key as keyof MoviePreferences];
				}
			}
			saveLockedFilterValues(valuesToSave);
		}
	});

	// Listen for reset signal - use untrack to prevent prefs from being tracked as a dependency
	$effect(() => {
		const signal = $resetSignal;
		if (signal > 0) {
			untrack(() => {
				resetForm();
			});
		}
	});

	function submit(event: SubmitEvent) {
		event.preventDefault();
		onSubmit(prefs);
	}

	function resetForm() {
		// Reset only non-locked filters
		const newPrefs = { ...prefs };

		// Check each filter and reset if not locked
		if (!lockedFilters.freeText) newPrefs.freeText = '';
		if (!lockedFilters.genres) {
			newPrefs.genres = [];
			newPrefs.genreKeywords = {};
		}
		if (!lockedFilters.countries) newPrefs.countries = [];
		if (!lockedFilters.period) newPrefs.period = '';
		if (!lockedFilters.contentType) newPrefs.contentType = 'Και Ταινίες και Σειρές';
		if (!lockedFilters.mood) newPrefs.mood = [];
		if (!lockedFilters.pacing) newPrefs.pacing = '';
		if (!lockedFilters.endingType) newPrefs.endingType = '';
		if (!lockedFilters.duration) newPrefs.duration = '';
		if (!lockedFilters.episodeDuration) newPrefs.episodeDuration = '';
		if (!lockedFilters.seriesDuration) newPrefs.seriesDuration = '';
		if (!lockedFilters.intensity) newPrefs.intensity = '';
		if (!lockedFilters.awards) newPrefs.awards = '';
		if (!lockedFilters.criticAudience) newPrefs.criticAudience = '';
		if (!lockedFilters.basedOn) newPrefs.basedOn = [];
		if (!lockedFilters.discovery) newPrefs.discovery = '';

		prefs = newPrefs;

		// Call parent reset if provided
		if (onReset) {
			onReset();
		}
	}

	// Expose resetForm to parent via component instance
	export { resetForm };

	async function copyPrompt() {
		try {
			const lang = (settings.lang === 'en' ? 'en' : 'el') as 'el' | 'en';
			const promptText = generatePromptText(prefs, lang);
			await navigator.clipboard.writeText(promptText);
			const successMsg =
				lang === 'el' ? 'Το prompt αντιγράφηκε στο clipboard!' : 'Prompt copied to clipboard!';
			toast.success(successMsg, {
				duration: 3000
			});
		} catch (err) {
			console.error('Failed to copy prompt:', err);
			const lang = (settings.lang === 'en' ? 'en' : 'el') as 'el' | 'en';
			const errorMsg = lang === 'el' ? 'Αποτυχία αντιγραφής prompt' : 'Failed to copy prompt';
			toast.error(errorMsg, {
				duration: 3000
			});
		}
	}

	function toggleLock(filterKey: string) {
		lockedFilters[filterKey] = !lockedFilters[filterKey];
		lockedFilters = { ...lockedFilters }; // Trigger reactivity
		saveLockedFilters(lockedFilters);
	}

	// Effect to sync genre keywords
	$effect(() => {
		let needsUpdate = false;
		const newKeywords = { ...prefs.genreKeywords };

		// Add keywords for newly selected genres
		for (const genre of prefs.genres) {
			if (genreKeywords[genre] && !newKeywords[genre]) {
				newKeywords[genre] = [];
				needsUpdate = true;
			}
		}

		// Clean up keywords for deselected genres
		for (const genre in newKeywords) {
			if (!prefs.genres.includes(genre)) {
				delete newKeywords[genre];
				needsUpdate = true;
			}
		}

		if (needsUpdate) {
			prefs.genreKeywords = newKeywords;
		}
	});

	const allGenres = [
		'Action',
		'Thriller',
		'Horror',
		'Mystery',
		'Sci-Fi',
		'Fantasy',
		'Comedy',
		'Drama',
		'Crime',
		'Romance',
		'War',
		'Western',
		'Animation',
		'Documentary',
		'Adventure',
		'Biography',
		'History',
		'Musical',
		'Sport'
	];

	const genreKeywords: Record<string, string[]> = {
		Action: [
			'High Octane',
			'Martial Arts',
			'Car Chase Focus',
			'Espionage',
			'Revenge Plot',
			'Heist',
			'Political Intrigue',
			'Survival'
		],
		Thriller: [
			'High Octane',
			'Espionage',
			'Revenge Plot',
			'Heist',
			'Political Intrigue',
			'Survival',
			'Psychological Tension'
		],
		Horror: [
			'Supernatural',
			'Slasher/Gore',
			'Psychological Horror',
			'Found Footage',
			'Paranormal/Occult',
			'Isolation Horror',
			'Body Horror'
		],
		Mystery: [
			'Whodunit',
			'Psychological Focus',
			'Paranormal/Occult',
			'Detective Story',
			'Conspiracy'
		],
		'Sci-Fi': [
			'Cyberpunk',
			'Space Opera',
			'Time Travel',
			'Artificial Intelligence',
			'Post-Apocalyptic',
			'Dystopia',
			'Hard Sci-Fi',
			'Alien Invasion'
		],
		Fantasy: [
			'Magic System Focus',
			'Epic Fantasy',
			'Urban Fantasy',
			'Dark Fantasy',
			'Mythology',
			'Sword & Sorcery'
		],
		Comedy: [
			'Dark Comedy/Satire',
			'Slapstick',
			'Buddy Comedy',
			'Absurdist/Surreal',
			'Parody/Spoof',
			'Road Trip',
			'Cringe Comedy',
			'Romantic Comedy'
		],
		Drama: [
			'Courtroom Drama',
			'Social Commentary',
			'Psychological Focus',
			'Family Drama',
			'Character Study',
			'Melodrama',
			'Coming of Age'
		],
		Crime: [
			'Gangster/Mafia',
			'Neo-Noir',
			'True Story Based',
			'Detective Story',
			'Heist',
			'Police Procedural',
			'Organized Crime'
		],
		Romance: [
			'Erotic Tension',
			'Unconventional Couple',
			'Tragic Ending',
			'Forbidden Love',
			'Second Chance Romance',
			'Love Triangle',
			'Historical Romance',
			'Romantic Comedy'
		],
		War: [
			'Historical Battle',
			'Survival',
			'Anti-War Message',
			'Military Strategy',
			'Behind Enemy Lines',
			'Heroism Focus'
		],
		Western: [
			'Classic Western',
			'Spaghetti Western',
			'Revisionist Western',
			'Revenge Plot',
			'Outlaw Story'
		],
		Animation: [
			'Family-Friendly',
			'Adult Animation',
			'Stop Motion',
			'Anime Style',
			'Musical Elements'
		],
		Documentary: [
			'True Crime',
			'Nature/Wildlife',
			'Historical',
			'Social Issues',
			'Biography',
			'Investigative'
		]
	};

	const allCountries = ['US', 'EU', 'OTHER'];

	const allMoods = [
		'Ελαφρύ (Light)',
		'Σοβαρό (Serious)',
		'Dark',
		'Uplifting',
		'Cynical',
		'Hopeful',
		'Depressing'
	];

	const allBasedOn = ['BOOK', 'TRUE_STORY', 'ORIGINAL', 'GAME', 'PLAY', 'REMAKE'];

	const allPacing = ['SLOW', 'MEDIUM', 'FAST', 'ACTION'];
	const allEndingTypes = ['HAPPY', 'SAD', 'OPEN', 'TWIST', 'BITTERSWEET', 'CLIFFHANGER'];
	const allDurations = ['SHORT', 'MEDIUM', 'LONG', 'EPIC'];
	const allEpisodeDurations = ['SHORT', 'MEDIUM', 'LONG'];
	const allSeriesDurations = ['MINI', 'SHORT', 'MEDIUM', 'LONG'];
	const allIntensities = ['LIGHT', 'MODERATE', 'HIGH', 'EXTREME'];
	const allAwards = ['OSCARS', 'FESTIVAL', 'POPULAR', 'HIDDEN_GEMS'];
	const allCriticAudience = ['CRITICS', 'AUDIENCE', 'BOTH', 'DIVISIVE'];
	const allDiscovery = ['POPULAR', 'CLASSICS', 'UNDERRATED', 'NEW_RELEASES'];
</script>

<form onsubmit={submit} class="space-y-6">
	<div>
		<div class="flex items-center justify-between mb-2">
			<label for="freeText" class="block text-sm font-medium text-purple-200">
				{tr.freeTextLabel}
			</label>
			<button
				type="button"
				onclick={() => toggleLock('freeText')}
				class="p-1 rounded hover:bg-purple-500/20 transition-colors"
				aria-label="Toggle lock"
			>
				{#if lockedFilters.freeText}
					<Lock class="w-4 h-4 text-purple-400" />
				{:else}
					<Unlock class="w-4 h-4 text-purple-300/50" />
				{/if}
			</button>
		</div>
		<textarea
			id="freeText"
			bind:value={prefs.freeText}
			placeholder={tr.freeTextPlaceholder}
			class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none overflow-hidden min-h-[2.5rem] max-h-[15rem]"
			rows="1"
			onkeydown={(e) => {
				// Auto-grow textarea
				const target = e.currentTarget;
				setTimeout(() => {
					target.style.height = 'auto';
					target.style.height = Math.min(target.scrollHeight, 240) + 'px';
				}, 0);
			}}
		></textarea>
	</div>

	<div>
		<div class="flex items-center justify-between mb-2">
			<label for="genres" class="block text-sm font-medium text-purple-200">{tr.genres}</label>
			<button
				type="button"
				onclick={() => toggleLock('genres')}
				class="p-1 rounded hover:bg-purple-500/20 transition-colors"
				aria-label="Toggle lock"
			>
				{#if lockedFilters.genres}
					<Lock class="w-4 h-4 text-purple-400" />
				{:else}
					<Unlock class="w-4 h-4 text-purple-300/50" />
				{/if}
			</button>
		</div>
		<div class="space-y-3">
			<ToggleGroup.Root type="multiple" bind:value={prefs.genres} class="flex flex-wrap gap-2">
				{#each allGenres as genre (genre)}
					<ToggleGroup.Item
						value={genre}
						class="border border-purple-400/30 text-purple-200 hover:bg-purple-500/20 data-[state=on]:bg-purple-600 data-[state=on]:text-white data-[state=on]:border-purple-500"
					>
						{genre}
					</ToggleGroup.Item>
				{/each}
			</ToggleGroup.Root>

			{#each prefs.genres as genre (genre)}
				{#if genreKeywords[genre] && prefs.genreKeywords[genre]}
					<div class="ml-4 p-3 bg-white/5 rounded-lg border border-white/10">
						<p class="block text-sm font-medium text-purple-200 mb-2">{genre} {tr.subGenres}:</p>
						<ToggleGroup.Root
							type="multiple"
							bind:value={prefs.genreKeywords[genre]}
							class="flex flex-wrap gap-2"
						>
							{#each genreKeywords[genre] as keyword (keyword)}
								<ToggleGroup.Item
									value={keyword}
									size="sm"
									class="border border-purple-400/20 text-purple-300 hover:bg-purple-500/20 data-[state=on]:bg-purple-500 data-[state=on]:text-white data-[state=on]:border-purple-400"
								>
									{keyword}
								</ToggleGroup.Item>
							{/each}
						</ToggleGroup.Root>
					</div>
				{/if}
			{/each}
		</div>
	</div>

	<div>
		<div class="flex items-center justify-between mb-2">
			<label for="contentType" class="block text-sm font-medium text-purple-200">
				{tr.contentType}
			</label>
			<button
				type="button"
				onclick={() => toggleLock('contentType')}
				class="p-1 rounded hover:bg-purple-500/20 transition-colors"
				aria-label="Toggle lock"
			>
				{#if lockedFilters.contentType}
					<Lock class="w-4 h-4 text-purple-400" />
				{:else}
					<Unlock class="w-4 h-4 text-purple-300/50" />
				{/if}
			</button>
		</div>
		<Select.Root type="single" bind:value={prefs.contentType}>
			<Select.Trigger class="w-full">
				{prefs.contentType
					? tr.contentTypeOptions[
							prefs.contentType === 'BOTH'
								? 'both'
								: prefs.contentType === 'MOVIES'
									? 'moviesOnly'
									: 'seriesOnly'
						]
					: 'Select content type'}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="BOTH">{tr.contentTypeOptions.both}</Select.Item>
				<Select.Item value="MOVIES">{tr.contentTypeOptions.moviesOnly}</Select.Item>
				<Select.Item value="SERIES">{tr.contentTypeOptions.seriesOnly}</Select.Item>
			</Select.Content>
		</Select.Root>
	</div>

	<div>
		<div class="flex items-center justify-between mb-2">
			<label for="countries" class="block text-sm font-medium text-purple-200">{tr.countries}</label
			>
			<button
				type="button"
				onclick={() => toggleLock('countries')}
				class="p-1 rounded hover:bg-purple-500/20 transition-colors"
				aria-label="Toggle lock"
			>
				{#if lockedFilters.countries}
					<Lock class="w-4 h-4 text-purple-400" />
				{:else}
					<Unlock class="w-4 h-4 text-purple-300/50" />
				{/if}
			</button>
		</div>
		<ToggleGroup.Root type="multiple" bind:value={prefs.countries} class="flex flex-wrap gap-2">
			{#each allCountries as country (country)}
				<ToggleGroup.Item
					value={country}
					class="border border-purple-400/30 text-purple-200 hover:bg-purple-500/20 data-[state=on]:bg-purple-600 data-[state=on]:text-white data-[state=on]:border-purple-500"
				>
					{tr.countryOptions[country]}
				</ToggleGroup.Item>
			{/each}
		</ToggleGroup.Root>
	</div>

	<!-- Advanced Filters Collapsible -->
	<Collapsible.Root bind:open={showAdvanced} class="space-y-4">
		<Collapsible.Trigger
			class="flex w-full items-center justify-between rounded-md border border-purple-400/30 bg-transparent px-4 py-2 text-sm font-medium text-purple-200 hover:bg-purple-500/20 transition-colors"
		>
			{showAdvanced ? tr.hideAdvanced : tr.showAdvanced}
			{#if showAdvanced}
				<ChevronUp class="h-4 w-4 ml-2" />
			{:else}
				<ChevronDown class="h-4 w-4 ml-2" />
			{/if}
		</Collapsible.Trigger>
		<Collapsible.Content class="space-y-6">
			<div>
				<div class="flex items-center justify-between mb-2">
					<label for="pacing" class="block text-sm font-medium text-purple-200">{tr.pacing}</label>
					<button
						type="button"
						onclick={() => toggleLock('pacing')}
						class="p-1 rounded hover:bg-purple-500/20 transition-colors"
						aria-label="Toggle lock"
					>
						{#if lockedFilters.pacing}
							<Lock class="w-4 h-4 text-purple-400" />
						{:else}
							<Unlock class="w-4 h-4 text-purple-300/50" />
						{/if}
					</button>
				</div>
				<Select.Root type="single" bind:value={prefs.pacing}>
					<Select.Trigger class="w-full">
						{tr.pacingOptions[prefs.pacing] || tr.selectPacing}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">{tr.none}</Select.Item>
						{#each allPacing as item}
							<Select.Item value={item}>{tr.pacingOptions[item]}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div>
				<div class="flex items-center justify-between mb-2">
					<label for="endingType" class="block text-sm font-medium text-purple-200"
						>{tr.endingType}</label
					>
					<button
						type="button"
						onclick={() => toggleLock('endingType')}
						class="p-1 rounded hover:bg-purple-500/20 transition-colors"
						aria-label="Toggle lock"
					>
						{#if lockedFilters.endingType}
							<Lock class="w-4 h-4 text-purple-400" />
						{:else}
							<Unlock class="w-4 h-4 text-purple-300/50" />
						{/if}
					</button>
				</div>
				<Select.Root type="single" bind:value={prefs.endingType}>
					<Select.Trigger class="w-full">
						{tr.endingTypeOptions[prefs.endingType] || tr.selectEndingType}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">{tr.none}</Select.Item>
						{#each allEndingTypes as item}
							<Select.Item value={item}>{tr.endingTypeOptions[item]}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			{#if prefs.contentType !== 'SERIES'}
				<div>
					<div class="flex items-center justify-between mb-2">
						<label for="duration" class="block text-sm font-medium text-purple-200"
							>{tr.duration}</label
						>
						<button
							type="button"
							onclick={() => toggleLock('duration')}
							class="p-1 rounded hover:bg-purple-500/20 transition-colors"
							aria-label="Toggle lock"
						>
							{#if lockedFilters.duration}
								<Lock class="w-4 h-4 text-purple-400" />
							{:else}
								<Unlock class="w-4 h-4 text-purple-300/50" />
							{/if}
						</button>
					</div>
					<Select.Root type="single" bind:value={prefs.duration}>
						<Select.Trigger class="w-full">
							{tr.durationOptions[prefs.duration] || tr.selectDuration}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">{tr.none}</Select.Item>
							{#each allDurations as item}
								<Select.Item value={item}>{tr.durationOptions[item]}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/if}

			{#if prefs.contentType !== 'MOVIES'}
				<div>
					<div class="flex items-center justify-between mb-2">
						<label for="episodeDuration" class="block text-sm font-medium text-purple-200"
							>{tr.episodeDuration}</label
						>
						<button
							type="button"
							onclick={() => toggleLock('episodeDuration')}
							class="p-1 rounded hover:bg-purple-500/20 transition-colors"
							aria-label="Toggle lock"
						>
							{#if lockedFilters.episodeDuration}
								<Lock class="w-4 h-4 text-purple-400" />
							{:else}
								<Unlock class="w-4 h-4 text-purple-300/50" />
							{/if}
						</button>
					</div>
					<Select.Root type="single" bind:value={prefs.episodeDuration}>
						<Select.Trigger class="w-full">
							{tr.episodeDurationOptions[prefs.episodeDuration] || tr.selectEpisodeDuration}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">{tr.none}</Select.Item>
							{#each allEpisodeDurations as item}
								<Select.Item value={item}>{tr.episodeDurationOptions[item]}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div>
					<div class="flex items-center justify-between mb-2">
						<label for="seriesDuration" class="block text-sm font-medium text-purple-200"
							>{tr.seriesDuration}</label
						>
						<button
							type="button"
							onclick={() => toggleLock('seriesDuration')}
							class="p-1 rounded hover:bg-purple-500/20 transition-colors"
							aria-label="Toggle lock"
						>
							{#if lockedFilters.seriesDuration}
								<Lock class="w-4 h-4 text-purple-400" />
							{:else}
								<Unlock class="w-4 h-4 text-purple-300/50" />
							{/if}
						</button>
					</div>
					<Select.Root type="single" bind:value={prefs.seriesDuration}>
						<Select.Trigger class="w-full">
							{tr.seriesDurationOptions[prefs.seriesDuration] || tr.selectSeriesDuration}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">{tr.none}</Select.Item>
							{#each allSeriesDurations as item}
								<Select.Item value={item}>{tr.seriesDurationOptions[item]}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			{/if}

			<div>
				<div class="flex items-center justify-between mb-2">
					<label for="intensity" class="block text-sm font-medium text-purple-200"
						>{tr.intensity}</label
					>
					<button
						type="button"
						onclick={() => toggleLock('intensity')}
						class="p-1 rounded hover:bg-purple-500/20 transition-colors"
						aria-label="Toggle lock"
					>
						{#if lockedFilters.intensity}
							<Lock class="w-4 h-4 text-purple-400" />
						{:else}
							<Unlock class="w-4 h-4 text-purple-300/50" />
						{/if}
					</button>
				</div>
				<Select.Root type="single" bind:value={prefs.intensity}>
					<Select.Trigger class="w-full">
						{tr.intensityOptions[prefs.intensity] || tr.selectIntensity}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">{tr.none}</Select.Item>
						{#each allIntensities as item}
							<Select.Item value={item}>{tr.intensityOptions[item]}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div>
				<div class="flex items-center justify-between mb-2">
					<label for="awards" class="block text-sm font-medium text-purple-200">{tr.awards}</label>
					<button
						type="button"
						onclick={() => toggleLock('awards')}
						class="p-1 rounded hover:bg-purple-500/20 transition-colors"
						aria-label="Toggle lock"
					>
						{#if lockedFilters.awards}
							<Lock class="w-4 h-4 text-purple-400" />
						{:else}
							<Unlock class="w-4 h-4 text-purple-300/50" />
						{/if}
					</button>
				</div>
				<Select.Root type="single" bind:value={prefs.awards}>
					<Select.Trigger class="w-full">
						{tr.awardsOptions[prefs.awards] || tr.selectAwards}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">{tr.none}</Select.Item>
						{#each allAwards as item}
							<Select.Item value={item}>{tr.awardsOptions[item]}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div>
				<div class="flex items-center justify-between mb-2">
					<label for="criticAudience" class="block text-sm font-medium text-purple-200"
						>{tr.criticAudience}</label
					>
					<button
						type="button"
						onclick={() => toggleLock('criticAudience')}
						class="p-1 rounded hover:bg-purple-500/20 transition-colors"
						aria-label="Toggle lock"
					>
						{#if lockedFilters.criticAudience}
							<Lock class="w-4 h-4 text-purple-400" />
						{:else}
							<Unlock class="w-4 h-4 text-purple-300/50" />
						{/if}
					</button>
				</div>
				<Select.Root type="single" bind:value={prefs.criticAudience}>
					<Select.Trigger class="w-full">
						{tr.criticAudienceOptions[prefs.criticAudience] || tr.selectCriticAudience}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">{tr.none}</Select.Item>
						{#each allCriticAudience as item}
							<Select.Item value={item}>{tr.criticAudienceOptions[item]}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<div>
				<div class="flex items-center justify-between mb-2">
					<label for="basedOn" class="block text-sm font-medium text-purple-200">{tr.basedOn}</label
					>
					<button
						type="button"
						onclick={() => toggleLock('basedOn')}
						class="p-1 rounded hover:bg-purple-500/20 transition-colors"
						aria-label="Toggle lock"
					>
						{#if lockedFilters.basedOn}
							<Lock class="w-4 h-4 text-purple-400" />
						{:else}
							<Unlock class="w-4 h-4 text-purple-300/50" />
						{/if}
					</button>
				</div>
				<ToggleGroup.Root type="multiple" bind:value={prefs.basedOn} class="flex flex-wrap gap-2">
					{#each allBasedOn as item (item)}
						<ToggleGroup.Item
							value={item}
							class="border border-purple-400/30 text-purple-200 hover:bg-purple-500/20 data-[state=on]:bg-purple-600 data-[state=on]:text-white data-[state=on]:border-purple-500"
						>
							{tr.basedOnOptions[item]}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</div>

			<div>
				<div class="flex items-center justify-between mb-2">
					<label for="discovery" class="block text-sm font-medium text-purple-200"
						>{tr.discovery}</label
					>
					<button
						type="button"
						onclick={() => toggleLock('discovery')}
						class="p-1 rounded hover:bg-purple-500/20 transition-colors"
						aria-label="Toggle lock"
					>
						{#if lockedFilters.discovery}
							<Lock class="w-4 h-4 text-purple-400" />
						{:else}
							<Unlock class="w-4 h-4 text-purple-300/50" />
						{/if}
					</button>
				</div>
				<Select.Root type="single" bind:value={prefs.discovery}>
					<Select.Trigger class="w-full">
						{tr.discoveryOptions[prefs.discovery] || tr.selectDiscovery}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="">{tr.none}</Select.Item>
						{#each allDiscovery as item}
							<Select.Item value={item}>{tr.discoveryOptions[item]}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</Collapsible.Content>
	</Collapsible.Root>

	<Button
		type="button"
		onclick={copyPrompt}
		variant="outline"
		class="w-full border-purple-400/50 text-purple-200 hover:bg-purple-500/20"
	>
		<Copy class="w-4 h-4 mr-2" />
		{tr.copyPrompt}
	</Button>

	<div class="flex items-center space-x-2 py-2">
		<input
			type="checkbox"
			id="includeHistory"
			bind:checked={prefs.includeHistory}
			class="w-4 h-4 rounded border-purple-400/50 bg-black/20 text-purple-500 focus:ring-purple-500/50"
		/>
		<label
			for="includeHistory"
			class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-purple-200"
		>
			{tr.includeHistory}
		</label>
	</div>

	<Button type="submit" class="w-full" disabled={isLoading}>
		{#if isLoading}
			<span class="animate-spin mr-2">🌀</span>
			{tr.generating}
		{:else}
			{tr.getRecommendations}
		{/if}
	</Button>
</form>
