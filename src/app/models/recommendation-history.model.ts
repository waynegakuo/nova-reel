import { AiRecommendation } from './ai-recommendations.model';

/**
 * Interface for a single recommendation history entry
 */
export interface RecommendationHistoryEntry {
  id: string; // Unique identifier for the history entry
  query: string; // The natural language query used
  recommendations: AiRecommendation[]; // The recommendations returned
  reasoning?: string; // AI reasoning for the recommendations
  timestamp: number; // Unix timestamp when the query was made
  dateString: string; // Human-readable date string for display
}

/**
 * Interface for managing recommendation history storage
 */
export interface RecommendationHistoryStorage {
  entries: RecommendationHistoryEntry[];
  lastCleanup: number; // Timestamp of last cleanup operation
}

/**
 * Configuration for recommendation history management
 */
export const HISTORY_CONFIG = {
  STORAGE_KEY: 'nova_reel_recommendation_history',
  MAX_AGE_DAYS: 7, // Keep history for 7 days
  MAX_ENTRIES: 50, // Maximum number of entries to keep
  CLEANUP_INTERVAL_HOURS: 24 // Clean up old entries every 24 hours
} as const;
