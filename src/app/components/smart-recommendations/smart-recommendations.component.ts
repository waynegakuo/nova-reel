import { Component, Input, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { TruncatedTextComponent } from '../../shared/components/truncated-text/truncated-text.component';
import { AiRecommendation } from '../../models/ai-recommendations.model';
import { RecommendationHistoryEntry } from '../../models/recommendation-history.model';
import { RecommendationHistoryService } from '../../services/recommendation-history/recommendation-history.service';
import { MediaService } from '../../services/media/media.service';
import { MovieDetails, TvShowDetails } from '../../models/media-details.model';
import { Analytics, logEvent } from '@angular/fire/analytics';

@Component({
  selector: 'app-smart-recommendations',
  imports: [
    CommonModule,
    MediaCardComponent,
    TruncatedTextComponent
  ],
  templateUrl: './smart-recommendations.component.html',
  styleUrl: './smart-recommendations.component.scss'
})
export class SmartRecommendationsComponent {
  private mediaService = inject(MediaService);
  private analytics = inject(Analytics);

  @Input() smartRecommendations: AiRecommendation[] = [];
  @Input() smartRecommendationReasoning: string | null = null;
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;
  @Input() recommendationHistory: RecommendationHistoryEntry[] = [];
  @Input() showHistory: boolean = false;
  @Input() selectedHistoryEntry: RecommendationHistoryEntry | null = null;
  @Input() naturalLanguageQuery: string = '';
  @Input() historyService!: RecommendationHistoryService;

  @Output() loadAiRecommendations = new EventEmitter<boolean>();
  @Output() shareMedia = new EventEmitter<any>();
  @Output() addToWatchlist = new EventEmitter<any>();
  @Output() naturalLanguageQueryChange = new EventEmitter<string>();
  @Output() onNaturalLanguageQuery = new EventEmitter<string>();
  @Output() clearNaturalLanguageQuery = new EventEmitter<void>();
  @Output() toggleHistoryView = new EventEmitter<void>();
  @Output() loadHistoryEntry = new EventEmitter<RecommendationHistoryEntry>();
  @Output() clearSelectedHistoryEntry = new EventEmitter<void>();

  onRefreshRecommendations(): void {
    this.loadAiRecommendations.emit(true);
    if (this.analytics) {
      logEvent(this.analytics, 'refresh_smart_recommendations');
    }
  }

  onShareMedia(event: any): void {
    this.shareMedia.emit(event);
    logEvent(this.analytics, 'share_smart_recommendation', { media_type: event.type, media_id: event.item.id });
  }

  onAddToWatchlist(event: any): void {
    // Call MediaService.addToWatchlist directly
    this.mediaService.addToWatchlist(event.item as MovieDetails | TvShowDetails, event.type as 'movie' | 'tvshow')
      .then(() => {
        console.log('Successfully added to watchlist');
        logEvent(this.analytics, 'add_to_watchlist', { media_type: event.type, media_id: event.item.id });
      })
      .catch((error) => {
        console.error('Error adding to watchlist:', error);
      });
    // Keep emitting for backward compatibility
    this.addToWatchlist.emit(event);
  }

  onQueryInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.naturalLanguageQueryChange.emit(target.value);
  }

  onGetRecommendations(): void {
    this.onNaturalLanguageQuery.emit(this.naturalLanguageQuery);
    logEvent(this.analytics, 'get_smart_recommendations', { query: this.naturalLanguageQuery });
  }

  onClearQuery(): void {
    this.clearNaturalLanguageQuery.emit();
    logEvent(this.analytics, 'clear_smart_recommendations_query');
  }

  onToggleHistory(): void {
    this.toggleHistoryView.emit();
    logEvent(this.analytics, 'toggle_smart_recommendations_history', { show: !this.showHistory });
  }

  onLoadHistoryEntry(entry: RecommendationHistoryEntry): void {
    this.loadHistoryEntry.emit(entry);
    logEvent(this.analytics, 'load_smart_recommendations_history_entry', { entry_id: entry.id });
  }

  onClearSelectedEntry(): void {
    this.clearSelectedHistoryEntry.emit();
    logEvent(this.analytics, 'clear_selected_history_entry');
  }

  onRemoveHistoryEntry(event: Event, entryId: string): void {
    event.stopPropagation();
    this.historyService.removeHistoryEntry(entryId);
    logEvent(this.analytics, 'remove_smart_recommendations_history_entry', { entry_id: entryId });
  }

  onClearAllHistory(): void {
    this.historyService.clearHistory();
    logEvent(this.analytics, 'clear_all_smart_recommendations_history');
  }
}
