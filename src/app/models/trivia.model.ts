// Trivia models for the Movie Trivia Challenge feature

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // Index of the correct answer in options array
  explanation?: string; // Optional explanation for the answer
  difficulty: 'easy' | 'medium' | 'hard';
  category: string; // e.g., 'plot', 'cast', 'production', 'general'
}

export interface TriviaAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number; // Time in seconds
  answeredAt: Date;
}

export interface TriviaGameSession {
  id: string;
  userId: string;
  mediaId?: number;
  mediaType: 'movie' | 'tv';
  mediaTitle: string;
  posterPath?: string; // Poster image path from TMDB
  genre?: string; // For genre-based trivia
  questions: TriviaQuestion[];
  answers: TriviaAnswer[];
  status: 'pending' | 'in-progress' | 'completed' | 'abandoned';
  startedAt: Date;
  completedAt?: Date;
  totalTimeSpent: number; // Total time in seconds
  score: number;
  maxScore: number;
}

export interface TriviaGameResult {
  session: TriviaGameSession;
  percentage: number;
  correctAnswers: number;
  totalQuestions: number;
  averageTimePerQuestion: number;
  performance: 'excellent' | 'good' | 'average' | 'needs-improvement';
  achievements?: string[]; // e.g., 'Perfect Score', 'Speed Demon', 'Movie Buff'
}

export interface TriviaGameRequest {
  mediaId?: number;
  mediaType: 'movie' | 'tv';
  genre?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount?: number; // Default 5-10 questions
  categories?: string[]; // Specific categories to focus on
}

export interface TriviaGenerationResponse {
  sessionId: string;
  questions: TriviaQuestion[];
  mediaTitle: string;
  mediaYear?: string;
  posterPath?: string;
  estimatedDuration: number; // Estimated time in minutes
}

export interface TriviaStats {
  userId: string;
  totalGames: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
  perfectScores: number;
  favoriteGenre?: string;
  totalTimeSpent: number; // Total time across all games in seconds
  achievements: string[];
  lastPlayedAt?: Date;
}

export interface TriviaLeaderboard {
  userId: string;
  username: string;
  totalScore: number;
  averageScore: number;
  gamesPlayed: number;
  perfectScores: number;
  rank: number;
}

// Response from the backend trivia generation function
export interface TriviaFlowResponse {
  sessionId: string;
  questions: TriviaQuestion[];
  mediaInfo: {
    title: string;
    year?: string;
    posterPath?: string;
    overview?: string;
  };
  estimatedDuration: number;
}

// Request format for the backend trivia generation function
export interface TriviaFlowRequest {
  userId: string;
  mediaId?: number;
  mediaType: 'movie' | 'tv';
  genre?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount?: number;
  categories?: string[];
}
