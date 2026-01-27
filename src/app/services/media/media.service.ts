import {EnvironmentInjector, inject, Injectable, runInInjectionContext} from '@angular/core';
import {Observable, shareReplay, BehaviorSubject, switchMap, from, of, map, throwError, Subject} from 'rxjs';
import {Movie, TvShow} from '../../models/media.model';
import {MovieDetails, TvShowDetails, Favorite, Watchlist} from '../../models/media-details.model';
import {WatchProvidersResponse} from '../../models/watch-providers.model';
import {AiRecommendation, AiRecommendationResponse} from '../../models/ai-recommendations.model';
import {HttpClient} from '@angular/common/http';
import {getFunctions, httpsCallable, Functions} from '@angular/fire/functions';
import {Firestore, collection, doc, setDoc, getDoc, deleteDoc, getDocs, query, orderBy, where} from '@angular/fire/firestore';
import {AuthService} from '../auth/auth.service';
import {ToastService} from '../toast/toast.service';

@Injectable({
  providedIn: 'root'
})
export class MediaService {

  http = inject(HttpClient);
  firestore = inject(Firestore);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private functions = inject(Functions);
  private environmentInjector = inject(EnvironmentInjector);

  constructor() { }

  // Cache storage for movies and TV shows
  private movieCache: Record<string, Observable<(Movie | TvShow)[]>> = {};
  private tvShowCache: Record<string, Observable<(Movie | TvShow)[]>> = {};
  private movieDetailsCache: Record<number, Observable<MovieDetails>> = {};
  private tvShowDetailsCache: Record<number, Observable<TvShowDetails>> = {};
  private aiRecommendationsCache: Observable<AiRecommendationResponse> | null = null;
  private searchCache: Record<string, Observable<(Movie | TvShow)[]>> = {};
  private guessMovieCache: Observable<any> | null = null;

  // Refresh triggers for cache invalidation
  private refreshMoviesCache$ = new BehaviorSubject<boolean>(true);
  private refreshTVShowsCache$ = new BehaviorSubject<boolean>(true);
  private refreshMovieDetailsCache$ = new BehaviorSubject<boolean>(true);
  private refreshTVShowDetailsCache$ = new BehaviorSubject<boolean>(true);
  private refreshAiRecommendationsCache$ = new BehaviorSubject<boolean>(true);
  private refreshSearchCache$ = new BehaviorSubject<boolean>(true);
  private refreshGuessMovieCache$ = new BehaviorSubject<boolean>(true);

  // New recommendations notification system
  private newRecommendationsAvailable$ = new Subject<AiRecommendation[]>();
  private pendingNewRecommendations: AiRecommendation[] = [];
  private pendingNewReasoning: string = '';

  /**
   * Fetches data from TMDB API through Firebase Cloud Function
   * @param endpoint - The TMDB API endpoint ('movie' or 'tv')
   * @param list - Optional parameter specifying the list type (e.g. 'popular', 'top_rated')
   * @param page - Optional parameter specifying the page number
   * @param queryParams - Optional parameter specifying additional query parameters
   * @param id
   * @returns Promise containing the API response data
   * @throws Error if the API request fails
   */
  async getTmdbData(endpoint: string, list?: string, page?: number, queryParams?: string, id?:number): Promise<unknown> {
    return runInInjectionContext(this.environmentInjector, async() => {
      const callableGetTmdbData = httpsCallable(this.functions, 'getTmdbData');
      try {
        const result = await callableGetTmdbData({
          endpoint: endpoint,
          list: list,
          page: page,
          queryParams: queryParams,
          id: id
        });
        return result.data; // The data returned from your Cloud Function
      } catch (error: any) {
        console.error('Error fetching movie details from Cloud Function:', error);
        // Handle the error appropriately in your Angular app
        throw error;
      }
    })

  }

  /**
   * Fetches a list of movies from TMDB API with caching
   * @param list - The type of movie list to fetch (e.g. 'now_playing', 'popular', 'upcoming', 'top_rated')
   * @param forceRefresh - Whether to force a refresh of the cache
   * @param page - The page number to fetch (default: 1)
   * @returns An Observable containing an array of Movie or TvShow objects
   */
  getMovies(list: string, forceRefresh: boolean = false, page: number = 1): Observable<(Movie | TvShow)[]> {
    // Force refresh if requested
    if (forceRefresh) {
      this.refreshMoviesCache(list, page);
    }

    // Create cache key that includes both list and page
    const cacheKey = `${list}_page${page}`;

    // Create the cache if it doesn't exist for this list and page
    if (!this.movieCache[cacheKey]) {
      this.movieCache[cacheKey] = this.refreshMoviesCache$.pipe(
        // Only proceed when refresh is triggered
        switchMap(() => {
          // Use the Firebase Function to get the data
          return new Observable<(Movie | TvShow)[]>(observer => {
            this.getTmdbData('movie', list, page)
              .then((response: any) => {
                observer.next(response.results);
                observer.complete();
              })
              .catch(error => {
                console.error('Error fetching movies:', error);
                observer.error(error);
              });
          }).pipe(
            // Cache the result for 5 minutes (300000ms) and share it with all subscribers
            // Buffer size of 1 means we only keep the latest value
            shareReplay({ bufferSize: 1, refCount: false, windowTime: 300000 })
          );
        })
      );
    }

    return this.movieCache[cacheKey];
  }

