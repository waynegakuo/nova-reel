/**
 * Interface for a single AI-recommended media item
 */
export interface AiRecommendation {
  title: string;
  type: 'movie' | 'tv';
  tmdbId: number;
  overview: string;
  posterPath: string;
}

/**
 * Interface for the complete AI recommendation response
 */
export interface AiRecommendationResponse {
  recommendations: AiRecommendation[];
  reasoning?: string;
}

/**
 * Interface for the input parameters to the AI recommendation function
 */
export interface AiRecommendationRequest {
  userId: string;
  count?: number;
}
