import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { Movie, TvShow } from '../../models/media.model';
import {MediaService} from '../../services/media/media.service';
import {Subject, takeUntil, of} from 'rxjs';
import {MovieDetails, TvShowDetails, Favorite} from '../../models/media-details.model';
import {AiRecommendation, AiRecommendationResponse} from '../../models/ai-recommendations.model';
import {Router} from '@angular/router';
import { SearchBarComponent } from '../../shared/components/search/search-bar/search-bar.component';
import { SearchResultsComponent } from '../../shared/components/search/search-results/search-results.component';

@Component({
  selector: 'app-landing-page',
  imports: [
    CommonModule,
    MediaCardComponent,
    SearchBarComponent,
    SearchResultsComponent
  ],
  templateUrl: './landing-page.component.html',
  standalone: true,
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements OnInit, OnDestroy {
  title = signal('nova-reel');

  // Using signals for reactive state management
  movies = signal<Movie[]>([]);
  tvShows = signal<TvShow[]>([]);
  favorites = signal<((MovieDetails | TvShowDetails) & Favorite)[]>([]);
  aiRecommendations = signal<AiRecommendation[]>([]);
  aiRecommendationReasoning = signal<string | undefined>(undefined);
  activeTab = signal<string>('Movies');
  activeMovieCategory = signal<string>('popular');
  activeTVShowCategory = signal<string>('popular');
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Search related signals
  searchQuery = signal<string>('');
  searchResults = signal<(Movie | TvShow)[]>([]);
  isSearching = signal<boolean>(false);
  searchType = signal<'movie' | 'tv'>('movie');
  showSearchResults = signal<boolean>(false);

  // Cache for search results
  private searchResultsCache: { [key: string]: (Movie | TvShow)[] } = {};

  // Pagination signals
  currentMoviePage = signal<number>(1);
  currentTVShowPage = signal<number>(1);
  currentSearchPage = signal<number>(1);
  readonly MAX_PAGES = 5; // Maximum number of pages as per requirements

  // Subject for managing subscriptions
  private destroy$ = new Subject<void>();

  mediaService = inject(MediaService);
  private router = inject(Router);


  ngOnInit(): void {
    this.loadMovies('popular');
    this.loadTVShows('popular');
  }

  ngOnDestroy(): void {
    // Complete the subject to unsubscribe from all subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handles search events from the search bar component
   * @param query - The search query
   */
  onSearch(query: string): void {
    this.searchQuery.set(query);

    if (!query.trim()) {
      this.showSearchResults.set(false);
      this.searchResults.set([]);
      return;
    }

    // Set search type based on active tab
    const type = this.activeTab() === 'TV Shows' ? 'tv' : 'movie';
    this.searchType.set(type);

    // Clear cache if search query or type changes
    if (query !== this.searchQuery() || type !== this.searchType()) {
      this.searchResultsCache = {};
    }

    const page = this.currentSearchPage();
    const cacheKey = `${type}_${query}_page${page}`;

    // Check if results are in cache
    if (this.searchResultsCache[cacheKey]) {
      console.log(`Using cached search results for: ${cacheKey}`);
      this.searchResults.set(this.searchResultsCache[cacheKey]);
      this.showSearchResults.set(true);
      this.isSearching.set(false);
      return;
    }

    console.log(`Fetching search results from API for: ${cacheKey}`);

    // If not in cache, fetch from API
    this.mediaService.searchMedia(query, type, page)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          // Store results in cache
          this.searchResultsCache[cacheKey] = results;
          this.searchResults.set(results);
          this.showSearchResults.set(true);
          this.isSearching.set(false);
        },
        error: (err) => {
          console.error('Error searching media:', err);
          this.error.set('Failed to search. Please try again later.');
          this.isSearching.set(false);
        }
      });
  }

  /**
   * Clears the search query and results
   */
  clearSearch(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.showSearchResults.set(false);
    // Clear the search results cache
    this.searchResultsCache = {};
  }

  /**
   * Navigates to a specific search results page
   * @param page - The page number to navigate to
   */
  goToSearchPage(page: number): void {
    if (page < 1 || page > this.MAX_PAGES) return;
    this.currentSearchPage.set(page);
    this.onSearch(this.searchQuery());
  }

  /**
   * Navigates to the details page for a media item
   * @param media - The media item
   * @param type - The type of media ('movie' or 'tv')
   */
  navigateToDetails(media: Movie | TvShow, type: 'movie' | 'tv'): void {
    this.router.navigate(['/details', type, media.id]);
  }

  // Method to handle tab changes
  setActiveTab(tab: string): void {
    this.activeTab.set(tab);

    // Load favorites when the Favorites tab is selected
    if (tab === 'Favorites') {
      this.loadFavorites();
    } else if (tab === 'For You') {
      this.loadAiRecommendations();
    }
  }

  /**
   * Loads AI-powered personalized recommendations for the current user
   * This method fetches recommendations generated by the Genkit AI system
   * based on the user's favorite movies and TV shows. The recommendations
   * include a mix of movies and TV shows that the user might enjoy.
   *
   * @param forceRefresh - Whether to force a refresh of the cache (default: false)
   */
  loadAiRecommendations(forceRefresh: boolean = false): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.mediaService.getAiRecommendations(forceRefresh)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.aiRecommendations.set(data.recommendations);
          this.aiRecommendationReasoning.set(data.reasoning);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading AI recommendations:', err);
          if (err.message?.includes('authenticated')) {
            this.error.set('You must be logged in to get personalized recommendations.');
          } else {
            this.error.set('Failed to load recommendations. Please try again later.');
          }
          this.isLoading.set(false);
        }
      });
  }

  // Method to load favorites from Firestore
  loadFavorites(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.mediaService.getFavorites()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.favorites.set(data);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Error loading favorites:', err);
          this.error.set('Failed to load favorites. Please try again later.');
          this.isLoading.set(false);
        }
      });
  }

  // Method to load movies from the API
  loadMovies(list: string, forceRefresh: boolean = false, page?: number): void {
    // If changing categories, reset to page 1
    if (list !== this.activeMovieCategory()) {
      this.currentMoviePage.set(1);
    }

    // Use provided page or current page from signal
    const pageToLoad = page || this.currentMoviePage();

    this.isLoading.set(true);
    this.error.set(null);
    this.activeMovieCategory.set(list);

    this.mediaService.getMovies(list, forceRefresh, pageToLoad)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Type assertion to ensure we're dealing with Movie[]
          this.movies.set(data as Movie[]);
          this.isLoading.set(false);

          // If page was provided, update current page signal
          if (page) {
            this.currentMoviePage.set(page);
          }
        },
        error: (err) => {
          console.error('Error loading movies:', err);
          this.error.set('Failed to load movies. Please try again later.');
          this.isLoading.set(false);
        }
      });
  }

  // Method to refresh movies data
  refreshMovies(): void {
    const currentCategory = this.activeMovieCategory();
    this.loadMovies(currentCategory, true, this.currentMoviePage());
  }

  // Method to navigate to a specific movie page
  goToMoviePage(page: number): void {
    if (page < 1 || page > this.MAX_PAGES) return;
    this.currentMoviePage.set(page);
    this.loadMovies(this.activeMovieCategory(), false, page);
  }

  // Method to navigate to the next movie page
  nextMoviePage(): void {
    const nextPage = this.currentMoviePage() + 1;
    if (nextPage <= this.MAX_PAGES) {
      this.goToMoviePage(nextPage);
    }
  }

  // Method to navigate to the previous movie page
  prevMoviePage(): void {
    const prevPage = this.currentMoviePage() - 1;
    if (prevPage >= 1) {
      this.goToMoviePage(prevPage);
    }
  }

  // Method to load TV shows from the API
  loadTVShows(list: string, forceRefresh: boolean = false, page?: number): void {
    // If changing categories, reset to page 1
    if (list !== this.activeTVShowCategory()) {
      this.currentTVShowPage.set(1);
    }

    // Use provided page or current page from signal
    const pageToLoad = page || this.currentTVShowPage();

    this.isLoading.set(true);
    this.error.set(null);
    this.activeTVShowCategory.set(list);

    this.mediaService.getTVShows(list, forceRefresh, pageToLoad)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Type assertion to ensure we're dealing with TvShow[]
          this.tvShows.set(data as TvShow[]);
          this.isLoading.set(false);

          // If page was provided, update current page signal
          if (page) {
            this.currentTVShowPage.set(page);
          }
        },
        error: (err) => {
          console.error('Error loading TV shows:', err);
          this.error.set('Failed to load TV shows. Please try again later.');
          this.isLoading.set(false);
        }
      });
  }

  // Method to refresh TV shows data
  refreshTVShows(): void {
    const currentCategory = this.activeTVShowCategory();
    this.loadTVShows(currentCategory, true, this.currentTVShowPage());
  }

  // Method to navigate to a specific TV show page
  goToTVShowPage(page: number): void {
    if (page < 1 || page > this.MAX_PAGES) return;
    this.currentTVShowPage.set(page);
    this.loadTVShows(this.activeTVShowCategory(), false, page);
  }

  // Method to navigate to the next TV show page
  nextTVShowPage(): void {
    const nextPage = this.currentTVShowPage() + 1;
    if (nextPage <= this.MAX_PAGES) {
      this.goToTVShowPage(nextPage);
    }
  }

  // Method to navigate to the previous TV show page
  prevTVShowPage(): void {
    const prevPage = this.currentTVShowPage() - 1;
    if (prevPage >= 1) {
      this.goToTVShowPage(prevPage);
    }
  }

  // Method to handle sharing
  onShareMedia(event: { item: Movie | TvShow, type: string }): void {
    const title = 'title' in event.item ? event.item.title : event.item.name;
    const type = event.type === 'movie' ? 'Movie' : 'TV Show';

    // Create share data
    const shareData = {
      title: `Check out this ${type}: ${title}`,
      text: event.item.overview,
      url: window.location.href
    };

    // Use Web Share API if available
    if (navigator.share) {
      navigator.share(shareData)
        .then(() => console.log('Shared successfully'))
        .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support Web Share API
      alert(`Share: ${shareData.title}\n${shareData.text}\n${shareData.url}`);
    }
  }

}
