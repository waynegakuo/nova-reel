import {inject, Injectable} from '@angular/core';
import {Observable, shareReplay, BehaviorSubject, switchMap} from 'rxjs';
import {Movie, TvShow} from '../../models/media.model';
import {HttpClient} from '@angular/common/http';
import {FirebaseApp} from '@angular/fire/app';
import {getFunctions, httpsCallable} from '@angular/fire/functions';

@Injectable({
  providedIn: 'root'
})
export class MediaService {

  http = inject(HttpClient);
  firebaseApp = inject(FirebaseApp);
  private functions;

  constructor() {
    this.functions = getFunctions(this.firebaseApp, 'africa-south1');
  }

  // Cache storage for movies and TV shows
  private movieCache: Record<string, Observable<(Movie | TvShow)[]>> = {};
  private tvShowCache: Record<string, Observable<(Movie | TvShow)[]>> = {};

  // Refresh triggers for cache invalidation
  private refreshMoviesCache$ = new BehaviorSubject<boolean>(true);
  private refreshTVShowsCache$ = new BehaviorSubject<boolean>(true);

  /**
   * Fetches data from TMDB API through Firebase Cloud Function
   * @param endpoint - The TMDB API endpoint ('movie' or 'tv')
   * @param list - Optional parameter specifying the list type (e.g. 'popular', 'top_rated')
   * @returns Promise containing the API response data
   * @throws Error if the API request fails
   */
  async getTmdbData(endpoint: string, list?: string): Promise<unknown> {
    const callableGetTmdbData = httpsCallable(this.functions, 'getTmdbData');
    try {
      const result = await callableGetTmdbData({ endpoint: endpoint, list: list });
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
   * @returns An Observable containing an array of Movie or TvShow objects
   */
  getMovies(list: string, forceRefresh: boolean = false): Observable<(Movie | TvShow)[]> {
    // Force refresh if requested
    if (forceRefresh) {
      this.refreshMoviesCache(list);
    }

    // Create the cache if it doesn't exist for this list
    if (!this.movieCache[list]) {
      this.movieCache[list] = this.refreshMoviesCache$.pipe(
        // Only proceed when refresh is triggered
        switchMap(() => {
          // Use the Firebase Function to get the data
          return new Observable<(Movie | TvShow)[]>(observer => {
            this.getTmdbData('movie', list)
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

    return this.movieCache[list];
  }

  /**
   * Manually refreshes the movie cache for a specific list
   * @param list - The type of movie list to refresh
   */
  refreshMoviesCache(list?: string): void {
    // If a specific list is provided, clear only that cache
    if (list) {
      delete this.movieCache[list];
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
   * @returns An Observable containing an array of Movie or TvShow objects
   */
  getTVShows(list: string, forceRefresh: boolean = false): Observable<(Movie | TvShow)[]> {
    // Force refresh if requested
    if (forceRefresh) {
      this.refreshTVShowsCache(list);
    }

    // Create the cache if it doesn't exist for this list
    if (!this.tvShowCache[list]) {
      this.tvShowCache[list] = this.refreshTVShowsCache$.pipe(
        // Only proceed when refresh is triggered
        switchMap(() => {
          // Use the Firebase Function to get the data
          return new Observable<(Movie | TvShow)[]>(observer => {
            this.getTmdbData('tv', list)
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

    return this.tvShowCache[list];
  }

  /**
   * Manually refreshes the TV shows cache for a specific list
   * @param list - The type of TV show list to refresh
   */
  refreshTVShowsCache(list?: string): void {
    // If a specific list is provided, clear only that cache
    if (list) {
      delete this.tvShowCache[list];
    } else {
      // Otherwise clear all TV show caches
      this.tvShowCache = {};
    }

    // Trigger a refresh
    this.refreshTVShowsCache$.next(true);
  }
}
