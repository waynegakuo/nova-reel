import {Component, Input, Output, EventEmitter, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaCardComponent } from '../media-card/media-card.component';
import { Movie, TvShow } from '../../../models/media.model';
import { MediaService } from '../../../services/media/media.service';
import { MovieDetails, TvShowDetails } from '../../../models/media-details.model';

@Component({
  selector: 'app-media-grid',
  standalone: true,
  imports: [CommonModule, MediaCardComponent],
  templateUrl: './media-grid.component.html',
  styleUrl: './media-grid.component.scss'
})
export class MediaGridComponent {
  private mediaService = inject(MediaService);

  @Input() items: (Movie | TvShow)[] = [];
  @Input() type: 'movie' | 'tvshow' = 'movie';
  @Input() emptyMessage: string = 'No items found.';
  @Input() showRemoveFromFavorites: boolean = false;
  @Output() share = new EventEmitter<{ item: Movie | TvShow; type: string }>();
  @Output() removeFromFavorites = new EventEmitter<number>();
  @Output() addToWatchlist = new EventEmitter<{ item: Movie | TvShow; type: string }>();

  onShare(event: { item: Movie | TvShow; type: string }): void {
    this.share.emit(event);
  }

  onRemoveFromFavorites(mediaId: number): void {
    this.removeFromFavorites.emit(mediaId);
  }

  onAddToWatchlist(event: { item: Movie | TvShow; type: string }): void {
    // Call MediaService.addToWatchlist directly
    this.mediaService.addToWatchlist(event.item as MovieDetails | TvShowDetails, event.type as 'movie' | 'tvshow')
      .then(() => {
        console.log('Successfully added to watchlist');
      })
      .catch((error) => {
        console.error('Error adding to watchlist:', error);
      });
    // Keep emitting for backward compatibility
    this.addToWatchlist.emit(event);
  }
}
