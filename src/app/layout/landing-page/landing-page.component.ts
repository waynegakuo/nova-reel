import {Component, inject, OnDestroy, OnInit, signal} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { Movie, TvShow } from '../../models/media.model';
import {MediaService} from '../../services/media/media.service';
import {Subject, takeUntil} from 'rxjs';

@Component({
  selector: 'app-landing-page',
  imports: [CommonModule, MediaCardComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent implements OnInit, OnDestroy {
  title = signal('nova-reel');

  // Using signals for reactive state management
  movies = signal<Movie[]>([]);
  tvShows = signal<TvShow[]>([]);
  activeTab = signal<string>('Movies');
  activeMovieCategory = signal<string>('popular');
  activeTVShowCategory = signal<string>('popular');
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

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
  }

  // Method to load movies from the API
  loadMovies(list: string, forceRefresh: boolean = false): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.activeMovieCategory.set(list);

    this.mediaService.getMovies(list, forceRefresh)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Type assertion to ensure we're dealing with Movie[]
          this.movies.set(data as Movie[]);
          this.isLoading.set(false);
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
    this.loadMovies(currentCategory, true);
  }

  // Method to load TV shows from the API
  loadTVShows(list: string, forceRefresh: boolean = false): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.activeTVShowCategory.set(list);

    this.mediaService.getTVShows(list, forceRefresh)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Type assertion to ensure we're dealing with TvShow[]
          this.tvShows.set(data as TvShow[]);
          this.isLoading.set(false);
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
    this.loadTVShows(currentCategory, true);
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
