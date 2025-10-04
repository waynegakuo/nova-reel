import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Movie, TvShow } from '../../models/media.model';
import {MediaService} from '../../services/media/media.service';
import {Subject, takeUntil} from 'rxjs';
import {MovieDetails, TvShowDetails, Favorite} from '../../models/media-details.model';
import {AiRecommendation} from '../../models/ai-recommendations.model';
import {Router} from '@angular/router';
import { SearchBarComponent } from '../../shared/components/search/search-bar/search-bar.component';
import { SearchResultsComponent } from '../../shared/components/search/search-results/search-results.component';
import { LoadingMessagesService } from '../../services/loading-messages/loading-messages.service';
import { RecommendationHistoryService } from '../../services/recommendation-history/recommendation-history.service';
import { RecommendationHistoryEntry } from '../../models/recommendation-history.model';
import { TabNavigationComponent, TabItem } from '../../shared/components/tab-navigation/tab-navigation.component';
import { CategoryItem } from '../../shared/components/category-selector/category-selector.component';
import { MoviesAndTvShowsComponent } from '../../components/movies-and-tv-shows/movies-and-tv-shows.component';
import { FavoritesComponent } from '../../components/favorites/favorites.component';
import { ForYouComponent } from '../../components/for-you/for-you.component';
import { SmartRecommendationsComponent } from '../../components/smart-recommendations/smart-recommendations.component';
import { GuessTheMovieComponent } from '../../components/guess-the-movie/guess-the-movie.component';

