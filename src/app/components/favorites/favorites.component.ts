import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaGridComponent } from '../../shared/components/media-grid/media-grid.component';
import { Favorite, MovieDetails, TvShowDetails } from '../../models/media-details.model';

@Component({
  selector: 'app-favorites',
  imports: [
    CommonModule,
    MediaGridComponent
  ],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.scss'
})
export class FavoritesComponent {
  @Input() favorites: ((MovieDetails | TvShowDetails) & Favorite)[] = [];
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;

  @Output() shareMedia = new EventEmitter<any>();

  onShareMedia(event: any): void {
    this.shareMedia.emit(event);
  }
}
