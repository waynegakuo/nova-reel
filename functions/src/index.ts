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

// Define your secret. This makes the secret available to your function.
const TMDB_BEARER_TOKEN = defineSecret('TMDB_API_BEARER_TOKEN');

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

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

// Define your HTTPS Callable Function
// This is the type of function your Angular client will call directly.
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
