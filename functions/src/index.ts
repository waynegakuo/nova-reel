/* eslint-disable */
// eslint-disable-next-line
// eslint-disable
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {HttpsError, onCall, onCallGenkit} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { logger as genkitLogger } from 'genkit/logging'; // Import Genkit's logger
import {defineSecret} from 'firebase-functions/params';
import axios from 'axios';
import {initializeApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore'; // Import Firestore from Firebase Admin SDK
import { genkit } from 'genkit'; // This is the core Genkit library itself
import { enableFirebaseTelemetry } from '@genkit-ai/firebase'; // <-- NEW IMPORT
import { z } from 'zod';
import googleAI from '@genkit-ai/googleai';
import { getStorage } from 'firebase-admin/storage';

// Define your secret. This makes the secret available to your function.
const TMDB_BEARER_TOKEN = defineSecret('TMDB_API_BEARER_TOKEN');
const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY'); // *** NEW: Define Gemini API Key Secret ***

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();
const storage = getStorage();

enableFirebaseTelemetry();

// Configure Genkit
const ai = genkit({
  plugins: [
    googleAI({apiKey: process.env.GEMINI_API_KEY }),
  ],
  model: googleAI.model('gemini-2.5-pro'), // Specify your Gemini model
});

genkitLogger.setLogLevel('debug'); // Or 'info', 'warn', 'error'

// Reusable function to construct TMDB API URL
const constructTmdbUrl = (
  endpoint: string,
  options?: {
    id?: number,
    query?: string,
    list?: string,
    page?: number,
    queryParams?: string,
    language?: string
  }
) => {
  const { id, query, list, page, queryParams, language = 'en-US' } = options || {};
  const baseUrl = 'https://api.themoviedb.org/3';
  let url = `${baseUrl}/${endpoint}`;

  // Add list if provided (for category listings like popular, top_rated, etc.)
  if (list) {
    url += `/${list}`;
  }

  // Add ID if provided (for specific movie/tv show details)
  if (id) {
    url += `/${id}`;
  }

  // Start query parameters
  const queryParts: string[] = [];

  // Add language parameter
  if (language) {
    queryParts.push(`language=${language}`);
  }

  // Add page parameter if provided
  if (page) {
    queryParts.push(`page=${page}`);
  }

  // Add additional query parameters if provided
  if (queryParams) {
    queryParts.push(queryParams);
  }

  // Add search query if provided
  if (query) {
    queryParts.push(`query=${encodeURIComponent(query)}`);
  }

  // Append all query parameters to URL
  if (queryParts.length > 0) {
    url += `?${queryParts.join('&')}`;
  }

  return url;
};

// Reusable function to execute TMDB API requests
const executeTmdbRequest = async (url: string, errorContext: string = 'TMDB API request') => {
  try {
    const bearerToken = TMDB_BEARER_TOKEN.value();
    if (!bearerToken) {
      throw new Error('TMDB API token not configured.');
    }

    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Accept': 'application/json',
      },
    });
    return response.data;
  } catch (error: any) {
    logger.error(`Error in ${errorContext}:`, error.message, error.response?.data);
    throw new Error(`Failed to fetch TMDB data: ${error.message}`);
  }
};

// Define a Tool to interact with your existing TMDB Cloud Function
export const getTmdbDataTool = ai.defineTool(
  {
    name: 'getTmdbData',
    description: 'Fetches movie or TV show data from TMDB using specific endpoint, ID, or query.',
    inputSchema: z.object({
      endpoint: z.string().describe('TMDB API endpoint (e.g., "movie", "tv", "search/movie")'),
      id: z.number().optional().describe('ID for specific movie/TV show'),
      query: z.string().optional().describe('Search query string'),
    }),
    outputSchema: z.any().describe('JSON data from TMDB API response'),
  },
  async ({ endpoint, id, query }) => {
    const url = constructTmdbUrl(endpoint, { id, query });
    return await executeTmdbRequest(url, 'getTmdbDataTool');
  }
);

// --- Schemas Definition for Flows ---

const RecommendationInputSchema = z.object({
  userId: z.string().describe('The ID of the user requesting recommendations.'),
  count: z.number().int().min(1).max(10).default(5).describe('Number of recommendations to provide.'),
});