  /**
   * Manually refreshes the movie cache for a specific list and page
   * @param list - The type of movie list to refresh
   * @param page - The page number to refresh (optional)
   */
  refreshMoviesCache(list?: string, page?: number): void {
    // If a specific list and page are provided, clear only that cache
    if (list && page) {
      const cacheKey = `${list}_page${page}`;
      delete this.movieCache[cacheKey];
    } else if (list) {
      // If only list is provided, clear all pages for that list
      Object.keys(this.movieCache).forEach(key => {
        if (key.startsWith(`${list}_page`)) {
          delete this.movieCache[key];
        }
      });
    } else {
      // Otherwise clear all movie caches
      this.movieCache = {};
    }

    // Trigger a refresh
    this.refreshMoviesCache$.next(true);
  }


  /**
   * Fetches a list of TV shows from TMDB API with caching
   * @param list - The type of TV show list to fetch (e.g. 'airing_today', 'popular', 'top_rated', 'on_the_air')
   * @param forceRefresh - Whether to force a refresh of the cache
   * @param page - The page number to fetch (default: 1)
   * @returns An Observable containing an array of Movie or TvShow objects
   */
  getTVShows(list: string, forceRefresh: boolean = false, page: number = 1): Observable<(Movie | TvShow)[]> {
    // Force refresh if requested
    if (forceRefresh) {
      this.refreshTVShowsCache(list, page);
    }

    // Create cache key that includes both list and page
    const cacheKey = `${list}_page${page}`;

    // Create the cache if it doesn't exist for this list and page
    if (!this.tvShowCache[cacheKey]) {
      this.tvShowCache[cacheKey] = this.refreshTVShowsCache$.pipe(
        // Only proceed when refresh is triggered
        switchMap(() => {
          // Use the Firebase Function to get the data
          return new Observable<(Movie | TvShow)[]>(observer => {
            this.getTmdbData('tv', list, page)
              .then((response: any) => {
                observer.next(response.results);
                observer.complete();
              })
              .catch(error => {
                console.error('Error fetching TV shows:', error);
                observer.error(error);
              });
          }).pipe(
            // Cache the result for 5 minutes (300000ms) and share it with all subscribers
            // Buffer size of 1 means we only keep the latest value
            shareReplay({ bufferSize: 1, refCount: false, windowTime: 300000 })
          );
        })
      );
    }

    return this.tvShowCache[cacheKey];
  }

  /**
   * Manually refreshes the TV shows cache for a specific list and page
   * @param list - The type of TV show list to refresh
   * @param page - The page number to refresh (optional)
   */
  refreshTVShowsCache(list?: string, page?: number): void {
    // If a specific list and page are provided, clear only that cache
    if (list && page) {
      const cacheKey = `${list}_page${page}`;
      delete this.tvShowCache[cacheKey];
    } else if (list) {
      // If only list is provided, clear all pages for that list
      Object.keys(this.tvShowCache).forEach(key => {
        if (key.startsWith(`${list}_page`)) {
          delete this.tvShowCache[key];
        }
      });
    } else {
      // Otherwise clear all TV show caches
      this.tvShowCache = {};
    }

    // Trigger a refresh
    this.refreshTVShowsCache$.next(true);
  }

  /**
   * Fetches detailed information about a specific movie
   * @param movieId - The ID of the movie to fetch details for
   * @param forceRefresh - Whether to force a refresh of the cache
   * @returns An Observable containing the MovieDetails object
   */
  getMovieDetails(movieId: number, forceRefresh: boolean = false): Observable<MovieDetails> {
    // Force refresh if requested
    if (forceRefresh) {
      this.refreshMovieDetailsCache(movieId);
    }

    // Create the cache if it doesn't exist for this movie
    if (!this.movieDetailsCache[movieId]) {
      this.movieDetailsCache[movieId] = this.refreshMovieDetailsCache$.pipe(
        // Only proceed when refresh is triggered
        switchMap(() => {
          // Use the Firebase Function to get the data
          return new Observable<MovieDetails>(observer => {
            this.getTmdbData('movie', undefined, undefined, 'append_to_response=credits,videos,similar,recommendations', movieId)
              .then((response: any) => {
                observer.next(response as MovieDetails);
                observer.complete();
              })
              .catch(error => {
                console.error(`Error fetching movie details for ID ${movieId}:`, error);
                observer.error(error);
              });
          }).pipe(
            // Cache the result for 5 minutes (300000ms) and share it with all subscribers
            // Buffer size of 1 means we only keep the latest value
            shareReplay({ bufferSize: 1, refCount: false, windowTime: 300000 })
          );
        })
      );
    }

    return this.movieDetailsCache[movieId];
  }

