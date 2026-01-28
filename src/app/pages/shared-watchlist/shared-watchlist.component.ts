import { Component, inject, OnInit } from '@angular/core';

import { ActivatedRoute } from '@angular/router';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { Movie, TvShow } from '../../models/media.model';

interface SharedWatchlistItem {
  id: number;
  title: string;
  name?: string;
  mediaType: 'movie' | 'tvshow';
  poster_path: string;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  // Required MediaBase properties
  adult: boolean;
  backdrop_path: string;
  genre_ids: number[];
  original_language: string;
  popularity: number;
  vote_count: number;
  // Movie-specific properties (optional for TV shows)
  original_title?: string;
  video?: boolean;
  // TvShow-specific properties (optional for movies)
  origin_country?: string[];
  original_name?: string;
}

@Component({
  selector: 'app-shared-watchlist',
  imports: [MediaCardComponent],
  templateUrl: './shared-watchlist.component.html',
  styleUrl: './shared-watchlist.component.scss'
})
export class SharedWatchlistComponent implements OnInit {
  private route = inject(ActivatedRoute);

  sharedWatchlist: SharedWatchlistItem[] = [];
  isLoading = true;
  hasError = false;
  errorMessage = '';

  ngOnInit() {
    this.loadSharedWatchlist();
  }

  loadSharedWatchlist() {
    this.isLoading = true;
    this.hasError = false;

    // Get the encoded data from URL parameters
    this.route.queryParams.subscribe(params => {
      const encodedData = params['data'];

      if (!encodedData) {
        this.showError('No watchlist data found in the link.');
        return;
      }

      try {
        // Decode the watchlist data
        const decodedData = atob(encodedData);
        const watchlistData = JSON.parse(decodedData);

        if (!Array.isArray(watchlistData)) {
          this.showError('Invalid watchlist data format.');
          return;
        }

        this.sharedWatchlist = watchlistData;
        this.isLoading = false;
      } catch (error) {
        console.error('Error decoding shared watchlist:', error);
        this.showError('Failed to load shared watchlist. The link may be corrupted.');
      }
    });
  }

  private showError(message: string) {
    this.hasError = true;
    this.errorMessage = message;
    this.isLoading = false;
  }

  onShare(event: { item: Movie | TvShow, type: string }) {
    const item = event.item;
    const title = 'title' in item ? item.title : item.name;
    const mediaType = item.mediaType || (('title' in item) ? 'movie' : 'tvshow');
    const shareUrl = `${window.location.origin}/details/${mediaType}/${item.id}`;

    if (navigator.share) {
      navigator.share({
        title: `Check out ${title}`,
        text: `I found this great ${event.type}: ${title}`,
        url: shareUrl
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(`Check out ${title}: ${shareUrl}`);
      alert('Link copied to clipboard!');
    }
  }
}