const RecommendationOutputSchema = z.object({
  recommendations: z.array(
    z.object({
      title: z.string().describe('Title of the recommended movie/TV show.'),
      type: z.enum(['movie', 'tv']).describe('Type of media: "movie" or "tv".'),
      tmdbId: z.number().describe('TMDB ID of the recommended media.'),
      vote_average: z.number().optional().describe('Rating of the recommended media. Only provided if available.'),
      overview: z.string().describe('Brief overview or synopsis.'),
      poster_path: z.string().optional().describe('URL path to the poster image'),
      release_date: z.string().describe('Release date for movies or first air date for TV shows.'),
    })
  ).describe('List of personalized movie or TV show recommendations.'),
  reasoning: z.string().optional().describe('Explanation for the recommendations.'),
});

// --- Genkit Flow Definition ---
// Define your Genkit Flow for personalized recommendations
export const _getRecommendationsFlowLogic  = ai.defineFlow( // FIX: Use ai.defineFlow
  {
    name: 'getRecommendationsFlow',
    inputSchema: RecommendationInputSchema,
    outputSchema: RecommendationOutputSchema,
  },
  async (input) => {
    const userId = input.userId;
    const count = input.count;

    // Fetch user's favorite movies/tv shows from Firestore
    const userFavoritesRef = db.collection('users').doc(userId).collection('favorites');
    const favoritesSnapshot = await userFavoritesRef.get();
    const favoriteItems = favoritesSnapshot.docs.map(doc => doc.data());

    if (favoriteItems.length === 0) {
      return {
        recommendations: [],
        reasoning: 'No favorites found for this user. Cannot provide personalized recommendations yet.',
      };
    }

    // Prepare context for the AI from user favorites
    let favoritesContext = favoriteItems.map(item =>
      `${item['type'] === 'movie' ? 'Movie' : 'TV Show'}: ${item['title']} (TMDB ID: ${item['tmdbId']})`
    ).join('; ');

    // Generate recommendations using the AI model
    const { output } = await ai.generate({ // Use ai.generate
      tools: [getTmdbDataTool], // Make the TMDB data tool available to the model
      prompt: `
        You are a highly intelligent movie and TV show recommendation assistant.
        The user has a list of favorite movies and TV shows.
        User's favorites: ${favoritesContext}

        Based on these favorites, recommend ${count} additional movies or TV shows that the user might enjoy.
        Consider their genres, actors, directors, themes, and overall vibe.
        Prioritize items with high TMDB ratings.
        Avoid recommending any of the items already in the user's favorites list (use the provided TMDB IDs to check).

        For each recommendation, provide the title, whether it's a "movie" or "tv" show, its TMDB ID, a brief overview, and its poster path (if available from a TMDB search).
        You MUST use the 'getTmdbData' tool to search for movies/TV shows and retrieve their details if you need more information about a potential recommendation or to confirm a recommendation.

        Example of a good recommendation format:
        [
          {
            "title": "Inception",
            "type": "movie",
            "tmdbId": 27205,
            "vote_average": 8.7,
            "overview": "A thief who steals corporate secrets through use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
            "poster_path": "/8IB7TMYdK7C2z8PqY3kK5c5D8D.jpg",
            "release_date": "2010-07-16"
          },
          // ... more recommendations
        ]

        Explain your reasoning briefly after the recommendations.
        `,
      output: {
        format: 'json', // Ensures Gemini tries to output JSON
        schema: RecommendationOutputSchema, // Helps Gemini adhere to the expected structure
      },
    });

    // Ensure we never return null - if output is null, return an empty recommendations array
    const recommendations = output || { recommendations: [], reasoning: 'Unable to generate recommendations.' };

    return recommendations;
  }
);

// --- Firebase Cloud Function Deployment of the Genkit Flow ---
// FIX: Wrap the Genkit flow logic in onCallGenkit to add deployment options
export const getRecommendationsFlow = onCallGenkit( // EXPORT THIS as the Cloud Function
  {
    // Deployment options for the Cloud Function that wraps the Genkit flow
    secrets: [TMDB_BEARER_TOKEN], // Access to secrets for the underlying tool calls
    region: 'africa-south1', // Set your desired region
    cors: true, // Allow all origins for local development (or restrict for prod)
    // Add memory/timeout if needed for this function
    // memory: '512MiB',
    // timeoutSeconds: 60,
  },
  _getRecommendationsFlowLogic // Pass the defined Genkit flow logic here
);

