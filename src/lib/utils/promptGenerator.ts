import type { MoviePreferences } from '$lib/types/discover';
import { getMovieRatings, getWatchlist } from './localStorage';
import { getViewingHistory, getNotInterested } from '$lib/browser-storage';

type Language = 'el' | 'en';

// Bilingual labels for prompt generation
const labels: Record<Language, {
	wantRecommendations: string;
	movieRecommendations: string;
	seriesRecommendations: string;
	bothRecommendations: string;
	myPreferences: string;
	genres: string;
	genreSpecialization: string;
	contentType: string;
	country: string;
	period: string;
	mood: string;
	pacing: string;
	endingType: string;
	movieDuration: string;
	episodeDuration: string;
	seriesDuration: string;
	intensity: string;
	awards: string;
	reviews: string;
	basedOn: string;
	discovery: string;
	history: string;
	watched: string;
	wantToWatch: string;
	dontWant: string;
	pleaseRecommend: string;
	movies: string;
	series: string;
	moviesOrSeries: string;
}> = {
	el: {
		wantRecommendations: 'Θέλω',
		movieRecommendations: 'προτάσεις ταινιών',
		seriesRecommendations: 'προτάσεις σειρών',
		bothRecommendations: 'προτάσεις ταινιών και σειρών',
		myPreferences: 'Προτιμήσεις μου',
		genres: 'Είδη',
		genreSpecialization: 'Εξειδίκευση ειδών',
		contentType: 'Τύπος περιεχομένου',
		country: 'Χώρα Παραγωγής',
		period: 'Χρονολογία',
		mood: 'Mood/Tone',
		pacing: 'Ρυθμός',
		endingType: 'Τύπος τέλους',
		movieDuration: 'Διάρκεια ταινίας',
		episodeDuration: 'Διάρκεια επεισοδίου',
		seriesDuration: 'Διάρκεια σειράς',
		intensity: 'Ένταση περιεχομένου',
		awards: 'Βραβεία',
		reviews: 'Κριτικές',
		basedOn: 'Βασισμένο σε',
		discovery: 'Προτίμηση ανακάλυψης',
		history: 'ΙΣΤΟΡΙΚΟ',
		watched: 'Έχω δει',
		wantToWatch: 'Θέλω να δω',
		dontWant: 'ΔΕΝ θέλω να δω',
		pleaseRecommend: 'Παρακαλώ πρότεινε μου 10-15',
		movies: 'ταινίες',
		series: 'σειρές',
		moviesOrSeries: 'ταινίες/σειρές'
	},
	en: {
		wantRecommendations: 'I want',
		movieRecommendations: 'movie recommendations',
		seriesRecommendations: 'series recommendations',
		bothRecommendations: 'movie and series recommendations',
		myPreferences: 'My preferences',
		genres: 'Genres',
		genreSpecialization: 'Genre specialization',
		contentType: 'Content type',
		country: 'Country of origin',
		period: 'Time period',
		mood: 'Mood/Tone',
		pacing: 'Pacing',
		endingType: 'Ending type',
		movieDuration: 'Movie duration',
		episodeDuration: 'Episode duration',
		seriesDuration: 'Series duration',
		intensity: 'Content intensity',
		awards: 'Awards',
		reviews: 'Reviews',
		basedOn: 'Based on',
		discovery: 'Discovery preference',
		history: 'HISTORY',
		watched: 'Already watched',
		wantToWatch: 'Want to watch',
		dontWant: 'DON\'T want to watch',
		pleaseRecommend: 'Please recommend 10-15',
		movies: 'movies',
		series: 'series',
		moviesOrSeries: 'movies/series'
	}
};

