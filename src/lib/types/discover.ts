export interface MoviePreferences {
	freeText: string;
	includeHistory: boolean;
	genres: string[];
	countries: string[];
	period: string;
	contentType: string;
	mood: string[];
	pacing: string;
	endingType: string;
	duration: string;
	episodeDuration: string; // For series
	seriesDuration: string; // For series
	intensity: string;
	awards: string;
	criticAudience: string;
	basedOn: string[];
	discovery: string;
	genreKeywords: Record<string, string[]>;
}

export interface LockedFilters {
	[key: string]: boolean;
}

export interface MovieRecommendation {
	id: string;
	title: string;
	year: number;
	director: string;
	genres: string[];
	explanation: string;
	type: 'movie' | 'series';
	imdbVerified?: boolean;
	imageUrl?: string;
}

export interface MovieUserRating {
	watched: boolean;
	wantsToWatch: boolean;
	doesNotWant: boolean;
	title?: string;  // For prompt generation (title + year instead of IMDb ID)
	year?: number;
}

export interface WatchlistItem {
	movie: MovieRecommendation;
	explanation: string;
	addedAt: number;
	imageUrl?: string;
}

export interface SearchResult {
	id: string;
	timestamp: number;
	title: string;
	summary: string;
	preferences: MoviePreferences;
	recommendations: MovieRecommendation[];
	userRatings: Record<string, MovieUserRating>; // movieId -> rating
}

export interface TraktUser {
	username: string;
	accessToken: string;
}
