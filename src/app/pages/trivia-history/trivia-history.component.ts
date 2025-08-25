import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TriviaService } from '../../services/trivia/trivia.service';
import { AuthService } from '../../services/auth/auth.service';
import { TriviaGameSession, TriviaAnswer, TriviaQuestion } from '../../models/trivia.model';

@Component({
  selector: 'app-trivia-history',
  imports: [CommonModule],
  templateUrl: './trivia-history.component.html',
  styleUrl: './trivia-history.component.scss'
})
export class TriviaHistoryComponent implements OnInit {
  private triviaService = inject(TriviaService);
  private authService = inject(AuthService);
  public router = inject(Router);

  // Signals for reactive state management
  triviaHistory = signal<TriviaGameSession[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);
  expandedSessions = signal<Set<string>>(new Set());

  ngOnInit(): void {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
      return;
    }

    this.loadTriviaHistory();
  }

  private loadTriviaHistory(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.triviaService.getTriviaHistory().subscribe({
      next: (history) => {
        this.triviaHistory.set(history);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading trivia history:', err);
        this.error.set('Failed to load trivia history. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Calculate the percentage score for a trivia session
   */
  getScorePercentage(session: TriviaGameSession): number {
    return Math.round((session.score / session.maxScore) * 100);
  }

  /**
   * Get performance level based on score percentage
   */
  getPerformanceLevel(percentage: number): string {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 70) return 'good';
    if (percentage >= 50) return 'average';
    return 'needs-improvement';
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | any): string {
    if (!date) return 'Unknown';

    // Handle Firestore timestamp
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get the full poster URL for TMDB images
   */
  getPosterUrl(posterPath: string | null): string {
    if (!posterPath) return 'assets/images/no-poster.jpg';
    return `https://image.tmdb.org/t/p/w200${posterPath}`;
  }

  /**
   * Navigate to media details page
   */
  viewMediaDetails(session: TriviaGameSession): void {
    if (session.mediaId) {
      const routeType = session.mediaType === 'tv' ? 'tvshow' : session.mediaType;
      this.router.navigate(['/details', routeType, session.mediaId]);
    }
  }

  /**
   * Calculate average score across all games
   */
  calculateAverageScore(): number {
    const history = this.triviaHistory();
    if (history.length === 0) return 0;

    const totalPercentage = history.reduce((sum, session) => {
      return sum + this.getScorePercentage(session);
    }, 0);

    return Math.round(totalPercentage / history.length);
  }

  /**
   * Get number of perfect scores
   */
  getPerfectScores(): number {
    return this.triviaHistory().filter(session =>
      this.getScorePercentage(session) === 100
    ).length;
  }

  /**
   * Get performance level text for display
   */
  getPerformanceLevelText(level: string): string {
    switch (level) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'average': return 'Average';
      case 'needs-improvement': return 'Needs Work';
      default: return 'Unknown';
    }
  }

  /**
   * Format duration from seconds to readable format
   */
  formatDuration(seconds: number): string {
    if (!seconds || seconds < 0) return '0s';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }

  /**
   * Retry loading trivia history
   */
  retryLoading(): void {
    this.loadTriviaHistory();
  }

  /**
   * Toggle accordion expansion for a trivia session
   */
  toggleSessionExpansion(sessionId: string): void {
    const expanded = this.expandedSessions();
    const newExpanded = new Set(expanded);

    if (newExpanded.has(sessionId)) {
      newExpanded.delete(sessionId);
    } else {
      newExpanded.add(sessionId);
    }

    this.expandedSessions.set(newExpanded);
  }

  /**
   * Check if a session is expanded
   */
  isSessionExpanded(sessionId: string): boolean {
    return this.expandedSessions().has(sessionId);
  }

  /**
   * Get the user's answer for a specific question
   */
  getUserAnswer(session: TriviaGameSession, questionId: string): TriviaAnswer | undefined {
    return session.answers.find(answer => answer.questionId === questionId);
  }

  /**
   * Check if the user's answer was correct
   */
  isAnswerCorrect(session: TriviaGameSession, questionId: string): boolean {
    const userAnswer = this.getUserAnswer(session, questionId);
    return userAnswer ? userAnswer.isCorrect : false;
  }

  /**
   * Get the selected answer text for a question
   */
  getSelectedAnswerText(session: TriviaGameSession, question: TriviaQuestion): string {
    const userAnswer = this.getUserAnswer(session, question.id);
    if (userAnswer && userAnswer.selectedAnswer >= 0 && userAnswer.selectedAnswer < question.options.length) {
      return question.options[userAnswer.selectedAnswer];
    }
    return 'No answer selected';
  }

  /**
   * Get the correct answer text for a question
   */
  getCorrectAnswerText(question: TriviaQuestion): string {
    if (question.correctAnswer >= 0 && question.correctAnswer < question.options.length) {
      return question.options[question.correctAnswer];
    }
    return 'Unknown';
  }
}