const optionMaps: Record<Language, {
	countries: Record<string, string>;
	basedOn: Record<string, string>;
	pacing: Record<string, string>;
	endingType: Record<string, string>;
	duration: Record<string, string>;
	episodeDuration: Record<string, string>;
	seriesDuration: Record<string, string>;
	intensity: Record<string, string>;
	awards: Record<string, string>;
	criticAudience: Record<string, string>;
	discovery: Record<string, string>;
}> = {
	el: {
		countries: { US: 'Αμερικανικό', EU: 'Ευρωπαϊκό', OTHER: 'Άλλο' },
		basedOn: {
			BOOK: 'Βιβλίο/Κόμικ',
			TRUE_STORY: 'Αληθινή Ιστορία',
			ORIGINAL: 'Πρωτότυπο Σενάριο',
			GAME: 'Video Game',
			PLAY: 'Θεατρικό',
			REMAKE: 'Remake'
		},
		pacing: {
			SLOW: 'Αργός (Slow Burn)',
			MEDIUM: 'Μέτριος',
			FAST: 'Γρήγορος',
			ACTION: 'Καταιγιστικός'
		},
		endingType: {
			HAPPY: 'Χαρούμενο',
			SAD: 'Λυπηρό/Τραγικό',
			OPEN: 'Αμφίσημο/Ανοιχτό',
			TWIST: 'Ανατροπή',
			BITTERSWEET: 'Γλυκόπικρο',
			CLIFFHANGER: 'Cliffhanger'
		},
		duration: {
			SHORT: 'Μικρή (< 90λ)',
			MEDIUM: 'Κανονική (90-120λ)',
			LONG: 'Μεγάλη (> 120λ)',
			EPIC: 'Έπος (> 150λ)'
		},
		episodeDuration: {
			SHORT: 'Μικρά (< 30λ)',
			MEDIUM: 'Κανονικά (30-60λ)',
			LONG: 'Μεγάλα (> 60λ)'
		},
		seriesDuration: {
			MINI: 'Μίνι Σειρά',
			SHORT: '1-3 Σεζόν',
			MEDIUM: '4-6 Σεζόν',
			LONG: '7+ Σεζόν'
		},
		intensity: {
			LIGHT: 'Χαλαρό',
			MODERATE: 'Μέτριο',
			HIGH: 'Έντονο',
			EXTREME: 'Ακραίο'
		},
		awards: {
			OSCARS: 'Οσκαρικά',
			FESTIVAL: 'Φεστιβαλικά (Cannes, Venice)',
			POPULAR: 'Δημοφιλή',
			HIDDEN_GEMS: 'Κρυμμένα Διαμάντια'
		},
		criticAudience: {
			CRITICS: 'Αγαπημένα Κριτικών',
			AUDIENCE: 'Αγαπημένα Κοινού',
			BOTH: 'Αγαπημένα Όλων',
			DIVISIVE: 'Διχασμένα'
		},
		discovery: {
			POPULAR: 'Δημοφιλή Τώρα',
			CLASSICS: 'Κλασικά',
			UNDERRATED: 'Υποτιμημένα',
			NEW_RELEASES: 'Νέες Κυκλοφορίες'
		}
	},
	en: {
		countries: { US: 'American', EU: 'European', OTHER: 'Other' },
		basedOn: {
			BOOK: 'Book/Comic',
			TRUE_STORY: 'True Story',
			ORIGINAL: 'Original Screenplay',
			GAME: 'Video Game',
			PLAY: 'Play',
			REMAKE: 'Remake'
		},
		pacing: {
			SLOW: 'Slow Burn',
			MEDIUM: 'Medium',
			FAST: 'Fast Paced',
			ACTION: 'Non-stop Action'
		},
		endingType: {
			HAPPY: 'Happy Ending',
			SAD: 'Sad/Tragic',
			OPEN: 'Ambiguous/Open',
			TWIST: 'Twist Ending',
			BITTERSWEET: 'Bittersweet',
			CLIFFHANGER: 'Cliffhanger'
		},
		duration: {
			SHORT: 'Short (< 90m)',
			MEDIUM: 'Standard (90-120m)',
			LONG: 'Long (> 120m)',
			EPIC: 'Epic (> 150m)'
		},
		episodeDuration: {
			SHORT: 'Short (< 30m)',
			MEDIUM: 'Standard (30-60m)',
			LONG: 'Long (> 60m)'
		},
		seriesDuration: {
			MINI: 'Miniseries',
			SHORT: '1-3 Seasons',
			MEDIUM: '4-6 Seasons',
			LONG: '7+ Seasons'
		},
		intensity: {
			LIGHT: 'Light',
			MODERATE: 'Moderate',
			HIGH: 'Intense',
			EXTREME: 'Extreme'
		},
		awards: {
			OSCARS: 'Oscar Winners',
			FESTIVAL: 'Festival Darlings',
			POPULAR: 'Popular',
			HIDDEN_GEMS: 'Hidden Gems'
		},
		criticAudience: {
			CRITICS: 'Critics\' Favorites',
			AUDIENCE: 'Audience Favorites',
			BOTH: 'Universally Acclaimed',
			DIVISIVE: 'Divisive'
		},
		discovery: {
			POPULAR: 'Trending Now',
			CLASSICS: 'Classics',
			UNDERRATED: 'Underrated',
			NEW_RELEASES: 'New Releases'
		}
	}
};

