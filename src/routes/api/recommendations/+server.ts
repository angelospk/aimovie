import { json, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { MovieRecommendation } from '$lib/types/discover';
import {
    getAvailableModel,
    recordUsage,
    handleRateLimit,
    handleModelNotFound,
    getModelApiUrl,
    type ModelConfig
} from '$lib/server/gemini-manager';
import { OpenRouter } from '@openrouter/sdk';

// Bilingual system prompts - Greek and English
const SYSTEM_PROMPTS: Record<'el' | 'en', string> = {
    el: `Είσαι ένας ειδικός σύμβουλος κινηματογράφου με έμφαση στο marketing. Όταν ο χρήστης σου περιγράφει τι θέλει να δει, πρέπει να του προτείνεις 10-12 ταινίες ή σειρές.

ΣΗΜΑΝΤΙΚΟ: Πρέπει να απαντήσεις ΑΠΟΚΛΕΙΣΤΙΚΑ με ένα JSON object που περιέχει:
1. searchTitle: Ένας σύντομος, περιγραφικός τίτλος για αυτή την αναζήτηση (max 60 χαρακτήρες, στα ελληνικά)
2. recommendations: Array με τις προτάσεις

Κάθε πρόταση πρέπει να έχει ακριβώς αυτή τη δομή:
{
  "id": "tt1234567",  // IMDb ID (πρέπει να είναι πραγματικό)
  "title": "Movie Title",
  "year": 2020,
  "director": "Director Name",
  "genres": ["Genre1", "Genre2"],
  "explanation": "Περιγραφή στα ΕΛΛΗΝΙΚΑ",
  "type": "movie"  // ή "series"
}

ΚΑΝΟΝΕΣ EXPLANATION (ΠΟΛΥ ΣΗΜΑΝΤΙΚΟ):
1. ΜΟΝΟ 1-2 προτάσεις - πολύ σύντομα!
2. ΜΗΝ ξεκινάς με "Αν αγαπάς/αγαπάτε..." ή "Αν ψάχνεις..."
3. Ξεκίνα ΑΜΕΣΑ με το όφελος: "Θα σε καθηλώσει...", "Το καλύτερο...", "Εδώ θα βρεις..."
4. Απευθύνσου ΠΡΟΣΩΠΙΚΑ ("σου", "θα σε")
5. Πειστικό marketing - γιατί ΠΡΕΠΕΙ να το δει ΤΩΡΑ

ΑΛΛΟΙ ΚΑΝΟΝΕΣ:
1. Χρησιμοποίησε ΠΡΑΓΜΑΤΙΚΑ IMDb IDs (ξεκινούν με "tt")
2. Μην προτείνεις ταινίες που ο χρήστης έχει ήδη δει
3. Δώσε ποικιλία - μην προτείνεις μόνο τις πιο δημοφιλείς`,

    en: `You are an expert movie consultant with a marketing focus. When the user describes what they want to watch, recommend 10-12 movies or series.

IMPORTANT: You must respond EXCLUSIVELY with a JSON object containing:
1. searchTitle: A short, descriptive title for this search (max 60 characters, in English)
2. recommendations: Array with the recommendations

Each recommendation must have exactly this structure:
{
  "id": "tt1234567",  // IMDb ID (must be real)
  "title": "Movie Title",
  "year": 2020,
  "director": "Director Name",
  "genres": ["Genre1", "Genre2"],
  "explanation": "Description in ENGLISH",
  "type": "movie"  // or "series"
}

EXPLANATION RULES (VERY IMPORTANT):
1. ONLY 1-2 sentences - very short!
2. DON'T start with "If you love..." or "If you're looking for..."
3. Start DIRECTLY with the benefit: "You'll be captivated...", "The best...", "Here you'll find..."
4. Address the user PERSONALLY ("you", "you'll")
5. Persuasive marketing - why they MUST watch this NOW

OTHER RULES:
1. Use REAL IMDb IDs (starting with "tt")
2. Don't recommend movies the user has already seen
3. Give variety - don't just suggest the most popular ones`
};

export async function POST({ request }: RequestEvent) {
    try {
        const { prompt, language = 'el' } = await request.json();

        if (!prompt) {
            return json({ error: 'Missing prompt' }, { status: 400 });
        }

        // Validate language parameter
        const lang = (language === 'en' ? 'en' : 'el') as 'el' | 'en';
        const systemPrompt = SYSTEM_PROMPTS[lang];
        const userRequestLabel = lang === 'el' ? '--- ΑΙΤΗΜΑ ΧΡΗΣΤΗ ---' : '--- USER REQUEST ---';

        const GEMINI_API_KEY = env.GEMINI_API_KEY;
        const OPENROUTER_API_KEY = env.OPENROUTER_API_KEY;

        if (!GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY not configured');
            return json({ error: 'AI service not configured', errorType: 'CONFIG_ERROR' }, { status: 503 });
        }

        const openrouter = new OpenRouter({
            apiKey: OPENROUTER_API_KEY || ''
        });

        let currentModel = getAvailableModel();
        if (!currentModel) {
            return json({
                error: 'All AI models are currently rate limited. Please try again later.',
                errorType: 'ALL_MODELS_EXHAUSTED',
                retryAfter: 60
            }, { status: 503 });
        }

        let responseText = '';
        let attempts = 0;
        const maxAttempts = 4; // Try up to 4 models

        while (attempts < maxAttempts) {
            try {
                if (currentModel!.provider === 'openrouter') {
                    if (!OPENROUTER_API_KEY) {
                        console.warn('OpenRouter selected but OPENROUTER_API_KEY missing, skipping...');
                        handleRateLimit(currentModel!.name);
                        attempts++;
                        currentModel = getAvailableModel();
                        if (!currentModel) break;
                        continue;
                    }

                    console.log(`[AI] Calling OpenRouter with model: ${currentModel!.name}`);
                    const result = await openrouter.chat.send({
                        model: currentModel!.name,
                        messages: [
                            {
                                role: 'system',
                                // @ts-ignore
                                content: systemPrompt
                            },
                            {
                                role: 'user',
                                // @ts-ignore
                                content: userRequestLabel + '\n' + prompt
                            }
                        ],
                        // @ts-ignore - OpenRouter SDK types might be outdated or different
                        response_format: { type: 'json_object' }
                    });

                    responseText = (result.choices[0]?.message?.content as string) || '';
                } else {
                    // Gemini logic
                    const apiUrl = getModelApiUrl(currentModel!.name);
                    const response = await fetch(`${apiUrl}?key=${GEMINI_API_KEY}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            contents: [
                                {
                                    parts: [
                                        {
                                            text: systemPrompt + '\n\n' + userRequestLabel + '\n' + prompt
                                        }
                                    ]
                                }
                            ],
                            generationConfig: {
                                temperature: 0.8,
                                topK: 40,
                                topP: 0.95,
                                maxOutputTokens: 10 * 4096,
                                responseMimeType: 'application/json',
                                responseSchema: {
                                    type: 'object',
                                    properties: {
                                        searchTitle: {
                                            type: 'string',
                                            description:
                                                "Short descriptive title for this search in the user's language (max 60 characters)"
                                        },
                                        recommendations: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    id: {
                                                        type: 'string',
                                                        description: 'IMDb ID starting with tt'
                                                    },
                                                    title: {
                                                        type: 'string',
                                                        description: 'Movie or series title'
                                                    },
                                                    year: {
                                                        type: 'integer',
                                                        description: 'Release year'
                                                    },
                                                    director: {
                                                        type: 'string',
                                                        description: 'Director name(s)'
                                                    },
                                                    genres: {
                                                        type: 'array',
                                                        items: {
                                                            type: 'string'
                                                        },
                                                        description: 'List of genres'
                                                    },
                                                    explanation: {
                                                        type: 'string',
                                                        description:
                                                            "Explanation in the user's language for why this recommendation matches user preferences"
                                                    },
                                                    type: {
                                                        type: 'string',
                                                        enum: ['movie', 'series'],
                                                        description: 'Content type'
                                                    }
                                                },
                                                required: ['id', 'title', 'year', 'director', 'genres', 'explanation', 'type']
                                            }
                                        }
                                    },
                                    required: ['searchTitle', 'recommendations']
                                }
                            }
                        })
                    });

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error(`Gemini API error (${currentModel!.name}):`, errorText);

                        if (response.status === 429) {
                            handleRateLimit(currentModel!.name);
                            attempts++;
                            currentModel = getAvailableModel();
                            if (!currentModel) break;
                            continue;
                        }
                        if (response.status === 404) {
                            handleModelNotFound(currentModel!.name);
                            attempts++;
                            currentModel = getAvailableModel();
                            if (!currentModel) break;
                            continue;
                        }
                        return json({ error: 'AI generation failed', errorType: 'NETWORK_ERROR' }, { status: response.status });
                    }

                    const data = await response.json();
                    responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                }

                if (!responseText) {
                    console.error(`Empty response from ${currentModel!.name}`);
                    handleRateLimit(currentModel!.name);
                    attempts++;
                    currentModel = getAvailableModel();
                    if (!currentModel) break;
                    continue;
                }

                // Record successful usage
                recordUsage(currentModel!.name);
                break; // Success! Exit loop

            } catch (error) {
                console.error(`Error with model ${currentModel!.name}:`, error);
                handleRateLimit(currentModel!.name);
                attempts++;
                currentModel = getAvailableModel();
                if (!currentModel) break;
            }
        }

        if (!responseText) {
            return json({
                error: 'All AI models failed to respond',
                errorType: 'ALL_MODELS_EXHAUSTED',
                retryAfter: 60
            }, { status: 503 });
        }

        let parsedResponse: { searchTitle?: string; recommendations: MovieRecommendation[] };
        try {
            parsedResponse = JSON.parse(responseText);
            console.log(
                'Successfully parsed',
                parsedResponse.recommendations?.length || 0,
                'recommendations'
            );
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.log('Raw response:', responseText);

            // Fallback: Try to repair incomplete JSON
            try {
                let jsonStr = responseText.trim();

                // Remove markdown code blocks if present
                if (jsonStr.startsWith('```json')) {
                    jsonStr = jsonStr.slice(7);
                } else if (jsonStr.startsWith('```')) {
                    jsonStr = jsonStr.slice(3);
                }
                if (jsonStr.endsWith('```')) {
                    jsonStr = jsonStr.slice(0, -3);
                }
                jsonStr = jsonStr.trim();

                // Try to extract recommendations array if wrapped in object
                const objMatch = jsonStr.match(/\{[\s\S]*"recommendations"\s*:\s*(\[[\s\S]*\])/);
                if (objMatch) {
                    const recsJson = objMatch[1];
                    // Try to repair the recommendations array
                    const complexPattern =
                        /\{[^{}]*"genres"\s*:\s*\[[^\]]*\][^{}]*"type"\s*:\s*"[^"]*"[^{}]*\}/g;
                    const matches: number[] = [];
                    let match;

                    while ((match = complexPattern.exec(recsJson)) !== null) {
                        matches.push(match.index + match[0].length);
                    }

                    if (matches.length > 0) {
                        const lastCompleteObjectEnd = matches[matches.length - 1];
                        let repairedRecsArray = recsJson.substring(0, lastCompleteObjectEnd);

                        if (!repairedRecsArray.trim().endsWith(']')) {
                            repairedRecsArray += '\n]';
                        }

                        console.log('Attempting to repair JSON...');
                        const repairedRecs = JSON.parse(repairedRecsArray);
                        parsedResponse = { recommendations: repairedRecs };
                        console.log(
                            'JSON repair successful! Kept',
                            parsedResponse.recommendations?.length || 0,
                            'complete recommendations'
                        );
                    } else {
                        console.error('No complete objects found in response');
                        return json({ error: 'Failed to parse AI response', errorType: 'INVALID_RESPONSE' }, { status: 500 });
                    }
                } else {
                    console.error('Could not extract recommendations from response');
                    return json({ error: 'Failed to parse AI response', errorType: 'INVALID_RESPONSE' }, { status: 500 });
                }
            } catch (repairError) {
                console.error('JSON repair failed:', repairError);
                return json({ error: 'Failed to parse AI response', errorType: 'INVALID_RESPONSE' }, { status: 500 });
            }
        }

        // Validate and clean up recommendations
        const validRecommendations = (parsedResponse.recommendations || [])
            .filter(
                (r) =>
                    r.id &&
                    r.title &&
                    typeof r.year === 'number' &&
                    (r.type === 'movie' || r.type === 'series')
            )
            .map((r) => ({
                id: r.id,
                title: r.title,
                year: r.year,
                director: r.director || 'Unknown',
                genres: Array.isArray(r.genres) ? r.genres : [],
                explanation: r.explanation || '',
                type: r.type
            }));

        return json({ recommendations: validRecommendations, searchTitle: parsedResponse.searchTitle });
    } catch (error) {
        console.error('AI recommendations error:', error);
        return json({ error: 'Internal server error', errorType: 'NETWORK_ERROR' }, { status: 500 });
    }
}
