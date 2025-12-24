import { inject, Injectable } from '@angular/core';
import { Observable, BehaviorSubject, from, of, throwError } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { getFunctions, httpsCallable, Functions } from '@angular/fire/functions';
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
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  private functions = inject(Functions);

  // Current game session state
  private currentSessionSubject = new BehaviorSubject<TriviaGameSession | null>(null);
  public currentSession$ = this.currentSessionSubject.asObservable();

  // User's trivia statistics
  private userStatsSubject = new BehaviorSubject<TriviaStats | null>(null);
  public userStats$ = this.userStatsSubject.asObservable();

  constructor() {
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
      mediaType: request.mediaType,
      difficulty: request.difficulty,
      questionCount: request.questionCount,
      // Ensure mediaId is a number, not string
      mediaId: request.mediaId ? Number(request.mediaId) : undefined,
      // Ensure genre is a string when provided, exclude if undefined
      ...(request.genre && true ? { genre: request.genre } : {}),
      // Ensure categories is an array when provided, exclude if undefined
      ...(request.categories && Array.isArray(request.categories) ? { categories: request.categories } : {}),
    };

    return from(generateTriviaFunction(triviaRequest)).pipe(
      map(result => {
        // Access the result object from the response
        const data = result.data
        if (!data || !data.sessionId) {
          throw new Error('Invalid response from trivia generation service');
        }

        const response: TriviaGenerationResponse = {
          sessionId: data.sessionId,
          questions: data.questions,
          mediaInfo: data.mediaInfo,
          estimatedDuration: data.estimatedDuration
        };

        // Create initial game session
        const gameSession: TriviaGameSession = {
          id: response.sessionId,
          userId: userId,
          mediaId: request.mediaId,
          mediaType: request.mediaType,
          genre: request.genre,
          mediaInfo: data.mediaInfo,
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

    // Update local session state only - no need to save to Firestore during gameplay
    this.currentSessionSubject.next(updatedSession);
    return of(true);
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

    // Update local session state only - no need to save to Firestore during gameplay
    this.currentSessionSubject.next(updatedSession);

    // Update user stats if game is complete
    if (updatedSession.status === 'completed') {
      this.updateUserStats(updatedSession);
    }

    return of(answer);
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

    // Mark session as completed and add completion timestamp
    const completedSession = {
      ...currentSession,
      status: 'completed' as const,
      completedAt: new Date()
    };

    const result: TriviaGameResult = {
      session: completedSession,
      percentage,
      correctAnswers,
      totalQuestions,
      averageTimePerQuestion,
      performance,
      achievements
    };

    // Save completed session to Firebase using the new structure
    return from(this.saveTriviaSession(completedSession)).pipe(
      map(() => {
        // Clear current session after successful save
        this.currentSessionSubject.next(null);
        return result;
      }),
      catchError(error => {
        console.error('Error saving trivia session:', error);
        // Still clear session and return result even if save fails
        this.currentSessionSubject.next(null);
        return of(result);
      })
    );
  }

  /**
   * Save trivia session to Firebase using userID document with subcollection structure
   */
  private saveTriviaSession(session: TriviaGameSession): Promise<void> {
    try {
      // Check if user is authenticated
      const userId = this.authService.getUserId();
      if (!userId) {
        return Promise.reject(new Error('User must be authenticated to save trivia session'));
      }

      // Create a reference to the user's document
      const userDocRef = doc(this.firestore, 'users', userId);
      const triviaSessionsCollection = collection(userDocRef, 'triviaGameSessions');

      // Use the session ID as the document ID in the subcollection
      const sessionDocRef = doc(triviaSessionsCollection, session.id);

      // Sanitize session data to remove undefined values
      const sanitizedSession = this.sanitizeObjectForFirestore({
        ...session,
        completedAt: session.completedAt || new Date()
      });

      // Save the session data
      return setDoc(sessionDocRef, sanitizedSession);
    } catch (error) {
      console.error('Error saving trivia session:', error);
      throw error;
    }
  }

  /**
   * Sanitize object by removing undefined values to prevent Firebase errors
   */
  private sanitizeObjectForFirestore(obj: any): any {
    const sanitized: any = {};

    for (const key in obj) {
      if (obj.hasOwnProperty(key) && obj[key] !== undefined) {
        if (Array.isArray(obj[key])) {
          // Handle arrays - recursively sanitize each element
          sanitized[key] = obj[key].map((item: any) =>
            typeof item === 'object' && item !== null ? this.sanitizeObjectForFirestore(item) : item
          );
        } else if (typeof obj[key] === 'object' && obj[key] !== null && !(obj[key] instanceof Date)) {
          // Handle nested objects - recursively sanitize
          sanitized[key] = this.sanitizeObjectForFirestore(obj[key]);
        } else {
          // Handle primitive values and Dates
          sanitized[key] = obj[key];
        }
      }
    }

    return sanitized;
  }

  /**
   * Get user's trivia history
   */
  getTriviaHistory(): Observable<TriviaGameSession[]> {
    try {
      // Check if user is authenticated
      const userId = this.authService.getUserId();
      if (!userId) {
        return of([]);
      }

      // Create a reference to the user's trivia sessions subcollection
      const userDocRef = doc(this.firestore, 'users', userId);
      const triviaSessionsCollection = collection(userDocRef, 'triviaGameSessions');

      // Create a query ordered by completedAt (most recent first)
      const triviaQuery = query(
        triviaSessionsCollection,
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
    } catch (error) {
      console.error('Error fetching trivia history:', error);
      return of([]);
    }
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

    // Clear local session state only - no need to save abandoned sessions to Firestore
    this.currentSessionSubject.next(null);
    return of(true);
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
