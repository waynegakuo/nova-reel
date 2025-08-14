import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaGridComponent } from '../../shared/components/media-grid/media-grid.component';
import { Favorite, MovieDetails, TvShowDetails } from '../../models/media-details.model';
import { MediaService } from '../../services/media/media.service';

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
  private mediaService = inject(MediaService);

  @Input() favorites: ((MovieDetails | TvShowDetails) & Favorite)[] = [];
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;

  @Output() shareMedia = new EventEmitter<any>();
  @Output() refreshFavorites = new EventEmitter<void>();

  onShareMedia(event: any): void {
    this.shareMedia.emit(event);
  }

  onRemoveFromFavorites(mediaId: number): void {
    this.mediaService.removeFavorite(mediaId).then(() => {
      // Emit event to refresh favorites list
      this.refreshFavorites.emit();
    }).catch(error => {
      console.error('Error removing from favorites:', error);
      // Could add a toast notification here if needed
    });
  }
}
