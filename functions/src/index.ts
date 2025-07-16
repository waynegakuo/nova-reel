/* eslint-disable */
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {HttpsError, onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {defineSecret} from 'firebase-functions/params';
import axios from 'axios'; // We'll use axios for HTTP requests, install it if you haven't


// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// 1. Define your secret. This makes the secret available to your function.
const TMDB_BEARER_TOKEN = defineSecret('TMDB_API_BEARER_TOKEN');

// 2. Define your HTTPS Callable Function
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

    // Get the parameters from the client (e.g., movie ID, search query, endpoint path - movie, tv, list - popular, upcoming)
    const { id, query, endpoint, list } = request.data; // Example of data sent from client

    if (!endpoint) {
      throw new HttpsError('invalid-argument', 'Endpoint parameter is required.');
    }

    // Construct the TMDB API URL
    const baseUrl = 'https://api.themoviedb.org/3';
    let url = `${baseUrl}/${endpoint}/${list}?language=en-US&page=1`;

    // Add query parameters based on the request
    if (id) {
      url += `/${id}`;
    }
    if (query) {
      url += `?query=${encodeURIComponent(query)}`;
    }

    // You might want more sophisticated URL construction based on TMDB API.
    // Example: For specific endpoints like /movie/{movie_id} or /search/movie?query=...

    try {
      // Access the secret value using .value()
      const bearerToken = TMDB_BEARER_TOKEN.value();

      if (!bearerToken) {
        throw new HttpsError('internal', 'TMDB API token not configured.');
      }

      // Make the secure call to the TMDB API
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Accept': 'application/json',
        },
      });

      logger.info(`Successfully fetched data from TMDB for endpoint: ${endpoint}`, { data: response.data });

      // Return the data back to the client
      return response.data;

    } catch (error: any) {
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
    }
  }
);

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
