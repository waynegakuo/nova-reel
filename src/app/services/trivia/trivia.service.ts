import { inject, Injectable } from '@angular/core';
import { Observable, BehaviorSubject, from, of, throwError } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { FirebaseApp } from '@angular/fire/app';
import { getFunctions, httpsCallable } from '@angular/fire/functions';
import { Firestore, collection, doc, setDoc, getDoc, getDocs, query, orderBy, where, updateDoc } from '@angular/fire/firestore';
import { AuthService } from '../auth/auth.service';
import {
  TriviaGameRequest,
  TriviaGenerationResponse,
  TriviaGameSession,
  TriviaAnswer,
  TriviaGameResult,
  TriviaStats,
  TriviaFlowRequest,
  TriviaFlowResponse
} from '../../models/trivia.model';

@Injectable({
  providedIn: 'root'
})
export class TriviaService {
  private http = inject(HttpClient);
  private firebaseApp = inject(FirebaseApp);
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private functions;

  // Current game session state
  private currentSessionSubject = new BehaviorSubject<TriviaGameSession | null>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();

  // User's trivia statistics
  private userStatsSubject = new BehaviorSubject<TriviaStats | null>(null);
  public userStats$ = this.userStatsSubject.asObservable();

  constructor() {
    this.functions = getFunctions(this.firebaseApp, 'africa-south1');

    // Load user stats when service initializes
    const userId = this.authService.getUserId();
    if (userId) {
      this.loadUserStats(userId);
    } else {
      this.currentSessionSubject.next(null);
      this.userStatsSubject.next(null);
    }
  }

  /**
   * Generate a new trivia game session
   */
  generateTrivia(request: TriviaGameRequest): Observable<TriviaGenerationResponse> {
    // Check if user is authenticated
    const userId = this.authService.getUserId();
    if (!userId) {
      return throwError(() => new Error('User must be authenticated to generate trivia.'));
    }

    const generateTriviaFunction = httpsCallable<TriviaFlowRequest, TriviaFlowResponse>(
      this.functions,
      'generateTriviaFlow'
    );

    const triviaRequest: TriviaFlowRequest = {
      userId: userId,
      ...request
    };

    return from(generateTriviaFunction(triviaRequest)).pipe(
      map(result => {
        if (!result.data.success) {
          throw new Error(result.data.error || 'Failed to generate trivia');
        }

        const response: TriviaGenerationResponse = {
          sessionId: result.data.sessionId!,
          questions: result.data.questions!,
          mediaTitle: result.data.mediaInfo!.title,
          mediaYear: result.data.mediaInfo!.year,
          posterPath: result.data.mediaInfo!.posterPath,
          estimatedDuration: result.data.estimatedDuration!
        };

        // Create initial game session
        const gameSession: TriviaGameSession = {
          id: response.sessionId,
          userId: userId,
          movieId: request.movieId,
          tvShowId: request.tvShowId,
          mediaType: request.mediaType,
          mediaTitle: response.mediaTitle,
          posterPath: response.posterPath,
          genre: request.genre,
          questions: response.questions,
          answers: [],
          status: 'pending',
          startedAt: new Date(),
          totalTimeSpent: 0,
          score: 0,
          maxScore: response.questions.length
        };

        this.currentSessionSubject.next(gameSession);
        return response;
      }),
      catchError(error => {
        console.error('Error generating trivia:', error);
        return throwError(() => new Error('Failed to generate trivia questions. Please try again.'));
      })
    );
  }

