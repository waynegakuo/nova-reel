import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Movie, TvShow } from '../../../models/media.model';

@Component({
  selector: 'app-media-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './media-card.component.html',
  styleUrl: './media-card.component.scss'
})
export class MediaCardComponent {
  @Input() item!: Movie | TvShow;
  @Input() type: 'movie' | 'tvshow' = 'movie';

  @Output() share = new EventEmitter<{ item: Movie | TvShow, type: string }>();

  // Helper method to determine if the item is a movie
  isMovie(): boolean {
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
}
