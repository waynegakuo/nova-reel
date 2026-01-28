import {Component, inject, signal, OnDestroy, computed} from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-user-auth',
  standalone: true,
  imports: [],
  templateUrl: './user-auth.component.html',
  styleUrl: './user-auth.component.scss'
})
export class UserAuthComponent implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Subject for managing subscriptions
  private destroy$ = new Subject<void>();

  // Signals
  isLoading = signal<boolean>(false);
  showDropdown = signal<boolean>(false);
  error = signal<string | null>(null);

  // Expose auth service signals to the template
  isAuthenticated = computed(() => this.authService.isAuthenticated());
  isAuthLoading = computed(() => this.authService.isLoading());

  constructor() {}

  /**
   * Signs in with Google
   */
  signInWithGoogle(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.authService.signInWithGoogle()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Google sign-in error:', err);
          this.error.set('Failed to sign in with Google. Please try again.');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Signs out the current user
   */
  signOut(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.showDropdown.set(false);

    this.authService.signOut()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Sign out error:', err);
          this.error.set('Failed to sign out. Please try again.');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Toggles the user dropdown menu
   */
  toggleDropdown(): void {
    this.showDropdown.update(value => !value);
  }

  /**
   * Closes the user dropdown menu
   */
  closeDropdown(): void {
    this.showDropdown.set(false);
  }

  /**
   * Gets the user's display name
   * @returns The user's display name or 'User' if not available
   */
  getUserDisplayName(): string {
    return this.authService.getUserDisplayName() || 'User';
  }

  /**
   * Gets the user's profile photo URL
   * @returns The user's profile photo URL or a default avatar
   */
  getUserPhotoUrl(): string {
    return this.authService.getUserPhotoUrl() || 'assets/images/default-avatar.png';
  }

  /**
   * Gets the user's email
   * @returns The user's email or null if not available
   */
  getUserEmail(): string | null {
    return this.authService.getUserEmail();
  }

  /**
   * Navigate to trivia history page
   */
  navigateToTriviaHistory(): void {
    this.closeDropdown();
    this.router.navigate(['/trivia-history']);
  }

  /**
   * Navigate to watchlist page
   */
  navigateToWatchlist(): void {
    this.closeDropdown();
    this.router.navigate(['/watchlist']);
  }

  /**
   * Lifecycle hook that is called when the component is destroyed
   * Completes the destroy$ Subject to unsubscribe from all subscriptions
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
