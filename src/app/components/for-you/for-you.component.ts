import { Component, Input, Output, EventEmitter, inject, OnInit, OnDestroy } from '@angular/core';

import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { TruncatedTextComponent } from '../../shared/components/truncated-text/truncated-text.component';
import { AiRecommendation } from '../../models/ai-recommendations.model';
import { MediaService } from '../../services/media/media.service';
import { MovieDetails, TvShowDetails } from '../../models/media-details.model';
import { Subject, takeUntil } from 'rxjs';
import { Analytics, logEvent } from '@angular/fire/analytics';

@Component({
  selector: 'app-for-you',
  imports: [
    MediaCardComponent,
    TruncatedTextComponent
],
  templateUrl: './for-you.component.html',
  styleUrl: './for-you.component.scss'
})
export class ForYouComponent implements OnInit, OnDestroy {
  private mediaService = inject(MediaService);
  private destroy$ = new Subject<void>();
  private analytics = inject(Analytics);

  @Input() forYouRecommendations: AiRecommendation[] = [];
  @Input() forYouRecommendationReasoning: string | null = null;
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;

  @Output() loadAiRecommendations = new EventEmitter<boolean>();
  @Output() shareMedia = new EventEmitter<any>();
  @Output() applyNewRecommendations = new EventEmitter<{ recommendations: AiRecommendation[], reasoning: string }>();

  // New recommendations notification system
  showNewRecommendationsButton = false;
  newRecommendationsCount = 0;

  ngOnInit(): void {
    // Subscribe to new recommendations notifications
    this.mediaService.newRecommendationsAvailable
      .pipe(takeUntil(this.destroy$))
      .subscribe(newRecommendations => {
        this.newRecommendationsCount = newRecommendations.length;
        this.showNewRecommendationsButton = true;
      });
  }

  onRefreshRecommendations(): void {
    this.loadAiRecommendations.emit(true);
    logEvent(this.analytics, 'refresh_for_you_recommendations');
  }

  onShareMedia(event: any): void {
    this.shareMedia.emit(event);
    logEvent(this.analytics, 'share_for_you_recommendation', { media_type: event.type, media_id: event.item.id });
  }

  onApplyNewRecommendations(): void {
    const updatedData = this.mediaService.applyNewRecommendations(this.forYouRecommendations);
    this.applyNewRecommendations.emit(updatedData);
    logEvent(this.analytics, 'apply_new_for_you_recommendations', { count: this.newRecommendationsCount });

    // Hide the notification button
    this.showNewRecommendationsButton = false;
    this.newRecommendationsCount = 0;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}
