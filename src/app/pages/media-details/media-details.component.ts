import {Component, OnInit, inject, signal, OnDestroy, effect} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MediaService } from '../../services/media/media.service';
import { MovieDetails, TvShowDetails, ProductionCompany, Network, Crew } from '../../models/media-details.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {Subject, takeUntil} from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-media-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-details.component.html',
  styleUrl: './media-details.component.scss'
})
export class MediaDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  router = inject(Router); // Made public for template access
  private mediaService = inject(MediaService);
  private sanitizer = inject(DomSanitizer);
  private authService = inject(AuthService);

  // Signals
  mediaType = signal<'movie' | 'tvshow'>('movie');
  mediaId = signal<number>(0);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  movieDetails = signal<MovieDetails | null>(null);
  tvShowDetails = signal<TvShowDetails | null>(null);
  trailerUrl = signal<SafeResourceUrl | null>(null);
  showTrailer = signal<boolean>(false);
  notification = signal<{message: string, type: 'success' | 'error'} | null>(null);
  isFavorited = signal<boolean>(false);

  // Authentication signals
  isAuthenticated = signal<boolean>(false);

  // Subject for managing subscriptions
  private destroy$ = new Subject<void>();

  constructor() {
    // Create an effect to track authentication state changes
    effect(() => {
      // This will run whenever authService.isAuthenticated signal changes
      this.isAuthenticated.set(this.authService.isAuthenticated());
    });
  }

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {
      const type = params.get('type');
      const id = params.get('id');

      if (!type || !id) {
        this.error.set('Invalid URL parameters');
        this.isLoading.set(false);
        return;
      }

      if (type !== 'movie' && type !== 'tvshow') {
        this.error.set('Invalid media type');
        this.isLoading.set(false);
        return;
      }

      const mediaId = parseInt(id, 10);
      if (isNaN(mediaId)) {
        this.error.set('Invalid media ID');
        this.isLoading.set(false);
        return;
      }

      this.mediaType.set(type as 'movie' | 'tvshow');
      this.mediaId.set(mediaId);
      this.loadMediaDetails();
    });
  }

  loadMediaDetails(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.isFavorited.set(false); // Reset favorite status

    if (this.mediaType() === 'movie') {
      this.mediaService.getMovieDetails(this.mediaId()).pipe(takeUntil(this.destroy$)).subscribe({
        next: (details) => {
          this.movieDetails.set(details);
          this.isLoading.set(false);

          // Check if this movie is in favorites
          this.checkFavoriteStatus();
        },
        error: (err) => {
          console.error('Error fetching movie details:', err);
          this.error.set('Failed to load movie details. Please try again later.');
          this.isLoading.set(false);
        }
      });
    } else {
      this.mediaService.getTVShowDetails(this.mediaId()).pipe(takeUntil(this.destroy$)).subscribe({
        next: (details) => {
          this.tvShowDetails.set(details);
          this.isLoading.set(false);

          // Check if this TV show is in favorites
          this.checkFavoriteStatus();
        },
        error: (err) => {
          console.error('Error fetching TV show details:', err);
          this.error.set('Failed to load TV show details. Please try again later.');
          this.isLoading.set(false);
        }
      });
    }
  }

  /**
   * Checks if the current media item is in favorites
   */
  private checkFavoriteStatus(): void {
    if (this.mediaId() > 0) {
      this.mediaService.checkFavoriteStatus(this.mediaId()).pipe(takeUntil(this.destroy$)).subscribe({
        next: (isFavorited) => {
          this.isFavorited.set(isFavorited);
        },
        error: (err) => {
          console.error('Error checking favorite status:', err);
          // Default to not favorited in case of error
          this.isFavorited.set(false);
        }
      });
    }
  }

  /**
   * Gets the full image URL for different image types
   * @param path - The image path
   * @param type - The type of image (poster, backdrop, profile)
   * @returns The full image URL
   */
  getImageUrl(path: string | null, type: 'poster' | 'backdrop' | 'profile'): string {
    if (!path) {
      // Return fallback image based on type
      return type === 'profile'
        ? 'assets/images/no-profile.jpg'
        : type === 'backdrop'
          ? 'assets/images/no-poster.png'
          : 'assets/images/no-poster.png';
    }

    // Check if the path already includes the base URL
    if (path.startsWith('http')) {
      return path;
    }

    // TMDB image base URL with size based on type
    let baseUrl = 'https://image.tmdb.org/t/p/';

    switch (type) {
      case 'poster':
        baseUrl += 'w500';
        break;
      case 'backdrop':
        baseUrl += 'w1280';
        break;
      case 'profile':
        baseUrl += 'w185';
        break;
    }

    // Ensure the path starts with a slash
    const imagePath = path.startsWith('/') ? path : `/${path}`;

    return `${baseUrl}${imagePath}`;
  }

  /**
   * Formats runtime in minutes to hours and minutes
   * @param minutes - The runtime in minutes
   * @returns Formatted runtime string (e.g., "2h 15m")
   */
  formatRuntime(minutes: number): string {
    if (!minutes) return 'N/A';

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours === 0) {
      return `${remainingMinutes}m`;
    } else if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}m`;
    }
  }

  /**
   * Formats currency values
   * @param value - The currency value
   * @returns Formatted currency string (e.g., "$1,000,000")
   */
  formatCurrency(value: number): string {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(value);
  }

  /**
   * Gets the language name from ISO code
   * @param code - The ISO language code
   * @returns The language name
   */
  getLanguageName(code: string): string {
    if (!code) return 'Unknown';

    // This is a simple mapping of common language codes
    const languages: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ru': 'Russian',
      'pt': 'Portuguese',
      'hi': 'Hindi'
    };

    return languages[code] || code;
  }

  /**
   * Formats production company names
   * @param companies - Array of production companies
   * @returns Comma-separated list of company names
   */
  getProductionCompanies(companies: ProductionCompany[]): string {
    if (!companies || companies.length === 0) return 'N/A';
    return companies.map(company => company.name).join(', ');
  }

  /**
   * Formats network names
   * @param networks - Array of networks
   * @returns Comma-separated list of network names
   */
  getNetworks(networks: Network[]): string {
    if (!networks || networks.length === 0) return 'N/A';
    return networks.map(network => network.name).join(', ');
  }

  /**
   * Filters and returns key crew members (director, writer, producer)
   * @param crew - Array of crew members
   * @returns Filtered array of key crew members
   */
  getKeyCrewMembers(crew: Crew[]): Crew[] {
    if (!crew || crew.length === 0) return [];

    // Get unique crew members by job
    const keyJobs = ['Director', 'Screenplay', 'Writer', 'Producer', 'Executive Producer'];
    const uniqueCrewMembers = new Map<string, Crew>();

    crew.forEach(member => {
      if (keyJobs.includes(member.job) && !uniqueCrewMembers.has(member.job)) {
        uniqueCrewMembers.set(member.job, member);
      }
    });

    return Array.from(uniqueCrewMembers.values());
  }

  /**
   * Gets the YouTube thumbnail URL
   * @param key - The YouTube video key
   * @returns The thumbnail URL
   */
  getYouTubeThumbnail(key: string): string {
    if (!key) return 'assets/images/no-image.jpg';
    return `https://img.youtube.com/vi/${key}/mqdefault.jpg`;
  }

  /**
   * Opens a YouTube trailer in a modal or new window
   * @param key - The YouTube video key
   */
  playTrailer(key: string): void {
    if (!key) return;

    // For a real implementation, you might want to use a modal dialog
    // For simplicity, we'll just open in a new window
    window.open(`https://www.youtube.com/watch?v=${key}`, '_blank');
  }

  /**
   * Shares the current media
   */
  shareMedia(): void {
    // This would be implemented with the Web Share API in a real app
    alert('Sharing functionality would be implemented here');
  }

  /**
   * Navigates to another media details page
   * @param type - The media type ('movie' or 'tvshow')
   * @param id - The media ID
   */
  navigateToDetails(type: 'movie' | 'tvshow', id: number): void {
    // Navigate to the details page
    this.router.navigate(['/details', type, id]);
  }

  /**
   * Toggles the favorite status of the current media item
   * @param mediaType - The type of media ('movie' or 'tvshow')
   */
  toggleFavorite(mediaType: 'movie' | 'tvshow'): void {
    // Clear any existing notification
    this.notification.set(null);

    // Check if user is authenticated
    if (!this.isAuthenticated()) {
      this.notification.set({
        message: 'Please sign in to add items to your favorites',
        type: 'error'
      });
      return;
    }

    try {
      if (this.isFavorited()) {
        // Remove from favorites
        this.mediaService.removeFavorite(this.mediaId())
          .then(() => {
            // Update favorite status
            this.isFavorited.set(false);

            // Show success notification
            const mediaName = mediaType === 'movie'
              ? this.movieDetails()?.title
              : this.tvShowDetails()?.name;

            this.notification.set({
              message: `${mediaName} has been removed from your favorites`,
              type: 'success'
            });

            // Clear notification after 3 seconds
            setTimeout(() => this.notification.set(null), 3000);
          })
          .catch(error => {
            console.error('Error removing from favorites:', error);
            this.notification.set({
              message: 'Failed to remove from favorites. Please try again.',
              type: 'error'
            });
          });
      } else {
        // Add to favorites
        if (mediaType === 'movie' && this.movieDetails()) {
          // Add movie to favorites
          this.mediaService.addFavorites(this.movieDetails()!, 'movie')
            .then(() => {
              // Update favorite status
              this.isFavorited.set(true);

              // Show success notification
              this.notification.set({
                message: `${this.movieDetails()!.title} has been added to your favorites`,
                type: 'success'
              });

              // Clear notification after 3 seconds
              setTimeout(() => this.notification.set(null), 3000);
            })
            .catch(error => {
              console.error('Error adding movie to favorites:', error);
              this.notification.set({
                message: 'Failed to add movie to favorites. Please try again.',
                type: 'error'
              });
            });
        } else if (mediaType === 'tvshow' && this.tvShowDetails()) {
          // Add TV show to favorites
          this.mediaService.addFavorites(this.tvShowDetails()!, 'tvshow')
            .then(() => {
              // Update favorite status
              this.isFavorited.set(true);

              // Show success notification
              this.notification.set({
                message: `${this.tvShowDetails()!.name} has been added to your favorites`,
                type: 'success'
              });

              // Clear notification after 3 seconds
              setTimeout(() => this.notification.set(null), 3000);
            })
            .catch(error => {
              console.error('Error adding TV show to favorites:', error);
              this.notification.set({
                message: 'Failed to add TV show to favorites. Please try again.',
                type: 'error'
              });
            });
        } else {
          // No valid media details available
          this.notification.set({
            message: 'Unable to add to favorites. Media details not available.',
            type: 'error'
          });
        }
      }
    } catch (error) {
      console.error('Error in toggleFavorite:', error);
      this.notification.set({
        message: 'An unexpected error occurred. Please try again.',
        type: 'error'
      });
    }
  }

  ngOnDestroy(): void {
    // Complete the subject to unsubscribe from all subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }
}
