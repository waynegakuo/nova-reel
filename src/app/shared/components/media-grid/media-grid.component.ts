import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaCardComponent } from '../media-card/media-card.component';
import { Movie, TvShow } from '../../../models/media.model';

@Component({
  selector: 'app-media-grid',
  standalone: true,
  imports: [CommonModule, MediaCardComponent],
  templateUrl: './media-grid.component.html',
  styleUrl: './media-grid.component.scss'
})
export class MediaGridComponent {
  @Input() items: (Movie | TvShow)[] = [];
  @Input() type: 'movie' | 'tvshow' = 'movie';
  @Input() emptyMessage: string = 'No items found.';
  @Output() share = new EventEmitter<{ item: Movie | TvShow; type: string }>();

  onShare(event: { item: Movie | TvShow; type: string }): void {
    this.share.emit(event);
  }
}