  /**
   * Manually refreshes the movie details cache for a specific movie
   * @param movieId - The ID of the movie to refresh (optional)
   */
  refreshMovieDetailsCache(movieId?: number): void {
    if (movieId) {
      // If a specific movie ID is provided, clear only that cache
      delete this.movieDetailsCache[movieId];
    } else {
      // Otherwise clear all movie details caches
      this.movieDetailsCache = {};
    }

    // Trigger a refresh
    this.refreshMovieDetailsCache$.next(true);
  }

  /**
   * Fetches detailed information about a specific TV show
   * @param tvShowId - The ID of the TV show to fetch details for
   * @param forceRefresh - Whether to force a refresh of the cache
   * @returns An Observable containing the TvShowDetails object
   */
  getTVShowDetails(tvShowId: number, forceRefresh: boolean = false): Observable<TvShowDetails> {
    // Force refresh if requested
    if (forceRefresh) {
      this.refreshTVShowDetailsCache(tvShowId);
    }

    // Create the cache if it doesn't exist for this TV show
    if (!this.tvShowDetailsCache[tvShowId]) {
      this.tvShowDetailsCache[tvShowId] = this.refreshTVShowDetailsCache$.pipe(
        // Only proceed when refresh is triggered
        switchMap(() => {
          // Use the Firebase Function to get the data
          return new Observable<TvShowDetails>(observer => {
            this.getTmdbData('tv', undefined, undefined, 'append_to_response=credits,videos,similar,recommendations', tvShowId)
              .then((response: any) => {
                observer.next(response as TvShowDetails);
                observer.complete();
              })
              .catch(error => {
                console.error(`Error fetching TV show details for ID ${tvShowId}:`, error);
                observer.error(error);
              });
          }).pipe(
            // Cache the result for 5 minutes (300000ms) and share it with all subscribers
            // Buffer size of 1 means we only keep the latest value
            shareReplay({ bufferSize: 1, refCount: false, windowTime: 300000 })
          );
        })
      );
    }

    return this.tvShowDetailsCache[tvShowId];
  }

  /**
   * Manually refreshes the TV show details cache for a specific TV show
   * @param tvShowId - The ID of the TV show to refresh (optional)
   */
  refreshTVShowDetailsCache(tvShowId?: number): void {
    if (tvShowId) {
      // If a specific TV show ID is provided, clear only that cache
      delete this.tvShowDetailsCache[tvShowId];
    } else {
      // Otherwise clear all TV show details caches
      this.tvShowDetailsCache = {};
    }

    // Trigger a refresh
    this.refreshTVShowDetailsCache$.next(true);
  }

  /**
   * Fetches watch providers for a movie or TV show
   * @param mediaId - The ID of the movie or TV show
   * @param mediaType - The type of media ('movie' or 'tv')
   * @returns An Observable containing the watch providers data
   */
  getWatchProviders(mediaId: number, mediaType: 'movie' | 'tv'): Observable<WatchProvidersResponse> {
    return from(this.getTmdbData(`${mediaType}/${mediaId}/watch/providers`) as Promise<WatchProvidersResponse>);
  }

