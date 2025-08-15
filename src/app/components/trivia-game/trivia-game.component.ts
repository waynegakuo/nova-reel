import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, interval, Subscription } from 'rxjs';
import { TriviaService } from '../../services/trivia/trivia.service';
import { AuthService } from '../../services/auth/auth.service';
import {
  TriviaGameRequest,
  TriviaGameSession,
  TriviaQuestion,
  TriviaAnswer,
  TriviaGameResult
} from '../../models/trivia.model';

@Component({
  selector: 'app-trivia-game',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './trivia-game.component.html',
  styleUrl: './trivia-game.component.scss'
})
export class TriviaGameComponent implements OnInit, OnDestroy {
  private triviaService = inject(TriviaService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  // Game state signals
  currentSession = signal<TriviaGameSession | null>(null);
  currentQuestionIndex = signal<number>(0);
  selectedAnswer = signal<number | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  gameResult = signal<TriviaGameResult | null>(null);

  // Timer state
  questionStartTime = signal<number>(0);
  timeRemaining = signal<number>(30); // 30 seconds per question
  timerSubscription: Subscription | null = null;

  // Computed properties
  currentQuestion = computed(() => {
    const session = this.currentSession();
    const index = this.currentQuestionIndex();
    return session?.questions[index] || null;
  });

  progress = computed(() => {
    const session = this.currentSession();
    const index = this.currentQuestionIndex();
    if (!session) return 0;
    return ((index + 1) / session.questions.length) * 100;
  });

  isLastQuestion = computed(() => {
    const session = this.currentSession();
    const index = this.currentQuestionIndex();
    if (!session) return false;
    return index === session.questions.length - 1;
  });

  canSubmitAnswer = computed(() => {
    return this.selectedAnswer() !== null && !this.isLoading();
  });

  gameState = signal<'setup' | 'playing' | 'completed' | 'results'>('setup');

  ngOnInit() {
    // Check if we have route parameters for generating trivia
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['movieId'] || params['tvShowId'] || params['genre']) {
        this.generateTriviaFromParams(params);
      }
    });

    // Subscribe to current session changes
    this.triviaService.currentSession$
      .pipe(takeUntil(this.destroy$))
      .subscribe(session => {
        this.currentSession.set(session);
        if (session && session.status === 'in-progress') {
          this.gameState.set('playing');
          this.startQuestion();
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopTimer();
  }

  private generateTriviaFromParams(params: any) {
    const request: TriviaGameRequest = {
      mediaType: params['mediaType'] as 'movie' | 'tv',
      movieId: params['movieId'] ? parseInt(params['movieId']) : undefined,
      tvShowId: params['tvShowId'] ? parseInt(params['tvShowId']) : undefined,
      genre: params['genre'],
      difficulty: params['difficulty'] || 'mixed',
      questionCount: params['questionCount'] ? parseInt(params['questionCount']) : 5
    };

    this.generateTrivia(request);
  }

  generateTrivia(request: TriviaGameRequest) {
    this.isLoading.set(true);
    this.error.set(null);

    this.triviaService.generateTrivia(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading.set(false);
          // Session is automatically set by the service
          this.gameState.set('setup');
        },
        error: (error) => {
          this.isLoading.set(false);
          this.error.set(error.message || 'Failed to generate trivia questions');
        }
      });
  }

  startGame() {
    const session = this.currentSession();
    if (!session) return;

    this.isLoading.set(true);
    this.triviaService.startTriviaSession(session.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.gameState.set('playing');
          this.currentQuestionIndex.set(0);
          this.startQuestion();
        },
        error: (error) => {
          this.isLoading.set(false);
          this.error.set('Failed to start trivia session');
        }
      });
  }

  private startQuestion() {
    this.selectedAnswer.set(null);
    this.questionStartTime.set(Date.now());
    this.timeRemaining.set(30);
    this.startTimer();
  }

  private startTimer() {
    this.stopTimer();
    this.timerSubscription = interval(1000).subscribe(() => {
      const remaining = this.timeRemaining();
      if (remaining > 0) {
        this.timeRemaining.set(remaining - 1);
      } else {
        this.timeUp();
      }
    });
  }

  private stopTimer() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  }

  private timeUp() {
    this.stopTimer();
    if (this.selectedAnswer() === null) {
      // Auto-submit with no answer (incorrect)
      this.submitAnswer(-1);
    }
  }

  selectAnswer(answerIndex: number) {
    if (this.gameState() === 'playing' && !this.isLoading()) {
      this.selectedAnswer.set(answerIndex);
    }
  }

  submitAnswer(answerIndex?: number) {
    const question = this.currentQuestion();
    const session = this.currentSession();
    const selected = answerIndex !== undefined ? answerIndex : this.selectedAnswer();

    if (!question || !session || selected === null) return;

    this.stopTimer();
    this.isLoading.set(true);

    const timeSpent = (Date.now() - this.questionStartTime()) / 1000; // Convert to seconds

    this.triviaService.submitAnswer(question.id, selected, timeSpent)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (answer) => {
          this.isLoading.set(false);

          // Show answer feedback briefly before moving to next question
          setTimeout(() => {
            if (this.isLastQuestion()) {
              this.completeGame();
            } else {
              this.nextQuestion();
            }
          }, 2000); // Show result for 2 seconds
        },
        error: (error) => {
          this.isLoading.set(false);
          this.error.set('Failed to submit answer');
        }
      });
  }

  nextQuestion() {
    const nextIndex = this.currentQuestionIndex() + 1;
    this.currentQuestionIndex.set(nextIndex);
    this.startQuestion();
  }

  completeGame() {
    this.stopTimer();
    this.gameState.set('completed');

    this.triviaService.completeTriviaSession()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.gameResult.set(result);
          this.gameState.set('results');
        },
        error: (error) => {
          this.error.set('Failed to complete trivia session');
        }
      });
  }

  abandonGame() {
    if (confirm('Are you sure you want to abandon this trivia game?')) {
      this.triviaService.abandonSession()
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.router.navigate(['/']);
        });
    }
  }

  playAgain() {
    this.gameState.set('setup');
    this.gameResult.set(null);
    this.currentQuestionIndex.set(0);
    this.selectedAnswer.set(null);
    this.error.set(null);
  }

  goHome() {
    this.router.navigate(['/']);
  }

  // Utility methods for templates
  getAnswerClass(index: number): string {
    const selected = this.selectedAnswer();
    const question = this.currentQuestion();
    const session = this.currentSession();

    if (!question || !session || this.gameState() === 'playing') {
      return selected === index ? 'selected' : '';
    }

    // Show results after answer is submitted
    const currentAnswer = session.answers[this.currentQuestionIndex()];
    if (!currentAnswer) return '';

    if (index === question.correctAnswer) {
      return 'correct';
    } else if (index === currentAnswer.selectedAnswer && !currentAnswer.isCorrect) {
      return 'incorrect';
    }

    return '';
  }

  getPerformanceColor(): string {
    const result = this.gameResult();
    if (!result) return '';

    switch (result.performance) {
      case 'excellent': return 'text-green-500';
      case 'good': return 'text-blue-500';
      case 'average': return 'text-yellow-500';
      case 'needs-improvement': return 'text-red-500';
      default: return '';
    }
  }

  getPerformanceMessage(): string {
    const result = this.gameResult();
    if (!result) return '';

    switch (result.performance) {
      case 'excellent': return 'Outstanding! You\'re a true movie expert!';
      case 'good': return 'Great job! You know your movies well!';
      case 'average': return 'Not bad! Keep watching and learning!';
      case 'needs-improvement': return 'Room for improvement - time to binge some classics!';
      default: return '';
    }
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getTimerColor(): string {
    const remaining = this.timeRemaining();
    if (remaining <= 5) return 'text-red-500';
    if (remaining <= 10) return 'text-yellow-500';
    return 'text-green-500';
  }
}
