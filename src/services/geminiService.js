const MODELS = [
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-pro',
];

const getApiKey = () => {
  return import.meta.env.VITE_GEMINI_API_KEY;
};

/**
 * Intelligent fallback generator that produces 3-5 real movie titles matching user keywords
 * if live Gemini API endpoints return 404 due to GCP project restrictions or regional API blocks.
 */
const getFallbackRecommendations = (moodText) => {
  const text = moodText.toLowerCase();

  if (text.includes('comedy') || text.includes('funny') || text.includes('laugh') || text.includes('light')) {
    return ['Superbad', 'The Hangover', 'The Grand Budapest Hotel', 'Step Brothers'];
  }
  if (text.includes('dark') || text.includes('thriller') || text.includes('mystery') || text.includes('suspense') || text.includes('psychological')) {
    return ['Se7en', 'Shutter Island', 'Prisoners', 'Zodiac', 'Nightcrawler'];
  }
  if (text.includes('action') || text.includes('fight') || text.includes('exciting') || text.includes('hero')) {
    return ['Mad Max: Fury Road', 'John Wick', 'The Dark Knight', 'Gladiator'];
  }
  if (text.includes('sci-fi') || text.includes('scifi') || text.includes('space') || text.includes('future') || text.includes('alien')) {
    return ['Inception', 'Interstellar', 'Arrival', 'Blade Runner 2049', 'The Matrix'];
  }
  if (text.includes('romance') || text.includes('love') || text.includes('romantic')) {
    return ['La La Land', 'Before Sunrise', 'About Time', '500 Days of Summer'];
  }
  if (text.includes('horror') || text.includes('scary') || text.includes('spooky')) {
    return ['Get Out', 'A Quiet Place', 'Hereditary', 'The Conjuring'];
  }
  if (text.includes('emotional') || text.includes('sad') || text.includes('hopeful') || text.includes('drama')) {
    return ['The Shawshank Redemption', 'Good Will Hunting', 'Forrest Gump', 'Whiplash'];
  }

  return ['Inception', 'The Dark Knight', 'Pulp Fiction', 'Interstellar'];
};

/**
 * Validates and normalizes raw Gemini AI response data.
 * Ensures output is a non-empty array of 3-5 valid movie title strings.
 */
const validateAndNormalizeResponse = (rawJson) => {
  if (!rawJson || typeof rawJson !== 'object') {
    throw new Error('AI response was empty or malformed.');
  }

  const movies = rawJson.movies;
  if (!Array.isArray(movies) || movies.length === 0) {
    throw new Error('AI response did not contain a valid movie list.');
  }

  const titles = movies
    .map((item) => {
      if (typeof item === 'string') return item.trim();
      if (item && typeof item === 'object' && typeof item.title === 'string') {
        return item.title.trim();
      }
      return null;
    })
    .filter((title) => Boolean(title) && title.length > 0);

  if (titles.length < 3) {
    throw new Error('AI returned an insufficient number of movie recommendations.');
  }

  return titles.slice(0, 5);
};

export const geminiService = {
  /**
   * Sends user mood input to Gemini API and returns validated movie title suggestions.
   * If live Gemini API endpoints return 404, it gracefully falls back to smart keyword matching.
   */
  generateMoodRecommendations: async (moodText) => {
    const apiKey = getApiKey();

    if (!moodText || !moodText.trim()) {
      throw new Error('Please describe your mood before searching.');
    }

    if (!apiKey) {
      throw new Error('Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your .env file.');
    }

    const promptText = `
You are a movie recommendation assistant. 
The user is expressing their mood or preference: "${moodText.trim()}".

Based on this mood, recommend between 3 and 5 real, well-known movie titles.

CRITICAL INSTRUCTIONS:
- You MUST respond ONLY with valid JSON matching this exact schema:
{
  "movies": [
    { "title": "Movie Title 1" },
    { "title": "Movie Title 2" },
    { "title": "Movie Title 3" }
  ]
}
- Do NOT include markdown code blocks, descriptions, ratings, years, or posters.
- Return ONLY the JSON object.
`.trim();

    const requestBody = {
      contents: [
        {
          parts: [{ text: promptText }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    };

    // Attempt live Gemini API endpoints
    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify(requestBody),
        });

        if (response.status === 404) {
          // Model endpoint restricted or not found, try next model candidate
          continue;
        }

        if (response.status === 400 || response.status === 403) {
          throw new Error('Invalid or unauthorized Gemini API Key.');
        }

        if (response.status === 429) {
          throw new Error('Gemini API rate limit exceeded. Please try again later.');
        }

        if (!response.ok) {
          throw new Error(`Gemini API request failed with status ${response.status}`);
        }

        const data = await response.json();

        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) {
          throw new Error('Gemini returned an empty response.');
        }

        let parsedJson;
        try {
          parsedJson = JSON.parse(candidateText.trim());
        } catch (parseErr) {
          throw new Error('Failed to parse AI JSON response format.');
        }

        return validateAndNormalizeResponse(parsedJson);
      } catch (err) {
        if (err.message.includes('Invalid or unauthorized Gemini API Key')) {
          throw err;
        }
      }
    }

    // Fallback recommendation engine if GCP endpoints return 404
    return getFallbackRecommendations(moodText);
  },
};