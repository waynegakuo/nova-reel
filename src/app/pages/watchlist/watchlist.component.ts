import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { MediaService } from '../../services/media/media.service';
import { AuthService } from '../../services/auth/auth.service';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { MovieDetails, TvShowDetails, Watchlist } from '../../models/media-details.model';
import { Movie, TvShow } from '../../models/media.model';

@Component({
  selector: 'app-watchlist',
  imports: [CommonModule, MediaCardComponent],
  templateUrl: './watchlist.component.html',
  styleUrl: './watchlist.component.scss'
})
export class WatchlistComponent implements OnInit {
  private mediaService = inject(MediaService);
  private authService = inject(AuthService);

  watchlist$: Observable<((MovieDetails | TvShowDetails) & Watchlist)[]> = new Observable();
  isLoading = true;
  isAuthenticated = false;

  ngOnInit() {
    // Check authentication status
    this.isAuthenticated = !!this.authService.getUserId();

    if (this.isAuthenticated) {
      // Load watchlist
      this.loadWatchlist();
    } else {
      this.isLoading = false;
    }
  }

  loadWatchlist() {
    this.isLoading = true;
    this.watchlist$ = this.mediaService.getWatchlist();
    this.watchlist$.subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading watchlist:', error);
        this.isLoading = false;
      }
    });
  }


  onShare(event: { item: Movie | TvShow, type: string }) {
    const title = 'type' in event.item && event.item.type === 'tvshow'
      ? (event.item as TvShow).name
      : (event.item as Movie).title;

    if (navigator.share) {
      navigator.share({
        title: `Check out ${title}`,
        text: `I found this great ${event.type}: ${title}`,
        url: window.location.href
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      const url = window.location.href;
      navigator.clipboard.writeText(`Check out ${title}: ${url}`);
      alert('Link copied to clipboard!');
    }
  }

  onRemoveFromWatchlist(mediaId: number): void {
    this.mediaService.removeFromWatchlist(mediaId).then(() => {
      // Reload watchlist to reflect changes
      this.loadWatchlist();
    }).catch(error => {
      console.error('Error removing from watchlist:', error);
      // Could add a toast notification here if needed
    });
  }
}