// Helper function to calculate title similarity for confidence scoring
const calculateTitleSimilarity = (guess: string, actual: string): number => {
  const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const guessNorm = normalize(guess);
  const actualNorm = normalize(actual);

  if (guessNorm === actualNorm) return 1.0;
  if (actualNorm.includes(guessNorm) || guessNorm.includes(actualNorm)) return 0.85;

  // Simple word overlap calculation
  const guessWords = guessNorm.split(/\s+/);
  const actualWords = actualNorm.split(/\s+/);
  const commonWords = guessWords.filter(word => actualWords.includes(word));

  return commonWords.length / Math.max(guessWords.length, actualWords.length);
};

// Reusable function to handle HTTP errors for Cloud Functions
const handleHttpError = (error: any): never => {
  logger.error('Error calling TMDB API:', error.message, error.response?.data);

  if (axios.isAxiosError(error) && error.response) {
    // Propagate TMDB API errors back to the client with appropriate HTTP status
    throw new HttpsError(
      'internal', // Or a more specific code like 'not-found' if 404
      `TMDB API Error: ${error.response.status} - ${error.response.statusText || error.message}`,
      error.response.data // Include error details from TMDB
    );
  } else {
    throw new HttpsError('internal', 'An unexpected error occurred.', error.message);
  }
};

const ImageAnalysisInputSchema = z.object({
  imageUrl: z.string().url().describe('URL of the movie or TV show scene screenshot.'),
});

// Schema for the movie identification output that matches UI expectations
const MovieIdentificationOutputSchema = z.object({
  title: z.string().describe('Title of the identified movie or TV show'),
  type: z.enum(['movie', 'tv']).describe('Type of media: "movie" or "tv"'),
  tmdbId: z.number().optional().describe('TMDB ID of the identified media if found'),
  confidence: z.number().min(0).max(1).optional().describe('Confidence score between 0 and 1'),
  overview: z.string().optional().describe('Brief overview or synopsis'),
  year: z.string().optional().describe('Release year'),
  poster_path: z.string().optional().describe('URL path to the poster image'),
  reasoning: z.string().optional().describe('The AI\'s reasoning behind its guess.'),
  alternatives: z.array(
    z.object({
      title: z.string().describe('Title of the alternative movie or TV show'),
      type: z.enum(['movie', 'tv']).optional().describe('Type of media: "movie" or "tv"'),
      confidence: z.number().min(0).max(1).optional().describe('Confidence score between 0 and 1'),
      year: z.string().optional().describe('Release year'),
    })
  ).optional().describe('Alternative possibilities if the AI is uncertain'),
});

// Define the Genkit flow for movie identification from screenshots
export const _identifyMovieFromScreenshotLogic = ai.defineFlow(
  {
    name: 'identifyMovieFromScreenshot',
    inputSchema: ImageAnalysisInputSchema,
    outputSchema: MovieIdentificationOutputSchema,
  },
  async (input) => {
    const { imageUrl } = input;

    // STAGE 1: Pure Gemini multimodal identification
    const { output } = await ai.generate({
      prompt: [
        {
          media: {
            url: imageUrl,
          },
        },
        {
          text: `Analyze this image and identify the movie or TV show it's from.
          Provide the title and type (movie or tv) of the content.
          Format your answer as a JSON object with 'title' and 'type' keys.`,
        },
      ],
      output: {
        schema: z.object({
          title: z.string(),
          type: z.enum(['movie', 'tv']),
        }),
      },
    });

    const aiGuess = output;

    if (!aiGuess || !aiGuess.title) {
      throw new HttpsError('internal', 'AI was unable to make a guess.');
    }

    // STEP 2: Use the AI's guess to search TMDB for real, verifiable data.
    const searchResults = await getTmdbDataTool({
      endpoint: `search/${aiGuess.type}`,
      query: aiGuess.title,
    });

    const topResult = searchResults.results?.[0];

    if (!topResult) {
      throw new HttpsError('not-found', 'Could not find a match on TMDB for the guessed movie/TV show.');
    }

    // STEP 3: Return the final, structured data from TMDB with confidence and year.
    const releaseYear = aiGuess.type === 'movie'
      ? topResult.release_date?.substring(0, 4)
      : topResult.first_air_date?.substring(0, 4);

    // Calculate confidence based on title similarity (basic implementation)
    const titleSimilarity = calculateTitleSimilarity(aiGuess.title, topResult.title || topResult.name);
    const confidence = Math.min(0.9, Math.max(0.6, titleSimilarity)); // Keep between 0.6-0.9

    return {
      title: topResult.title || topResult.name,
      type: aiGuess.type,
      tmdbId: topResult.id,
      confidence: confidence,
      overview: topResult.overview,
      year: releaseYear,
      poster_path: topResult.poster_path,
      reasoning: `AI guessed '${aiGuess.title}' and this was the top result from TMDB.`,
    };
  }
);

