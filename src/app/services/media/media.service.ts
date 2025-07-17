import {inject, Injectable} from '@angular/core';
import {Observable, shareReplay, BehaviorSubject, switchMap, from, of, map, throwError} from 'rxjs';
import {Movie, TvShow} from '../../models/media.model';
import {MovieDetails, TvShowDetails, Favorite} from '../../models/media-details.model';
import {HttpClient} from '@angular/common/http';
import {FirebaseApp} from '@angular/fire/app';
import {getFunctions, httpsCallable} from '@angular/fire/functions';
import {Firestore, collection, doc, setDoc, getDoc, deleteDoc, getDocs, query, orderBy, where} from '@angular/fire/firestore';
import {AuthService} from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class MediaService {

  http = inject(HttpClient);
  firebaseApp = inject(FirebaseApp);
  firestore = inject(Firestore);
  private authService = inject(AuthService);
  private functions;

  constructor() {
    this.functions = getFunctions(this.firebaseApp, 'africa-south1');
  }

  // Cache storage for movies and TV shows
  private movieCache: Record<string, Observable<(Movie | TvShow)[]>> = {};
  private tvShowCache: Record<string, Observable<(Movie | TvShow)[]>> = {};
  private movieDetailsCache: Record<number, Observable<MovieDetails>> = {};
  private tvShowDetailsCache: Record<number, Observable<TvShowDetails>> = {};

  // Refresh triggers for cache invalidation
  private refreshMoviesCache$ = new BehaviorSubject<boolean>(true);
  private refreshTVShowsCache$ = new BehaviorSubject<boolean>(true);
  private refreshMovieDetailsCache$ = new BehaviorSubject<boolean>(true);
  private refreshTVShowDetailsCache$ = new BehaviorSubject<boolean>(true);

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
}