  /**
   * Adds a movie or TV show to the user's favorites collection in Firestore
   * @param mediaItem - The movie or TV show details to add to favorites
   * @param mediaType - The type of media ('movie' or 'tvshow')
   * @returns Promise that resolves when the operation is complete
   * @throws Error if the user is not authenticated
   */
  addFavorites(mediaItem: MovieDetails | TvShowDetails, mediaType: 'movie' | 'tvshow'): Promise<void> {
    try {
      // Check if user is authenticated
      const userId = this.authService.getUserId();
      if (!userId) {
        return Promise.reject(new Error('User must be authenticated to add favorites'));
      }

      // Create a reference to the user's favorites collection
      const userDocRef = doc(this.firestore, 'users', userId);
      const favoritesCollection = collection(userDocRef, 'favorites');

      // Create a document with the media item data and type
      // We use the media item's ID as the document ID to prevent duplicates
      const docRef = doc(favoritesCollection, mediaItem.id.toString());

      // Prepare the data to store
      const favoriteData = {
        ...mediaItem,
        mediaType: mediaType, // Add the media type to distinguish between movies and TV shows
        addedAt: new Date().toISOString(), // Add timestamp for potential sorting/filtering
      };

      // Add the document to the collection
      return setDoc(docRef, favoriteData);
    } catch (error) {
      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  /**
   * Checks if a media item is in the user's favorites collection
   * @param mediaId - The ID of the media item to check
   * @returns Observable that emits true if the item is favorited, false otherwise
   */
  checkFavoriteStatus(mediaId: number): Observable<boolean> {
    try {
      // Check if user is authenticated
      const userId = this.authService.getUserId();
      if (!userId) {
        // If not authenticated, the item cannot be favorited
        return of(false);
      }

      // Create a reference to the document in the user's favorites collection
      const userDocRef = doc(this.firestore, 'users', userId);
      const favoritesCollection = collection(userDocRef, 'favorites');
      const docRef = doc(favoritesCollection, mediaId.toString());

      // Check if the document exists
      return from(getDoc(docRef)).pipe(
        switchMap(docSnap => {
          return of(docSnap.exists());
        })
      );
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return of(false);
    }
  }

  /**
   * Removes a media item from the user's favorites collection
   * @param mediaId - The ID of the media item to remove
   * @returns Promise that resolves when the operation is complete
   * @throws Error if the user is not authenticated
   */
  removeFavorite(mediaId: number): Promise<void> {
    try {
      // Check if user is authenticated
      const userId = this.authService.getUserId();
      if (!userId) {
        return Promise.reject(new Error('User must be authenticated to remove favorites'));
      }

      // Create a reference to the document in the user's favorites collection
      const userDocRef = doc(this.firestore, 'users', userId);
      const favoritesCollection = collection(userDocRef, 'favorites');
      const docRef = doc(favoritesCollection, mediaId.toString());

      // Delete the document from the collection
      return deleteDoc(docRef);
    } catch (error) {
      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  /**
   * Fetches all favorites from the user's favorites collection in Firestore
   * @returns Observable that emits an array of favorites (MovieDetails or TvShowDetails with additional fields)
   */
  getFavorites(): Observable<((MovieDetails | TvShowDetails) & Favorite)[]> {
    try {
      // Check if user is authenticated
      const userId = this.authService.getUserId();
      if (!userId) {
        // If not authenticated, return an empty array
        return of([]);
      }

      // Create a reference to the user's favorites collection
      const userDocRef = doc(this.firestore, 'users', userId);
      const favoritesCollection = collection(userDocRef, 'favorites');

      // Create a query ordered by addedAt (most recent first)
      const favoritesQuery = query(favoritesCollection, orderBy('addedAt', 'desc'));

      // Execute the query and transform the results
      return from(getDocs(favoritesQuery)).pipe(
        map(querySnapshot => {
          const favorites: ((MovieDetails | TvShowDetails) & Favorite)[] = [];

          querySnapshot.forEach(doc => {
            // Get the document data
            const data = doc.data() as ((MovieDetails | TvShowDetails) & Favorite);
            favorites.push(data);
          });

          return favorites;
        })
      );
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return of([]);
    }
  }

  /**
   * Adds a movie or TV show to the user's watchlist collection in Firestore
   * @param mediaItem - The movie or TV show details to add to watchlist
   * @param mediaType - The type of media ('movie' or 'tvshow')
   * @param showToast - Whether to show toast notifications (default: true)
   * @returns Promise that resolves when the operation is complete
   * @throws Error if the user is not authenticated
   */
  async addToWatchlist(mediaItem: MovieDetails | TvShowDetails, mediaType: 'movie' | 'tvshow', showToast: boolean = true): Promise<void> {
    try {
      // Check if user is authenticated
      const userId = this.authService.getUserId();
      if (!userId) {
        if (showToast) {
          this.toastService.error('You must be signed in to add items to your watchlist');
        }
        return Promise.reject(new Error('User must be authenticated to add to watchlist'));
      }

      // Create a reference to the user's watchlist collection
      const userDocRef = doc(this.firestore, 'users', userId);
      const watchlistCollection = collection(userDocRef, 'watchlist');

      // Create a document with the media item data and type
      // We use the media item's ID as the document ID to prevent duplicates
      const docRef = doc(watchlistCollection, mediaItem.id.toString());

      // Check if item already exists in watchlist
      const existingDoc = await getDoc(docRef);
      if (existingDoc.exists()) {
        const title = mediaType === 'movie'
          ? (mediaItem as MovieDetails).title
          : (mediaItem as TvShowDetails).name;
        if (showToast) {
          this.toastService.warning(`"${title}" is already in your watchlist`);
        }
        return Promise.resolve();
      }

      // Prepare the data to store
      const watchlistData = {
        ...mediaItem,
        mediaType: mediaType, // Add the media type to distinguish between movies and TV shows
        addedAt: new Date().toISOString(), // Add timestamp for potential sorting/filtering
      };

      // Add the document to the collection
      await setDoc(docRef, watchlistData);

      // Show success notification
      const title = mediaType === 'movie'
        ? (mediaItem as MovieDetails).title
        : (mediaItem as TvShowDetails).name;
      if (showToast) {
        this.toastService.success(`"${title}" added to watchlist`);
      }
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      if (showToast) {
        this.toastService.error('Failed to add item to watchlist');
      }
      throw error;
    }
  }

  /**
   * Checks if a media item is in the user's watchlist collection
   * @param mediaId - The ID of the media item to check
   * @returns Observable that emits true if the item is in watchlist, false otherwise
   */
  checkWatchlistStatus(mediaId: number): Observable<boolean> {
    try {
      // Check if user is authenticated
      const userId = this.authService.getUserId();
      if (!userId) {
        // If not authenticated, the item cannot be in watchlist
        return of(false);
      }

      // Create a reference to the document in the user's watchlist collection
      const userDocRef = doc(this.firestore, 'users', userId);
      const watchlistCollection = collection(userDocRef, 'watchlist');
      const docRef = doc(watchlistCollection, mediaId.toString());

      // Check if the document exists
      return from(getDoc(docRef)).pipe(
        switchMap(docSnap => {
          return of(docSnap.exists());
        })
      );
    } catch (error) {
      console.error('Error checking watchlist status:', error);
      return of(false);
    }
  }

  /**
   * Removes a media item from the user's watchlist collection
   * @param mediaId - The ID of the media item to remove
   * @param showToast - Whether to show toast notifications (default: true)
   * @returns Promise that resolves when the operation is complete
   * @throws Error if the user is not authenticated
   */
  async removeFromWatchlist(mediaId: number, showToast: boolean = true): Promise<void> {
    try {
      // Check if user is authenticated
      const userId = this.authService.getUserId();
      if (!userId) {
        if (showToast) {
          this.toastService.error('You must be signed in to remove items from your watchlist');
        }
        return Promise.reject(new Error('User must be authenticated to remove from watchlist'));
      }

      // Create a reference to the document in the user's watchlist collection
      const userDocRef = doc(this.firestore, 'users', userId);
      const watchlistCollection = collection(userDocRef, 'watchlist');
      const docRef = doc(watchlistCollection, mediaId.toString());

      // Get the document data before deletion to show the title in the notification
      const docSnap = await getDoc(docRef);
      let title = 'Item';
      if (docSnap.exists()) {
        const data = docSnap.data();
        title = data['title'] || data['name'] || 'Item';
      }

      // Delete the document from the collection
      await deleteDoc(docRef);

      // Show success notification
      if (showToast) {
        this.toastService.success(`"${title}" removed from watchlist`);
      }
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      if (showToast) {
        this.toastService.error('Failed to remove item from watchlist');
      }
      throw error;
    }
  }

  /**
   * Fetches all watchlist items from the user's watchlist collection in Firestore
   * @returns Observable that emits an array of watchlist items (MovieDetails or TvShowDetails with additional fields)
   */
  getWatchlist(): Observable<((MovieDetails | TvShowDetails) & Watchlist)[]> {
    try {
      // Check if user is authenticated
      const userId = this.authService.getUserId();
      if (!userId) {
        // If not authenticated, return an empty array
        return of([]);
      }

      // Create a reference to the user's watchlist collection
      const userDocRef = doc(this.firestore, 'users', userId);
      const watchlistCollection = collection(userDocRef, 'watchlist');

      // Create a query ordered by addedAt (most recent first)
      const watchlistQuery = query(watchlistCollection, orderBy('addedAt', 'desc'));

      // Execute the query and transform the results
      return from(getDocs(watchlistQuery)).pipe(
        map(querySnapshot => {
          const watchlist: ((MovieDetails | TvShowDetails) & Watchlist)[] = [];

          querySnapshot.forEach(doc => {
            // Get the document data
            const data = doc.data() as ((MovieDetails | TvShowDetails) & Watchlist);
            watchlist.push(data);
          });

          return watchlist;
        })
      );
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      return of([]);
    }
  }

  /**
   * Calls the AI recommendation Firebase Function
   * This function uses the Genkit AI-powered recommendation system to generate personalized
   * movie and TV show recommendations based on the user's favorites or natural language queries.
   *
   * @param count - Number of recommendations to request (default: 5)
   * @param naturalLanguageQuery - Optional natural language query for smart recommendations
   * @returns Promise containing the AI recommendation response
   * @throws Error if the user is not authenticated or if the API request fails
   */
  async getAiRecommendationsData(count: number = 5, naturalLanguageQuery?: string): Promise<AiRecommendationResponse> {
    return runInInjectionContext(this.environmentInjector, async() => {
      // Check if user is authenticated
      const userId = this.authService.getUserId();
      if (!userId) {
        throw new Error('User must be authenticated to get AI recommendations');
      }

      const callableGetRecommendations = httpsCallable(this.functions, 'getRecommendationsFlow');
      try {
        const requestData: any = {
          userId: userId,
          count: count
        };

        if (naturalLanguageQuery) {
          requestData.naturalLanguageQuery = naturalLanguageQuery;
        }

        const result = await callableGetRecommendations(requestData);
        return result.data as AiRecommendationResponse;
      } catch (error: any) {
        console.error('Error fetching AI recommendations from Cloud Function:', error);
        throw error;
      }
    })
  }

  /**
   * Saves "For You" AI recommendations to Firestore
   * @param userId - The user's ID
   * @param recommendations - The AI recommendations to save
   * @returns Promise that resolves when the save is complete
   */
  private async saveForYouRecommendationsToFirestore(userId: string, recommendations: AiRecommendationResponse): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'forYouAIRecommendations', userId);
      await setDoc(docRef, {
        ...recommendations,
        timestamp: new Date(),
        userId: userId
      });
      console.log('Successfully saved For You recommendations to Firestore');
    } catch (error) {
      console.error('Error saving For You recommendations to Firestore:', error);
      // Don't throw error - this is a background operation
    }
  }

  /**
   * Retrieves "For You" AI recommendations from Firestore
   * @param userId - The user's ID
   * @returns Promise that resolves with cached recommendations or null if not found
   */
  private async getForYouRecommendationsFromFirestore(userId: string): Promise<AiRecommendationResponse | null> {
    try {
      const docRef = doc(this.firestore, 'forYouAIRecommendations', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Check if the data is not too old (optional: you can add timestamp validation here)
        console.log('Successfully retrieved For You recommendations from Firestore');
        return {
          recommendations: data['recommendations'],
          reasoning: data['reasoning']
        };
      } else {
        console.log('No cached For You recommendations found in Firestore');
        return null;
      }
    } catch (error) {
      console.error('Error retrieving For You recommendations from Firestore:', error);
      return null;
    }
  }

  /**
   * Fetches AI-powered recommendations with caching
   * @param forceRefresh - Whether to force a refresh of the cache
   * @param count - Number of recommendations to request (default: 5)
   * @param naturalLanguageQuery - Optional natural language query for smart recommendations
   * @returns Observable containing the AI recommendation response
   */
  getAiRecommendations(forceRefresh: boolean = false, count: number = 5, naturalLanguageQuery?: string): Observable<AiRecommendationResponse> {
    // For natural language queries, always make a fresh call without caching
    // since queries are likely to be unique and we don't want cache conflicts
    if (naturalLanguageQuery) {
      return new Observable<AiRecommendationResponse>(observer => {
        this.getAiRecommendationsData(count, naturalLanguageQuery)
          .then((response) => {
            observer.next(response);
            observer.complete();
          })
          .catch(error => {
            console.error('Error fetching natural language AI recommendations:', error);
            observer.error(error);
          });
      });
    }

    // For favorites-based "For You" recommendations, use Firestore caching
    const userId = this.authService.getUserId();
    if (!userId) {
      return throwError(() => new Error('User must be authenticated to get AI recommendations'));
    }

    // Force refresh if requested
    if (forceRefresh) {
      this.refreshAiRecommendationsCache();
    }

    if (!this.aiRecommendationsCache) {
      this.aiRecommendationsCache = this.refreshAiRecommendationsCache$.pipe(
        // Only proceed when refresh is triggered
        switchMap(() => {
          return new Observable<AiRecommendationResponse>(observer => {
            // First, try to get cached recommendations from Firestore
            this.getForYouRecommendationsFromFirestore(userId)
              .then((cachedRecommendations) => {
                if (cachedRecommendations && !forceRefresh) {
                  // Return cached data from Firestore
                  console.log('Using cached For You recommendations from Firestore');
                  observer.next(cachedRecommendations);
                  observer.complete();

                  // Start background fetching for new recommendations
                  setTimeout(() => {
                    this.fetchBackgroundRecommendations(userId, cachedRecommendations.recommendations, count);
                  }, 100); // Small delay to ensure cached data is displayed first
                } else {
                  // No cached data or forced refresh - fetch from AI
                  console.log('Fetching fresh For You recommendations from AI');
                  this.getAiRecommendationsData(count)
                    .then((response) => {
                      // Save the new recommendations to Firestore for future use
                      this.saveForYouRecommendationsToFirestore(userId, response);
                      observer.next(response);
                      observer.complete();
                    })
                    .catch(error => {
                      console.error('Error fetching AI recommendations:', error);
                      observer.error(error);
                    });
                }
              })
              .catch(error => {
                console.error('Error checking Firestore cache, falling back to AI:', error);
                // If Firestore fails, fall back to AI call
                this.getAiRecommendationsData(count)
                  .then((response) => {
                    this.saveForYouRecommendationsToFirestore(userId, response);
                    observer.next(response);
                    observer.complete();
                  })
                  .catch(aiError => {
                    console.error('Error fetching AI recommendations:', aiError);
                    observer.error(aiError);
                  });
              });
          }).pipe(
            // Cache the result for 30 minutes (1800000ms) and share it with all subscribers
            // Buffer size of 1 means we only keep the latest value
            shareReplay({ bufferSize: 1, refCount: false, windowTime: 1800000 })
          );
        })
      );
    }
    return this.aiRecommendationsCache;
  }

  /**
   * Manually refreshes the AI recommendations cache
   */
  refreshAiRecommendationsCache(): void {
    // Clear the cache
    this.aiRecommendationsCache = null;

    // Trigger a refresh
    this.refreshAiRecommendationsCache$.next(true);
  }

  /**
   * Observable for new recommendations notifications
   */
  get newRecommendationsAvailable(): Observable<AiRecommendation[]> {
    return this.newRecommendationsAvailable$.asObservable();
  }

  /**
   * Gets pending new recommendations
   */
  getPendingNewRecommendations(): AiRecommendation[] {
    return this.pendingNewRecommendations;
  }

  /**
   * Applies new recommendations by merging unique ones with existing recommendations
   * @param currentRecommendations - Current recommendations displayed in UI
   * @returns Object containing updated recommendations array (max 5 items) and new reasoning
   */
  applyNewRecommendations(currentRecommendations: AiRecommendation[]): { recommendations: AiRecommendation[], reasoning: string } {
    if (this.pendingNewRecommendations.length === 0) {
      return { recommendations: currentRecommendations, reasoning: '' };
    }

    // Find unique recommendations (not already in current list)
    const uniqueNewRecommendations = this.pendingNewRecommendations.filter(newRec =>
      !currentRecommendations.some(currentRec => currentRec.tmdbId === newRec.tmdbId)
    );

    if (uniqueNewRecommendations.length === 0) {
      // No unique recommendations found
      this.pendingNewRecommendations = [];
      this.pendingNewReasoning = '';
      return { recommendations: currentRecommendations, reasoning: '' };
    }

    // Merge new unique recommendations with current ones, maintaining max 5 items
    const merged = [...uniqueNewRecommendations, ...currentRecommendations];
    const result = merged.slice(0, 5);

    // Get the new reasoning
    const newReasoning = this.pendingNewReasoning;

    // Clear pending recommendations and reasoning
    this.pendingNewRecommendations = [];
    this.pendingNewReasoning = '';

    return { recommendations: result, reasoning: newReasoning };
  }

  /**
   * Compares two recommendation arrays and returns unique recommendations from the new array
   * @param currentRecommendations - Current recommendations
   * @param newRecommendations - New recommendations to compare
   * @returns Array of unique recommendations from newRecommendations
   */
  private findUniqueRecommendations(currentRecommendations: AiRecommendation[], newRecommendations: AiRecommendation[]): AiRecommendation[] {
    return newRecommendations.filter(newRec =>
      !currentRecommendations.some(currentRec => currentRec.tmdbId === newRec.tmdbId)
    );
  }

  /**
   * Fetches fresh recommendations in the background and checks for new unique items
   * @param userId - User ID
   * @param currentRecommendations - Current recommendations displayed in UI
   * @param count - Number of recommendations to fetch
   */
  private fetchBackgroundRecommendations(userId: string, currentRecommendations: AiRecommendation[], count: number = 5): void {
    console.log('Fetching background recommendations for new updates...');

    this.getAiRecommendationsData(count)
      .then((response) => {
        // Compare with current recommendations to find unique ones
        const uniqueRecommendations = this.findUniqueRecommendations(currentRecommendations, response.recommendations);

        if (uniqueRecommendations.length > 0) {
          console.log(`Found ${uniqueRecommendations.length} new unique recommendations`);
          // Store pending recommendations and reasoning
          this.pendingNewRecommendations = response.recommendations;
          this.pendingNewReasoning = response.reasoning || '';
          // Notify subscribers about new recommendations
          this.newRecommendationsAvailable$.next(uniqueRecommendations);
          // Update Firestore cache with latest recommendations
          this.saveForYouRecommendationsToFirestore(userId, response);
        } else {
          console.log('No new unique recommendations found');
        }
      })
      .catch(error => {
        console.error('Error fetching background recommendations:', error);
        // Silently fail for background operations
      });
  }

  /**
   * Calls the AI review chat Firebase Function
   * @param mediaId - The ID of the movie or TV show
   * @param mediaType - The type of media ('movie' or 'tv')
   * @param message - The user's message
   * @param chatHistory - Previous messages in the chat
   * @returns Promise containing the AI's response
   */
  async getAiReviewChatResponse(mediaId: number, mediaType: 'movie' | 'tv', message: string, chatHistory: { role: 'user' | 'model', text: string }[] = []): Promise<{ response: string }> {
    return runInInjectionContext(this.environmentInjector, async() => {
      const callableAiReviewChat = httpsCallable(this.functions, 'aiReviewChat');
      try {
        const result = await callableAiReviewChat({
          mediaId,
          mediaType,
          message,
          chatHistory
        });
        return result.data as { response: string };
      } catch (error: any) {
        console.error('Error fetching AI review chat response:', error);
        throw error;
      }
    })

  }

  /**
   * Searches for movies or TV shows based on a query string
   * @param query - The search query
   * @param type - The type of media to search for ('movie' or 'tv')
   * @param page - The page number to fetch (default: 1)
   * @param forceRefresh - Whether to force a refresh of the cache
   * @returns An Observable containing an array of Movie or TvShow objects
   */
  searchMedia(query: string, type: 'movie' | 'tv', page: number = 1, forceRefresh: boolean = false): Observable<(Movie | TvShow)[]> {
    // If query is empty, return empty array
    if (!query.trim()) {
      return of([]);
    }

    // Force refresh if requested
    if (forceRefresh) {
      this.refreshSearchCache(query, type, page);
    }

    // Create cache key that includes query, type and page
    const cacheKey = `${type}_${query}_page${page}`;

    // Create the cache if it doesn't exist for this query, type and page
    if (!this.searchCache[cacheKey]) {
      this.searchCache[cacheKey] = this.refreshSearchCache$.pipe(
        // Only proceed when refresh is triggered
        switchMap(() => {
          // Use the Firebase Function to get the data
          return new Observable<(Movie | TvShow)[]>(observer => {
            this.getTmdbData('search/' + type, undefined, page, 'query=' + encodeURIComponent(query))
              .then((response: any) => {
                observer.next(response.results);
                observer.complete();
              })
              .catch(error => {
                console.error(`Error searching for ${type}:`, error);
                observer.error(error);
              });
          }).pipe(
            // Cache the result for 5 minutes (300000ms) and share it with all subscribers
            // Buffer size of 1 means we only keep the latest value
            shareReplay({ bufferSize: 1, refCount: false, windowTime: 300000 })
          );
        })
      );
    }

    return this.searchCache[cacheKey];
  }

  /**
   * Manually refreshes the search cache for a specific query, type and page
   * @param query - The search query
   * @param type - The type of media ('movie' or 'tv')
   * @param page - The page number (optional)
   */
  refreshSearchCache(query?: string, type?: 'movie' | 'tv', page?: number): void {
    if (query && type && page) {
      // If specific query, type and page are provided, clear only that cache
      const cacheKey = `${type}_${query}_page${page}`;
      delete this.searchCache[cacheKey];
    } else if (query && type) {
      // If only query and type are provided, clear all pages for that query and type
      Object.keys(this.searchCache).forEach(key => {
        if (key.startsWith(`${type}_${query}_page`)) {
          delete this.searchCache[key];
        }
      });
    } else if (type) {
      // If only type is provided, clear all queries for that type
      Object.keys(this.searchCache).forEach(key => {
        if (key.startsWith(`${type}_`)) {
          delete this.searchCache[key];
        }
      });
    } else {
      // Otherwise clear all search caches
      this.searchCache = {};
    }

    // Trigger a refresh
    this.refreshSearchCache$.next(true);
  }

  /**
   * Calls the guessMovieFromScreenshot Firebase Function to identify a movie or TV show from a screenshot
   * @param file - The base64-encoded image data
   * @param contentType - The content type of the image (e.g., 'image/jpeg')
   * @returns Promise containing the identification result
   * @throws Error if the API request fails
   */
  async guessMovieFromScreenshot(file: string, contentType: string): Promise<any> {
    return runInInjectionContext(this.environmentInjector, async() => {
      const guessMovieFunction = httpsCallable(this.functions, 'guessMovieFromScreenshot');

      try {
        const result = await guessMovieFunction({
          file: file,
          contentType: contentType
        });
        return result.data;
      } catch (error: any) {
        console.error('Error analyzing image:', error);
        throw error;
      }
    })
  }

  /**
   * Fetches movie/TV show identification from a screenshot without caching
   * Each image analysis should be unique and not cached since different images
   * should produce different results
   * @param file - The base64-encoded image data
   * @param contentType - The content type of the image
   * @returns Observable containing the identification result
   */
  getGuessMovieResult(file: string, contentType: string): Observable<any> {
    // Always create a fresh observable for each image analysis
    return new Observable<any>(observer => {
      this.guessMovieFromScreenshot(file, contentType)
        .then((response) => {
          observer.next(response);
          observer.complete();
        })
        .catch(error => {
          console.error('Error analyzing image:', error);
          observer.error(error);
        });
    });
  }

  /**
   * Manually refreshes the guess movie cache
   */
  refreshGuessMovieCache(): void {
    // Clear the cache
    this.guessMovieCache = null;

    // Trigger a refresh
    this.refreshGuessMovieCache$.next(true);
  }
}
