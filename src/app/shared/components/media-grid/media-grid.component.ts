import {Component, Input, Output, EventEmitter, inject} from '@angular/core';

import { MediaCardComponent } from '../media-card/media-card.component';
import { Movie, TvShow } from '../../../models/media.model';

@Component({
  selector: 'app-media-grid',
  standalone: true,
  imports: [MediaCardComponent],
  templateUrl: './media-grid.component.html',
  styleUrl: './media-grid.component.scss'
})
export class MediaGridComponent {

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
}
