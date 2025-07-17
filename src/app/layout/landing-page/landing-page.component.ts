import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { Movie, TvShow } from '../../models/media.model';
import {MediaService} from '../../services/media/media.service';
import {Subject, takeUntil} from 'rxjs';
import {MovieDetails, TvShowDetails, Favorite} from '../../models/media-details.model';

@Component({
  selector: 'app-landing-page',
  imports: [CommonModule, MediaCardComponent],
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
  activeTab = signal<string>('Movies');
  activeMovieCategory = signal<string>('popular');
  activeTVShowCategory = signal<string>('popular');
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Pagination signals
  currentMoviePage = signal<number>(1);
  currentTVShowPage = signal<number>(1);
  readonly MAX_PAGES = 5; // Maximum number of pages as per requirements

  // Subject for managing subscriptions
  private destroy$ = new Subject<void>();

  mediaService = inject(MediaService);


  ngOnInit(): void {
    this.loadMovies('popular');
    this.loadTVShows('popular');
  }

  ngOnDestroy(): void {
    // Complete the subject to unsubscribe from all subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Method to handle tab changes
  setActiveTab(tab: string): void {
    this.activeTab.set(tab);

    // Load favorites when the Favorites tab is selected
    if (tab === 'Favorites') {
      this.loadFavorites();
    }
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
