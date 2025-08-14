import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { TruncatedTextComponent } from '../../shared/components/truncated-text/truncated-text.component';
import { AiRecommendation } from '../../models/ai-recommendations.model';

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
  @Input() forYouRecommendations: AiRecommendation[] = [];
  @Input() forYouRecommendationReasoning: string | null = null;
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;

  @Output() loadAiRecommendations = new EventEmitter<boolean>();
  @Output() shareMedia = new EventEmitter<any>();

  onRefreshRecommendations(): void {
    this.loadAiRecommendations.emit(true);
  }

  onShareMedia(event: any): void {
    this.shareMedia.emit(event);
  }
}