// Firebase Cloud Function for movie identification
export const identifyMovieFromScreenshot = onCallGenkit(
  {
    secrets: [TMDB_BEARER_TOKEN],
    region: 'africa-south1',
    cors: true,
    memory: '1GiB', // Increase memory for image processing
    timeoutSeconds: 120, // Longer timeout for complex image analysis
  },
  _identifyMovieFromScreenshotLogic
);

// Function to handle file uploads and movie identification
export const guessMovieFromScreenshot = onCall(
  {
    secrets: [TMDB_BEARER_TOKEN, GEMINI_API_KEY],
    region: 'africa-south1',
    cors: true,
    memory: '1GiB',
    timeoutSeconds: 120,
  },
  async (request) => {
    try {
      // Check if file data is provided
      if (!request.data || !request.data.file) {
        throw new HttpsError('invalid-argument', 'No file data provided.');
      }

      const fileData = request.data.file;
      const contentType = request.data.contentType || 'image/jpeg';
      const fileName = `movie-screenshots/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`;

      // Create a reference to the file in Firebase Storage
      const fileRef = storage.bucket().file(fileName);

      // Save the file to Firebase Storage
      await fileRef.save(Buffer.from(fileData, 'base64'), {
        metadata: {
          contentType: contentType,
        },
      });

      // Get a signed URL for the file
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // URL expires in 15 minutes
      });

      // Call the movie identification flow with the image URL
      const result = await _identifyMovieFromScreenshotLogic({ imageUrl: url });

      // If we have a TMDB ID, fetch additional details
      if (result.tmdbId && result.type) {
        try {
          const endpoint = result.type === 'movie' ? 'movie' : 'tv';
          const url = constructTmdbUrl(endpoint, { id: result.tmdbId });
          const additionalData = await executeTmdbRequest(url, `Additional data for ${result.title}`);

          // Enhance the result with additional data
          if (additionalData) {
            result.overview = additionalData.overview || result.overview;
            result.poster_path = additionalData.poster_path || result.poster_path;
            result.year = result.type === 'movie'
              ? (additionalData.release_date ? additionalData.release_date.substring(0, 4) : result.year)
              : (additionalData.first_air_date ? additionalData.first_air_date.substring(0, 4) : result.year);
          }
        } catch (error) {
          logger.warn('Error fetching additional movie data:', error);
          // Continue with the basic result if additional data fetch fails
        }
      }

      // Clean up the file after processing (optional)
      await fileRef.delete().catch(err => {
        logger.warn('Error deleting temporary file:', err);
      });

      return result;
    } catch (error: any) {
      logger.error('Error in guessMovieFromScreenshot:', error);
      return handleHttpError(error);
    }
  }
);

export const getTmdbData = onCall(
  {
    // Make sure your function has access to the secret
    secrets: [TMDB_BEARER_TOKEN],
    // Optional: Configure region and CORS if needed
    region: 'africa-south1', // Set your desired region
    // cors: true, // Allow CORS from any origin (adjust for production)
  },
  async (request) => {
    // Optional: Implement authentication/authorization if only specific users can call this
    // if (!request.auth) {
    //   throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
    // }
    // logger.info("User ID:", request.auth.uid);

    // Get the parameters from the client
    const { id, query, endpoint, list, page, queryParams } = request.data;

    if (!endpoint) {
      throw new HttpsError('invalid-argument', 'Endpoint parameter is required.');
    }

    try {
      // Construct the TMDB API URL using the reusable function
      const url = constructTmdbUrl(endpoint, { id, query, list, page, queryParams });

      // Execute the request using the reusable function
      const data = await executeTmdbRequest(url, `getTmdbData(${endpoint})`);

      // Log success
      logger.info(`Successfully fetched data from TMDB for endpoint: ${endpoint}`, { data });

      // Return the data back to the client
      return data;
    } catch (error: any) {
      return handleHttpError(error);
    }
  }
);
