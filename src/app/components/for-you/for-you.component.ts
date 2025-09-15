import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { TruncatedTextComponent } from '../../shared/components/truncated-text/truncated-text.component';
import { AiRecommendation } from '../../models/ai-recommendations.model';
import { MediaService } from '../../services/media/media.service';
import { MovieDetails, TvShowDetails } from '../../models/media-details.model';

@Component({
  selector: 'app-for-you',
  imports: [
    CommonModule,
    MediaCardComponent,
    TruncatedTextComponent
  ],
  templateUrl: './for-you.component.html',
  styleUrl: './for-you.component.scss'
})
export class ForYouComponent {
  private mediaService = inject(MediaService);

  @Input() forYouRecommendations: AiRecommendation[] = [];
  @Input() forYouRecommendationReasoning: string | null = null;
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;

  @Output() loadAiRecommendations = new EventEmitter<boolean>();
  @Output() shareMedia = new EventEmitter<any>();
  @Output() addToWatchlist = new EventEmitter<any>();

  onRefreshRecommendations(): void {
    this.loadAiRecommendations.emit(true);
  }

  onShareMedia(event: any): void {
    this.shareMedia.emit(event);
  }

  onAddToWatchlist(event: any): void {
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
