import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { TruncatedTextComponent } from '../../shared/components/truncated-text/truncated-text.component';
import { AiRecommendation } from '../../models/ai-recommendations.model';
import { RecommendationHistoryEntry } from '../../models/recommendation-history.model';
import { RecommendationHistoryService } from '../../services/recommendation-history/recommendation-history.service';

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
  @Input() aiRecommendations: AiRecommendation[] = [];
  @Input() aiRecommendationReasoning: string | null = null;
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;
  @Input() recommendationHistory: RecommendationHistoryEntry[] = [];
  @Input() showHistory: boolean = false;
  @Input() selectedHistoryEntry: RecommendationHistoryEntry | null = null;
  @Input() naturalLanguageQuery: string = '';
  @Input() historyService!: RecommendationHistoryService;

  @Output() loadAiRecommendations = new EventEmitter<boolean>();
  @Output() shareMedia = new EventEmitter<any>();
  @Output() naturalLanguageQueryChange = new EventEmitter<string>();
  @Output() onNaturalLanguageQuery = new EventEmitter<string>();
  @Output() clearNaturalLanguageQuery = new EventEmitter<void>();
  @Output() toggleHistoryView = new EventEmitter<void>();
  @Output() loadHistoryEntry = new EventEmitter<RecommendationHistoryEntry>();
  @Output() clearSelectedHistoryEntry = new EventEmitter<void>();

  onRefreshRecommendations(): void {
    this.loadAiRecommendations.emit(true);
  }

  onShareMedia(event: any): void {
    this.shareMedia.emit(event);
  }

  onQueryInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.naturalLanguageQueryChange.emit(target.value);
  }

  onGetRecommendations(): void {
    this.onNaturalLanguageQuery.emit(this.naturalLanguageQuery);
  }

  onClearQuery(): void {
    this.clearNaturalLanguageQuery.emit();
  }

  onToggleHistory(): void {
    this.toggleHistoryView.emit();
  }

  onLoadHistoryEntry(entry: RecommendationHistoryEntry): void {
    this.loadHistoryEntry.emit(entry);
  }

  onClearSelectedEntry(): void {
    this.clearSelectedHistoryEntry.emit();
  }

  onRemoveHistoryEntry(event: Event, entryId: string): void {
    event.stopPropagation();
    this.historyService.removeHistoryEntry(entryId);
  }

  onClearAllHistory(): void {
    this.historyService.clearHistory();
  }
}
