import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Movie, TvShow } from '../../../models/media.model';
import { MediaService } from '../../../services/media/media.service';

@Component({
  selector: 'app-media-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-card.component.html',
  styleUrl: './media-card.component.scss'
})
export class MediaCardComponent {
  private router = inject(Router);
  private mediaService = inject(MediaService);

  @Input() item!: Movie | TvShow;
  @Input() type: 'movie' | 'tvshow' | undefined = 'movie';
  @Input() showRemoveFromFavorites: boolean = false;
  @Output() share = new EventEmitter<{ item: Movie | TvShow, type: string }>();
  @Output() removeFromFavorites = new EventEmitter<number>();

  // Helper method to determine if the item is a movie
  isMovie(): boolean {
    // For recommendations, use the type property as determinant
    if (this.type === 'movie' || this.type === 'tvshow') {
      return this.type === 'movie';
    }
    // For other media items, use the title property as determinant
    return 'title' in this.item;
  }

  // Helper method to get the title (works for both movies and TV shows)
  getTitle(): string {
    return this.isMovie()
      ? (this.item as Movie).title
      : (this.item as TvShow).name;
  }

  // Helper method to get the release date (works for both movies and TV shows)
  getReleaseDate(): string {
    return this.isMovie()
      ? (this.item as Movie).release_date
      : (this.item as TvShow).first_air_date;
  }

  // Method to handle share button click
  onShare(): void {
    this.share.emit({
      item: this.item,
      type: this.isMovie() ? 'movie' : 'tvshow'
    });
  }

  // Method to navigate to details page
  onViewDetails(): void {
    const type = this.isMovie() ? 'movie' : 'tvshow';
    this.router.navigate(['/details', type, this.item.id]);
  }

  // Method to handle remove from favorites
  onRemoveFromFavorites(): void {
    this.removeFromFavorites.emit(this.item.id);
  }


  // Helper method to get the full image URL
  getImageUrl(posterPath: string): string {
    if (!posterPath) {
      return 'assets/images/no-poster.png'; // Fallback image
    }

    // Check if the path already includes the base URL
    if (posterPath.startsWith('http')) {
      return posterPath;
    }

    // TMDB image base URL
    const baseUrl = 'https://image.tmdb.org/t/p/w500';

    // Ensure the path starts with a slash
    const path = posterPath.startsWith('/') ? posterPath : `/${posterPath}`;

    return `${baseUrl}${path}`;
  }
}
