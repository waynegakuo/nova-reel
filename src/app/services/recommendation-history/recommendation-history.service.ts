import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  RecommendationHistoryEntry,
  RecommendationHistoryStorage,
  HISTORY_CONFIG
} from '../../models/recommendation-history.model';
import { AiRecommendation } from '../../models/ai-recommendations.model';

@Injectable({
  providedIn: 'root'
})
export class RecommendationHistoryService {
  private historySubject = new BehaviorSubject<RecommendationHistoryEntry[]>([]);
  public history$ = this.historySubject.asObservable();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.loadHistory();
    this.performCleanup();
  }

  /**
   * Saves a new recommendation query and its results to history
   * @param query - The natural language query
   * @param recommendations - The AI recommendations returned
   * @param reasoning - Optional reasoning from the AI
   */
  saveToHistory(query: string, recommendations: AiRecommendation[], reasoning?: string): void {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || recommendations.length === 0) {
      return;
    }

    const now = Date.now();
    const entry: RecommendationHistoryEntry = {
      id: this.generateId(),
      query: trimmedQuery,
      recommendations,
      reasoning,
      timestamp: now,
      dateString: new Date(now).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    const storage = this.getStorageData();

    // Check if we already have a similar query recently (within last hour)
    const similarEntryIndex = storage.entries.findIndex(
      e => e.query.toLowerCase() === trimmedQuery.toLowerCase() &&
           (now - e.timestamp) < 3600000 // 1 hour in milliseconds
    );

    if (similarEntryIndex >= 0) {
      // Update existing entry instead of creating a new one
      storage.entries[similarEntryIndex] = entry;
    } else {
      // Add new entry at the beginning
      storage.entries.unshift(entry);

      // Keep only the most recent entries
      if (storage.entries.length > HISTORY_CONFIG.MAX_ENTRIES) {
        storage.entries = storage.entries.slice(0, HISTORY_CONFIG.MAX_ENTRIES);
      }
    }

    this.saveStorageData(storage);
    this.historySubject.next([...storage.entries]);
  }

  /**
   * Gets the current history entries
   * @returns Array of history entries
   */
  getHistory(): RecommendationHistoryEntry[] {
    return this.historySubject.value;
  }

  /**
   * Checks if there are any history entries
   * @returns True if history exists
   */
  hasHistory(): boolean {
    return this.historySubject.value.length > 0;
  }

  /**
   * Clears all history entries
   */
  clearHistory(): void {
    const storage: RecommendationHistoryStorage = {
      entries: [],
      lastCleanup: Date.now()
    };
    this.saveStorageData(storage);
    this.historySubject.next([]);
  }

  /**
   * Removes a specific history entry
   * @param id - The ID of the entry to remove
   */
  removeHistoryEntry(id: string): void {
    const storage = this.getStorageData();
    storage.entries = storage.entries.filter(entry => entry.id !== id);
    this.saveStorageData(storage);
    this.historySubject.next([...storage.entries]);
  }

  /**
   * Gets a specific history entry by ID
   * @param id - The ID of the entry to retrieve
   * @returns The history entry or undefined if not found
   */
  getHistoryEntry(id: string): RecommendationHistoryEntry | undefined {
    return this.historySubject.value.find(entry => entry.id === id);
  }

  /**
   * Loads history from localStorage
   */
  private loadHistory(): void {
    const storage = this.getStorageData();
    this.historySubject.next([...storage.entries]);
  }

  /**
   * Retrieves storage data from localStorage
   */
  private getStorageData(): RecommendationHistoryStorage {
    if (!isPlatformBrowser(this.platformId)) {
      return {
        entries: [],
        lastCleanup: 0
      };
    }

    try {
      const stored = localStorage.getItem(HISTORY_CONFIG.STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as RecommendationHistoryStorage;
        return {
          entries: Array.isArray(parsed.entries) ? parsed.entries : [],
          lastCleanup: parsed.lastCleanup || 0
        };
      }
    } catch (error) {
      console.warn('Failed to load recommendation history from localStorage:', error);
    }

    return {
      entries: [],
      lastCleanup: 0
    };
  }

  /**
   * Saves storage data to localStorage
   */
  private saveStorageData(storage: RecommendationHistoryStorage): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem(HISTORY_CONFIG.STORAGE_KEY, JSON.stringify(storage));
    } catch (error) {
      console.warn('Failed to save recommendation history to localStorage:', error);
    }
  }

  /**
   * Performs cleanup of old entries if needed
   */
  private performCleanup(): void {
    const storage = this.getStorageData();
    const now = Date.now();
    const cleanupInterval = HISTORY_CONFIG.CLEANUP_INTERVAL_HOURS * 60 * 60 * 1000;

    // Check if cleanup is needed
    if (now - storage.lastCleanup > cleanupInterval) {
      const maxAge = HISTORY_CONFIG.MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
      const oldestAllowed = now - maxAge;

      // Filter out old entries
      const originalLength = storage.entries.length;
      storage.entries = storage.entries.filter(entry => entry.timestamp > oldestAllowed);
      storage.lastCleanup = now;

      if (storage.entries.length !== originalLength) {
        console.log(`Cleaned up ${originalLength - storage.entries.length} old recommendation history entries`);
        this.saveStorageData(storage);
        this.historySubject.next([...storage.entries]);
      }
    }
  }

  /**
   * Generates a unique ID for history entries
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