export function generatePromptText(preferences: MoviePreferences, language: Language = 'el'): string {
	const t = labels[language];
	const opts = optionMaps[language];
	let prompt = '';

	// Determine content type description
	let contentTypeDesc = language === 'el' ? 'προτάσεις' : 'recommendations';
	// Check for keys MOVIES/SERIES/BOTH, or fallback to old string values for safety
	const type = preferences.contentType;
	const isMovies = type === 'MOVIES' || type === 'Μόνο Ταινίες' || type === 'Movies Only';
	const isSeries = type === 'SERIES' || type === 'Μόνο Σειρές' || type === 'Series Only';
	const isBoth = type === 'BOTH' || type === 'Και Ταινίες και Σειρές' || type === 'Both Movies and Series' || !type;

	if (isMovies) {
		contentTypeDesc = t.movieRecommendations;
	} else if (isSeries) {
		contentTypeDesc = t.seriesRecommendations;
	} else {
		contentTypeDesc = t.bothRecommendations;
	}

	prompt += `${t.wantRecommendations} ${contentTypeDesc}:\n\n`;

	// Free text
	if (preferences.freeText && preferences.freeText.trim()) {
		prompt += `${t.myPreferences}: ${preferences.freeText}\n\n`;
	}

	// Genres
	if (preferences.genres.length > 0) {
		prompt += `${t.genres}: ${preferences.genres.join(', ')}\n`;

		// Genre keywords
		const keywordEntries = Object.entries(preferences.genreKeywords).filter(
			([_, keywords]) => keywords.length > 0
		);
		if (keywordEntries.length > 0) {
			prompt += `${t.genreSpecialization}:\n`;
			keywordEntries.forEach(([genre, keywords]) => {
				prompt += `  - ${genre}: ${keywords.join(', ')}\n`;
			});
		}
		prompt += '\n';
	}

	// Content type (explicitly state it if needed, but we already said "I want movie/series recommendations")
	// Adding specific constraints like "Only Movies" might be redundant but helpful.

	// Countries
	if (preferences.countries.length > 0) {
		const countries = preferences.countries.map(c => opts.countries[c] || c).join(', ');
		prompt += `${t.country}: ${countries}\n`;
	}

	// Period
	if (preferences.period) {
		prompt += `${t.period}: ${preferences.period}\n`;
	}

	// Mood
	if (preferences.mood.length > 0) {
		prompt += `${t.mood}: ${preferences.mood.join(', ')}\n`;
	}

	// Pacing
	if (preferences.pacing) {
		const val = opts.pacing[preferences.pacing] || preferences.pacing;
		prompt += `${t.pacing}: ${val}\n`;
	}

	// Ending type
	if (preferences.endingType) {
		const val = opts.endingType[preferences.endingType] || preferences.endingType;
		prompt += `${t.endingType}: ${val}\n`;
	}

	// Duration - for movies
	if (preferences.duration && (isMovies || isBoth)) {
		const val = opts.duration[preferences.duration] || preferences.duration;
		prompt += `${t.movieDuration}: ${val}\n`;
	}

	// Episode Duration - for series
	if (preferences.episodeDuration && (isSeries || isBoth)) {
		const val = opts.episodeDuration[preferences.episodeDuration] || preferences.episodeDuration;
		prompt += `${t.episodeDuration}: ${val}\n`;
	}

	// Series Duration - for series
	if (preferences.seriesDuration && (isSeries || isBoth)) {
		const val = opts.seriesDuration[preferences.seriesDuration] || preferences.seriesDuration;
		prompt += `${t.seriesDuration}: ${val}\n`;
	}

	// Intensity
	if (preferences.intensity) {
		const val = opts.intensity[preferences.intensity] || preferences.intensity;
		prompt += `${t.intensity}: ${val}\n`;
	}

	// Awards
	if (preferences.awards) {
		const val = opts.awards[preferences.awards] || preferences.awards;
		prompt += `${t.awards}: ${val}\n`;
	}

	// Critic vs Audience
	if (preferences.criticAudience) {
		const val = opts.criticAudience[preferences.criticAudience] || preferences.criticAudience;
		prompt += `${t.reviews}: ${val}\n`;
	}

	// Based on
	if (preferences.basedOn.length > 0) {
		const vals = preferences.basedOn.map(b => opts.basedOn[b] || b).join(', ');
		prompt += `${t.basedOn}: ${vals}\n`;
	}

	// Discovery
	if (preferences.discovery) {
		const val = opts.discovery[preferences.discovery] || preferences.discovery;
		prompt += `${t.discovery}: ${val}\n`;
	}

	// Include history
	if (preferences.includeHistory) {
		prompt += `\n--- ${t.history} ---\n`;
		const ratings = getMovieRatings();
		const viewingHistory = getViewingHistory();

		// Helper to format item
		const formatItem = (title: string, year?: string | number) => year ? `${title} (${year})` : title;

		// 1. Get watched from ratings
		const watchedRatings = Object.entries(ratings)
			.filter(([_, r]) => r.watched && r.title)
			.map(([_, r]) => formatItem(r.title!, r.year));

		// 2. Get watched from viewing history (Previously Watched list)
		const watchedHistory = viewingHistory
			.filter(h => h.title)
			.map(h => formatItem(h.title, h.year));

		// 3. Merge and Deduplicate watched
		const allWatched = Array.from(new Set([...watchedRatings, ...watchedHistory]));

		// 4. Wants to watch from ratings
		const wantsToWatchRatings = Object.entries(ratings)
			.filter(([_, r]) => r.wantsToWatch && r.title)
			.map(([_, r]) => formatItem(r.title!, r.year));

		// 5. Wants to watch from Watchlist
		const watchlistItems = getWatchlist();
		const watchedWatchlist = watchlistItems
			.filter(item => item.movie.title)
			.map(item => formatItem(item.movie.title, item.movie.year?.toString()));

		const allWantsToWatch = Array.from(new Set([...wantsToWatchRatings, ...watchedWatchlist]));

		// 6. Does not want from ratings
		const doesNotWantRatings = Object.entries(ratings)
			.filter(([_, r]) => r.doesNotWant && r.title)
			.map(([_, r]) => formatItem(r.title!, r.year));

		// 7. Does not want from Not Interested list
		const notInterestedItems = getNotInterested();
		const watchedNotInterested = notInterestedItems
			.filter(n => n.title)
			.map(n => formatItem(n.title, n.year));

		const allDontWant = Array.from(new Set([...doesNotWantRatings, ...watchedNotInterested]));

		if (allWatched.length > 0) {
			prompt += `${t.watched}: ${allWatched.join(', ')}\n`;
		}
		if (allWantsToWatch.length > 0) {
			prompt += `${t.wantToWatch}: ${allWantsToWatch.join(', ')}\n`;
		}
		if (allDontWant.length > 0) {
			prompt += `${t.dontWant}: ${allDontWant.join(', ')}\n`;
		}
	}

	// Determine what to recommend (footer)
	let recommendType = t.moviesOrSeries;
	if (isSeries) {
		recommendType = t.series;
	} else if (isMovies) {
		recommendType = t.movies;
	}

	const withExplanation = language === 'el'
		? 'με εξήγηση γιατί ταιριάζουν στις προτιμήσεις μου.'
		: 'with an explanation of why they match my preferences.';

	prompt += `\n${t.pleaseRecommend} ${recommendType} ${withExplanation}`;

	return prompt;
}