@Component({
  selector: 'app-landing-page',
  imports: [
    CommonModule,
    SearchBarComponent,
    SearchResultsComponent,
    TabNavigationComponent,
    MoviesAndTvShowsComponent,
    FavoritesComponent,
    ForYouComponent,
    SmartRecommendationsComponent,
    GuessTheMovieComponent
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

  // Separate properties for For You tab (favorites-based recommendations)
  forYouRecommendations = signal<AiRecommendation[]>([]);
  forYouRecommendationReasoning = signal<string | null>(null);

  // Separate properties for Smart Recommendations tab (natural language-based recommendations)
  smartRecommendations = signal<AiRecommendation[]>([]);
  smartRecommendationReasoning = signal<string | null>(null);

  naturalLanguageQuery = signal<string>('');
  activeTab = signal<string>('Movies');
  activeMovieCategory = signal<string>('popular');
  activeTVShowCategory = signal<string>('popular');
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Recommendation history signals
  recommendationHistory = signal<RecommendationHistoryEntry[]>([]);
  hasRecentHistory = signal<boolean>(false);
  selectedHistoryEntry = signal<RecommendationHistoryEntry | null>(null);
  showHistory = signal<boolean>(false);

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

  // Static tabs array (Recent History is now integrated within Smart Recommendations)
  novaTabs = signal<string[]>(['Movies', 'TV Shows', 'Favorites', 'For You', 'Smart Recommendations', 'Guess the Movie']);

  // Tab configuration for new TabNavigationComponent
  get tabsConfig(): TabItem[] {
    return [
      { label: 'Movies', value: 'Movies' },
      { label: 'TV Shows', value: 'TV Shows' },
      { label: 'Favorites', value: 'Favorites' },
      { label: 'For You', value: 'For You', icon: 'auto_awesome' },
      { label: 'Smart Recommendations', value: 'Smart Recommendations', icon: 'psychology' },
      { label: 'Guess the Movie', value: 'Guess the Movie', icon: 'movie_filter' }
    ];
  }

  // Category configurations
  get movieCategories(): CategoryItem[] {
    return [
      { label: 'Popular', value: 'popular' },
      { label: 'Top Rated', value: 'top_rated' },
      { label: 'Now Playing', value: 'now_playing' },
      { label: 'Upcoming', value: 'upcoming' }
    ];
  }

  get tvShowCategories(): CategoryItem[] {
    return [
      { label: 'Popular', value: 'popular' },
      { label: 'Top Rated', value: 'top_rated' },
      { label: 'On The Air', value: 'on_the_air' },
      { label: 'Airing Today', value: 'airing_today' }
    ];
  }

  // Subject for managing subscriptions
  private destroy$ = new Subject<void>();

  mediaService = inject(MediaService);
  private router = inject(Router);
  loadingMessagesService = inject(LoadingMessagesService);
  historyService = inject(RecommendationHistoryService);


  ngOnInit(): void {
    this.loadMovies('popular');
    this.loadTVShows('popular');

    // Subscribe to recommendation history changes
    this.historyService.history$
      .pipe(takeUntil(this.destroy$))
      .subscribe(history => {
        this.recommendationHistory.set(history);
        this.hasRecentHistory.set(history.length > 0);
      });
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

    // Set isSearching to true before making the API call
    this.isSearching.set(true);
    this.loadingMessagesService.startSearchingMessages();
    this.showSearchResults.set(true);

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
          this.loadingMessagesService.stopSearchingMessages();
        },
        error: (err) => {
          console.error('Error searching media:', err);
          this.error.set('Failed to search. Please try again later.');
          this.isSearching.set(false);
          this.loadingMessagesService.stopSearchingMessages();
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
    const routeType = type === 'tv' ? 'tvshow' : type;
    this.router.navigate(['/details', routeType, media.id]);
  }

  // Method to handle tab changes
  setActiveTab(tab: string): void {
    this.activeTab.set(tab);

    // Load favorites when the Favorites tab is selected
    if (tab === 'Favorites') {
      this.loadFavorites();
    } else if (tab === 'For You') {
      // Clear natural language query for favorites-based recommendations
      this.naturalLanguageQuery.set('');
      this.loadAiRecommendations(false, false, true, 'For You'); // Don't force refresh, don't use natural language, target For You tab
    } else if (tab === 'Smart Recommendations') {
      // Smart Recommendations tab doesn't auto-load - it's user-driven
      // Just ensure we have a clean state if switching from another tab
      if (!this.naturalLanguageQuery().trim()) {
        this.smartRecommendations.set([]);
        this.smartRecommendationReasoning.set(null);
      }
    }
  }

  /**
   * Loads AI-powered personalized recommendations for the current user
   * This method fetches recommendations generated by the Genkit AI system
   * based on the user's favorite movies and TV shows, or natural language queries.
   * The recommendations include a mix of movies and TV shows that the user might enjoy.
   *
   * @param forceRefresh - Whether to force a refresh of the cache (default: false)
   * @param useNaturalLanguage - Whether to use natural language query (default: true for Smart Recommendations tab)
   * @param preserveQuery - Whether to preserve the existing natural language query (default: true)
   * @param targetTab - The target tab for which to load recommendations (default: current active tab)
   */
  loadAiRecommendations(forceRefresh: boolean = false, useNaturalLanguage: boolean = true, preserveQuery: boolean = true, targetTab?: string): void {
    this.isLoading.set(true);
    this.loadingMessagesService.startLoadingMessages();
    this.error.set(null);

    // Capture the target tab at the start to avoid race conditions
    const tabForRecommendations = targetTab || this.activeTab();

    // Determine which natural language query to use
    let queryToUse: string | undefined = undefined;

    if (useNaturalLanguage && tabForRecommendations !== 'For You') {
      const currentQuery = this.naturalLanguageQuery().trim();
      if (currentQuery && preserveQuery) {
        // Use the existing query if we're preserving it and it exists
        queryToUse = currentQuery;
      } else if (currentQuery) {
        // Use current query if not explicitly preserving but one exists
        queryToUse = currentQuery;
      }
    }

    const naturalLanguageQuery = queryToUse || undefined;

    this.mediaService.getAiRecommendations(forceRefresh, 5, naturalLanguageQuery)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Set the appropriate properties based on the target tab (captured at start)
          if (tabForRecommendations === 'For You') {
            this.forYouRecommendations.set(data.recommendations);
            this.forYouRecommendationReasoning.set(data.reasoning ?? null);
          } else if (tabForRecommendations === 'Smart Recommendations') {
            this.smartRecommendations.set(data.recommendations);
            this.smartRecommendationReasoning.set(data.reasoning ?? null);
          }

          this.isLoading.set(false);
          this.loadingMessagesService.stopLoadingMessages();

          // Save to history if this was a natural language query with results
          if (naturalLanguageQuery && data.recommendations.length > 0) {
            this.historyService.saveToHistory(naturalLanguageQuery, data.recommendations, data.reasoning);
          }
        },
        error: (err) => {
          console.error('Error loading AI recommendations:', err);
          if (err.message?.includes('authenticated')) {
            this.error.set('You must be logged in to get personalized recommendations.');
          } else {
            this.error.set('Failed to load recommendations. Please try again later.');
          }
          this.isLoading.set(false);
          this.loadingMessagesService.stopLoadingMessages();
        }
      });
  }

  /**
   * Handles natural language query input for AI recommendations
   * @param query - The natural language query from the user
   */
  onNaturalLanguageQuery(query: string): void {
    this.naturalLanguageQuery.set(query);
    this.loadAiRecommendations(true, true, true, 'Smart Recommendations'); // Force refresh with new query for Smart Recommendations tab
  }

  /**
   * Clears the natural language query and clears smart recommendations
   */
  clearNaturalLanguageQuery(): void {
    this.naturalLanguageQuery.set('');
    // Clear the recommendations and reasoning instead of making an API call
    this.smartRecommendations.set([]);
    this.smartRecommendationReasoning.set(null);
  }

  /**
   * Toggles the visibility of the history section within Smart Recommendations
   */
  toggleHistoryView(): void {
    this.showHistory.set(!this.showHistory());
    // Clear selected history entry when toggling history view
    if (!this.showHistory()) {
      this.clearSelectedHistoryEntry();
    }
  }

  /**
   * Loads a specific history entry and displays its recommendations
   * @param entry - The history entry to load
   */
  loadHistoryEntry(entry: RecommendationHistoryEntry): void {
    this.selectedHistoryEntry.set(entry);
    // Don't set smartRecommendations, smartRecommendationReasoning, or naturalLanguageQuery
    // to avoid duplication and unwanted text in textarea
    // The history entry will display its own recommendations in the history view
  }

  /**
   * Clears the selected history entry
   */
  clearSelectedHistoryEntry(): void {
    this.selectedHistoryEntry.set(null);
  }

  // Method to load favorites from Firestore
  loadFavorites(): void {
    this.isLoading.set(true);
    this.loadingMessagesService.startLoadingMessages();
    this.error.set(null);

    this.mediaService.getFavorites()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.favorites.set(data);
          this.isLoading.set(false);
          this.loadingMessagesService.stopLoadingMessages();
        },
        error: (err) => {
          console.error('Error loading favorites:', err);
          this.error.set('Failed to load favorites. Please try again later.');
          this.isLoading.set(false);
          this.loadingMessagesService.stopLoadingMessages();
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
    this.loadingMessagesService.startLoadingMessages();
    this.error.set(null);
    this.activeMovieCategory.set(list);

    this.mediaService.getMovies(list, forceRefresh, pageToLoad)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Type assertion to ensure we're dealing with Movie[]
          this.movies.set(data as Movie[]);
          this.isLoading.set(false);
          this.loadingMessagesService.stopLoadingMessages();

          // If page was provided, update current page signal
          if (page) {
            this.currentMoviePage.set(page);
          }
        },
        error: (err) => {
          console.error('Error loading movies:', err);
          this.error.set('Failed to load movies. Please try again later.');
          this.isLoading.set(false);
          this.loadingMessagesService.stopLoadingMessages();
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

  // Method to load TV shows from the API
  loadTVShows(list: string, forceRefresh: boolean = false, page?: number): void {
    // If changing categories, reset to page 1
    if (list !== this.activeTVShowCategory()) {
      this.currentTVShowPage.set(1);
    }

    // Use provided page or current page from signal
    const pageToLoad = page || this.currentTVShowPage();

    this.isLoading.set(true);
    this.loadingMessagesService.startLoadingMessages();
    this.error.set(null);
    this.activeTVShowCategory.set(list);

    this.mediaService.getTVShows(list, forceRefresh, pageToLoad)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Type assertion to ensure we're dealing with TvShow[]
          this.tvShows.set(data as TvShow[]);
          this.isLoading.set(false);
          this.loadingMessagesService.stopLoadingMessages();

          // If page was provided, update current page signal
          if (page) {
            this.currentTVShowPage.set(page);
          }
        },
        error: (err) => {
          console.error('Error loading TV shows:', err);
          this.error.set('Failed to load TV shows. Please try again later.');
          this.isLoading.set(false);
          this.loadingMessagesService.stopLoadingMessages();
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