  /**
   * Start a trivia game session
   */
  startTriviaSession(sessionId: string): Observable<boolean> {
    const currentSession = this.currentSessionSubject.value;
    if (!currentSession || currentSession.id !== sessionId) {
      return throwError(() => new Error('Invalid session'));
    }

    const updatedSession: TriviaGameSession = {
      ...currentSession,
      status: 'in-progress',
      startedAt: new Date()
    };

    // Update in Firestore
    const sessionDoc = doc(this.firestore, `triviaGameSessions/${sessionId}`);
    return from(updateDoc(sessionDoc, {
      status: 'in-progress',
      startedAt: new Date()
    })).pipe(
      map(() => {
        this.currentSessionSubject.next(updatedSession);
        return true;
      }),
      catchError(error => {
        console.error('Error starting trivia session:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Submit an answer for a question
   */
  submitAnswer(questionId: string, selectedAnswer: number, timeSpent: number): Observable<TriviaAnswer> {
    const currentSession = this.currentSessionSubject.value;
    if (!currentSession || currentSession.status !== 'in-progress') {
      return throwError(() => new Error('No active trivia session'));
    }

    const question = currentSession.questions.find(q => q.id === questionId);
    if (!question) {
      return throwError(() => new Error('Question not found'));
    }

    const isCorrect = selectedAnswer === question.correctAnswer;
    const answer: TriviaAnswer = {
      questionId,
      selectedAnswer,
      isCorrect,
      timeSpent,
      answeredAt: new Date()
    };

    // Update session with new answer
    const updatedAnswers = [...currentSession.answers, answer];
    const updatedScore = updatedAnswers.filter(a => a.isCorrect).length;
    const updatedTotalTime = currentSession.totalTimeSpent + timeSpent;

    const updatedSession: TriviaGameSession = {
      ...currentSession,
      answers: updatedAnswers,
      score: updatedScore,
      totalTimeSpent: updatedTotalTime
    };

    // Check if game is complete
    if (updatedAnswers.length === currentSession.questions.length) {
      updatedSession.status = 'completed';
      updatedSession.completedAt = new Date();
    }

    // Update Firestore
    const sessionDoc = doc(this.firestore, `triviaGameSessions/${currentSession.id}`);
    return from(updateDoc(sessionDoc, {
      answers: updatedAnswers,
      score: updatedScore,
      totalTimeSpent: updatedTotalTime,
      status: updatedSession.status,
      completedAt: updatedSession.completedAt
    })).pipe(
      map(() => {
        this.currentSessionSubject.next(updatedSession);

        // Update user stats if game is complete
        if (updatedSession.status === 'completed') {
          this.updateUserStats(updatedSession);
        }

        return answer;
      }),
      catchError(error => {
        console.error('Error submitting answer:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Complete the current trivia session and get results
   */
  completeTriviaSession(): Observable<TriviaGameResult> {
    const currentSession = this.currentSessionSubject.value;
    if (!currentSession) {
      return throwError(() => new Error('No active trivia session'));
    }

    const correctAnswers = currentSession.answers.filter(a => a.isCorrect).length;
    const totalQuestions = currentSession.questions.length;
    const percentage = (correctAnswers / totalQuestions) * 100;
    const averageTimePerQuestion = currentSession.totalTimeSpent / totalQuestions;

    let performance: 'excellent' | 'good' | 'average' | 'needs-improvement';
    if (percentage >= 90) performance = 'excellent';
    else if (percentage >= 70) performance = 'good';
    else if (percentage >= 50) performance = 'average';
    else performance = 'needs-improvement';

    // Calculate achievements
    const achievements: string[] = [];
    if (percentage === 100) achievements.push('Perfect Score');
    if (averageTimePerQuestion < 15) achievements.push('Speed Demon');
    if (percentage >= 80) achievements.push('Trivia Master');
    if (currentSession.questions.every(q => q.difficulty === 'hard') && percentage >= 60) {
      achievements.push('Hard Mode Champion');
    }

    const result: TriviaGameResult = {
      session: currentSession,
      percentage,
      correctAnswers,
      totalQuestions,
      averageTimePerQuestion,
      performance,
      achievements
    };

    // Clear current session
    this.currentSessionSubject.next(null);

    return of(result);
  }

  /**
   * Get user's trivia history
   */
  getTriviaHistory(): Observable<TriviaGameSession[]> {
    // Check if user is authenticated
    const userId = this.authService.getUserId();
    if (!userId) {
      return of([]);
    }

    const triviaCollection = collection(this.firestore, 'triviaGameSessions');
    const triviaQuery = query(
      triviaCollection,
      where('userId', '==', userId),
      where('status', '==', 'completed'),
      orderBy('completedAt', 'desc')
    );

    return from(getDocs(triviaQuery)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as TriviaGameSession));
      })
    );
  }

  /**
   * Load user statistics
   */
  private loadUserStats(userId: string): void {
    const statsDoc = doc(this.firestore, `triviaStats/${userId}`);
    from(getDoc(statsDoc)).subscribe(docSnap => {
      if (docSnap.exists()) {
        this.userStatsSubject.next(docSnap.data() as TriviaStats);
      } else {
        // Initialize empty stats
        const initialStats: TriviaStats = {
          userId,
          totalGames: 0,
          totalScore: 0,
          averageScore: 0,
          bestScore: 0,
          perfectScores: 0,
          totalTimeSpent: 0,
          achievements: []
        };
        this.userStatsSubject.next(initialStats);
      }
    });
  }

  /**
   * Update user statistics after completing a game
   */
  private updateUserStats(completedSession: TriviaGameSession): void {
    const currentStats = this.userStatsSubject.value;
    if (!currentStats) return;

    const sessionPercentage = (completedSession.score / completedSession.maxScore) * 100;
    const newTotalGames = currentStats.totalGames + 1;
    const newTotalScore = currentStats.totalScore + sessionPercentage;
    const newAverageScore = newTotalScore / newTotalGames;
    const newBestScore = Math.max(currentStats.bestScore, sessionPercentage);
    const newPerfectScores = sessionPercentage === 100 ? currentStats.perfectScores + 1 : currentStats.perfectScores;
    const newTotalTimeSpent = currentStats.totalTimeSpent + completedSession.totalTimeSpent;

    // Add new achievements
    const newAchievements = [...currentStats.achievements];
    if (sessionPercentage === 100 && !newAchievements.includes('First Perfect Score')) {
      newAchievements.push('First Perfect Score');
    }
    if (newTotalGames === 10 && !newAchievements.includes('Dedicated Player')) {
      newAchievements.push('Dedicated Player');
    }
    if (newPerfectScores >= 5 && !newAchievements.includes('Perfectionist')) {
      newAchievements.push('Perfectionist');
    }

    const updatedStats: TriviaStats = {
      ...currentStats,
      totalGames: newTotalGames,
      totalScore: newTotalScore,
      averageScore: newAverageScore,
      bestScore: newBestScore,
      perfectScores: newPerfectScores,
      totalTimeSpent: newTotalTimeSpent,
      achievements: newAchievements,
      lastPlayedAt: new Date()
    };

    // Update Firestore
    const statsDoc = doc(this.firestore, `triviaStats/${completedSession.userId}`);
    setDoc(statsDoc, updatedStats, { merge: true }).then(() => {
      this.userStatsSubject.next(updatedStats);
    });
  }

  /**
   * Abandon current trivia session
   */
  abandonSession(): Observable<boolean> {
    const currentSession = this.currentSessionSubject.value;
    if (!currentSession) {
      return of(false);
    }

    const sessionDoc = doc(this.firestore, `triviaGameSessions/${currentSession.id}`);
    return from(updateDoc(sessionDoc, {
      status: 'abandoned',
      completedAt: new Date()
    })).pipe(
      map(() => {
        this.currentSessionSubject.next(null);
        return true;
      }),
      catchError(() => of(false))
    );
  }

  /**
   * Get current session state
   */
  getCurrentSession(): TriviaGameSession | null {
    return this.currentSessionSubject.value;
  }

  /**
   * Get user stats
   */
  getUserStats(): TriviaStats | null {
    return this.userStatsSubject.value;
  }
}
