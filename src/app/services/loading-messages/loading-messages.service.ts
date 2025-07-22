import { Injectable, signal, DestroyRef, inject, PLATFORM_ID, isDevMode } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { isPlatformBrowser } from '@angular/common';
import { fromEvent } from 'rxjs';

/**
 * Service for managing loading and searching messages with performance optimizations
 *
 * Performance optimizations include:
 * - Lazy loading of message arrays to reduce initial memory footprint
 * - Using requestAnimationFrame instead of setInterval for better performance
 * - Pausing animations when the tab is not visible to save CPU/battery
 * - Avoiding duplicate consecutive messages
 * - Throttling updates to reduce unnecessary renders
 * - Proper cleanup to prevent memory leaks
 * - SSR compatibility
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingMessagesService {
  // Enable debug mode in development environment
  private readonly debugMode = isDevMode();

  // Performance metrics
  private performanceMetrics = {
    messageUpdates: 0,
    animationFrames: 0,
    startTime: 0
  };
  // Lazy-loaded message arrays to reduce initial memory footprint
  private movieTvLoadingMessages: string[] | null = null;
  private searchingMessages: string[] | null = null;

  // Signals to hold the current messages
  private currentLoadingMessage = signal<string>("Loading content...");
  private currentSearchingMessage = signal<string>("Searching...");

  // Animation frame IDs for message rotation (more efficient than setInterval)
  private loadingAnimationId: number | null = null;
  private searchingAnimationId: number | null = null;

  // Timestamps for controlling animation frame rate
  private lastLoadingUpdateTime = 0;
  private lastSearchingUpdateTime = 0;

  // Default interval in ms (3 seconds)
  private readonly DEFAULT_INTERVAL = 3000;

  // Track if the page is visible
  private isPageVisible = true;

  // Flag to indicate if device has sufficient performance capabilities
  private hasAdequatePerformance = true;

  // Platform ID to check if we're running in a browser
  private platformId = inject(PLATFORM_ID);
  private destroyRef = inject(DestroyRef);

  constructor() {
    // Only set up visibility listeners in browser environment
    if (isPlatformBrowser(this.platformId)) {
      // Detect device performance capabilities
      this.detectDevicePerformance();

      // Handle page visibility changes to pause animations when tab is not visible
      fromEvent(document, 'visibilitychange')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.isPageVisible = document.visibilityState === 'visible';

          // Pause or resume animations based on visibility
          if (this.isPageVisible) {
            this.resumeAnimations();
          } else {
            this.pauseAnimations();
          }
        });
    }
  }

  /**
   * Detects if the device has adequate performance capabilities
   * to run animations without impacting user experience
   */
  private detectDevicePerformance(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      // Check for low-end device indicators

      // 1. Check if device has limited memory
      const limitedMemory = 'deviceMemory' in navigator &&
        (navigator as any).deviceMemory < 4;

      // 2. Check if device has limited CPU cores
      const limitedCores = 'hardwareConcurrency' in navigator &&
        navigator.hardwareConcurrency < 4;

      // 3. Check if device is in data saver mode
      const dataSaverEnabled = 'connection' in navigator &&
        (navigator as any).connection?.saveData === true;

      // 4. Check if device is on a slow connection
      const slowConnection = 'connection' in navigator &&
        ['slow-2g', '2g', '3g'].includes((navigator as any).connection?.effectiveType);

      // 5. Check if device has reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Disable animations if multiple indicators suggest a low-end device
      // or if user explicitly prefers reduced motion
      const performanceIssues = [limitedMemory, limitedCores, dataSaverEnabled, slowConnection];
      const issueCount = performanceIssues.filter(Boolean).length;

      this.hasAdequatePerformance = !(issueCount >= 2 || prefersReducedMotion);

      if (!this.hasAdequatePerformance && this.debugMode) {
        this.logPerformance('Animations disabled due to device performance constraints', {
          limitedMemory,
          limitedCores,
          dataSaverEnabled,
          slowConnection,
          prefersReducedMotion
        });
      }
    } catch (error) {
      // If any error occurs during detection, default to enabling animations
      this.hasAdequatePerformance = true;
      if (this.debugMode) {
        this.logPerformance('Error detecting device performance, defaulting to enabled animations', error);
      }
    }
  }

  /**
   * Checks if animations are enabled based on device capabilities
   * @returns Boolean indicating if animations are enabled
   */
  areAnimationsEnabled(): boolean {
    return this.hasAdequatePerformance;
  }

  /**
   * Manually enables or disables animations
   * This can be used to override the automatic detection
   * @param enabled Whether animations should be enabled
   */
  setAnimationsEnabled(enabled: boolean): void {
    if (this.hasAdequatePerformance !== enabled) {
      this.hasAdequatePerformance = enabled;
      this.logPerformance(`Animations ${enabled ? 'enabled' : 'disabled'} manually`);

      // Stop any running animations if disabled
      if (!enabled) {
        this.stopLoadingMessages();
        this.stopSearchingMessages();
      }
    }
  }

  /**
   * Lazy loads the movie/TV loading messages
   */
  private getMovieTvLoadingMessages(): string[] {
    if (!this.movieTvLoadingMessages) {
      this.movieTvLoadingMessages = [
        "Grabbing popcorn...",
        "Rolling out the red carpet...",
        "Cueing the dramatic music...",
        "Waiting for the director to yell 'Action!'...",
        "Adjusting the boom mic...",
        "Applying makeup to the stars...",
        "Checking if the sequel is better...",
        "Rewinding the VHS tape...",
        "Asking the critics what they think...",
        "Finding the best seat in the house...",
        "Waiting for post-credits scene...",
        "Searching for plot holes...",
        "Arguing about book vs. movie...",
        "Fixing CGI in post-production...",
        "Negotiating with streaming services...",
        "Convincing the studio for one more take...",
        "Editing out the blooper reel...",
        "Waiting for the slow-motion explosion...",
        "Practicing award acceptance speech...",
        "Checking Rotten Tomatoes score...",
        "Avoiding spoilers at all costs...",
        "Preparing for plot twist...",
        "Gathering the ensemble cast...",
        "Calculating box office numbers..."
      ];
    }
    return this.movieTvLoadingMessages;
  }

  /**
   * Lazy loads the searching messages
   */
  private getSearchingMessages(): string[] {
    if (!this.searchingMessages) {
      this.searchingMessages = [
        "Searching through the archives...",
        "Asking the film buffs...",
        "Consulting IMDB...",
        "Checking with the Academy...",
        "Rummaging through old film reels...",
        "Interrogating movie extras...",
        "Scanning through director's cuts...",
        "Browsing through fan theories...",
        "Decoding movie easter eggs...",
        "Asking that friend who knows every movie...",
        "Checking the TV Guide from 1995...",
        "Searching the cutting room floor...",
        "Asking the screenwriters...",
        "Looking behind the scenes..."
      ];
    }
    return this.searchingMessages;
  }

  // Cache for previously used message indices to avoid duplicates
  private previousLoadingIndex: number = -1;
  private previousSearchingIndex: number = -1;

  /**
   * Gets the current loading message
   */
  getLoadingMessage(): string {
    return this.currentLoadingMessage();
  }

  /**
   * Gets the current searching message
   */
  getSearchingMessage(): string {
    return this.currentSearchingMessage();
  }

  /**
   * Pauses all animations when page is not visible
   * This saves CPU/battery when the user switches tabs
   */
  private pauseAnimations(): void {
    // Only cancel animations if we're in a browser
    if (isPlatformBrowser(this.platformId)) {
      if (this.loadingAnimationId !== null) {
        cancelAnimationFrame(this.loadingAnimationId);
      }

      if (this.searchingAnimationId !== null) {
        cancelAnimationFrame(this.searchingAnimationId);
      }
    }
  }

  /**
   * Resumes animations when page becomes visible again
   */
  private resumeAnimations(): void {
    // Only resume if we're in a browser and animations were running
    if (isPlatformBrowser(this.platformId)) {
      if (this.loadingAnimationId !== null) {
        this.animateLoadingMessages();
      }

      if (this.searchingAnimationId !== null) {
        this.animateSearchingMessages();
      }
    }
  }

  /**
   * Starts rotating loading messages using requestAnimationFrame
   * @param intervalSeconds Number of seconds between message changes (default: 3)
   */
  startLoadingMessages(intervalSeconds: number = 3): void {
    // Don't do anything in SSR
    if (!isPlatformBrowser(this.platformId)) return;

    // Convert seconds to milliseconds
    const intervalMs = intervalSeconds * 1000;

    // Clear any existing animation
    this.stopLoadingMessages();

    // Set initial message
    this.setRandomLoadingMessage();

    // Initialize timestamp
    this.lastLoadingUpdateTime = performance.now();

    // Start animation loop if page is visible and device has adequate performance
    if (this.isPageVisible && this.hasAdequatePerformance) {
      this.animateLoadingMessages(intervalMs);
      if (this.debugMode) {
        this.logPerformance('Started loading message animations');
      }
    } else if (!this.hasAdequatePerformance) {
      // If device doesn't have adequate performance, just set a static message
      // without starting the animation loop
      if (this.debugMode) {
        this.logPerformance('Animations disabled due to device performance constraints');
      }
    }
  }

  /**
   * Logs performance information if debug mode is enabled
   * @param message The message to log
   * @param data Optional data to include in the log
   */
  private logPerformance(message: string, data?: any): void {
    if (this.debugMode) {
      if (data) {
        console.log(`[LoadingMessagesService] ${message}`, data);
      } else {
        console.log(`[LoadingMessagesService] ${message}`);
      }
    }
  }

  /**
   * Gets performance statistics for debugging
   * @returns Object containing performance metrics
   */
  getPerformanceStats(): { messageUpdates: number, animationFrames: number, runningTimeMs: number } {
    return {
      messageUpdates: this.performanceMetrics.messageUpdates,
      animationFrames: this.performanceMetrics.animationFrames,
      runningTimeMs: this.performanceMetrics.startTime > 0
        ? performance.now() - this.performanceMetrics.startTime
        : 0
    };
  }

  /**
   * Resets performance metrics
   */
  resetPerformanceStats(): void {
    this.performanceMetrics = {
      messageUpdates: 0,
      animationFrames: 0,
      startTime: performance.now()
    };
    this.logPerformance('Performance metrics reset');
  }

  /**
   * Animation loop for loading messages using requestAnimationFrame
   * This is more efficient than setInterval and automatically pauses
   * when the tab is not visible or on low-performance devices
   */
  private animateLoadingMessages(intervalMs: number = this.DEFAULT_INTERVAL): void {
    // Track animation frames for performance monitoring
    if (this.debugMode && isPlatformBrowser(this.platformId)) {
      this.performanceMetrics.animationFrames++;

      // Initialize start time if this is the first animation frame
      if (this.performanceMetrics.startTime === 0) {
        this.performanceMetrics.startTime = performance.now();
        this.logPerformance('Animation started');
      }

      // Log every 100 frames in debug mode
      if (this.performanceMetrics.animationFrames % 100 === 0) {
        this.logPerformance(`Animation frames: ${this.performanceMetrics.animationFrames}`);
      }
    }

    // Store animation ID so we can cancel it later
    this.loadingAnimationId = requestAnimationFrame((timestamp) => {
      // Check if enough time has passed since last update
      if (timestamp - this.lastLoadingUpdateTime >= intervalMs) {
        this.setRandomLoadingMessage();
        this.lastLoadingUpdateTime = timestamp;
      }

      // Continue animation loop if page is visible and device has adequate performance
      if (this.isPageVisible && this.hasAdequatePerformance) {
        this.animateLoadingMessages(intervalMs);
      } else if (!this.hasAdequatePerformance && this.loadingAnimationId !== null) {
        // If performance is no longer adequate, stop the animation
        this.stopLoadingMessages();
        if (this.debugMode) {
          this.logPerformance('Loading animations stopped due to performance constraints');
        }
      }
    });
  }

  /**
   * Stops rotating loading messages
   */
  stopLoadingMessages(): void {
    // Don't do anything in SSR
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.loadingAnimationId !== null) {
      cancelAnimationFrame(this.loadingAnimationId);
      this.loadingAnimationId = null;
    }
  }

  /**
   * Starts rotating searching messages using requestAnimationFrame
   * @param intervalSeconds Number of seconds between message changes (default: 3)
   */
  startSearchingMessages(intervalSeconds: number = 3): void {
    // Don't do anything in SSR
    if (!isPlatformBrowser(this.platformId)) return;

    // Convert seconds to milliseconds
    const intervalMs = intervalSeconds * 1000;

    // Clear any existing animation
    this.stopSearchingMessages();

    // Set initial message
    this.setRandomSearchingMessage();

    // Initialize timestamp
    this.lastSearchingUpdateTime = performance.now();

    // Start animation loop if page is visible and device has adequate performance
    if (this.isPageVisible && this.hasAdequatePerformance) {
      this.animateSearchingMessages(intervalMs);
      if (this.debugMode) {
        this.logPerformance('Started searching message animations');
      }
    } else if (!this.hasAdequatePerformance) {
      // If device doesn't have adequate performance, just set a static message
      // without starting the animation loop
      if (this.debugMode) {
        this.logPerformance('Search animations disabled due to device performance constraints');
      }
    }
  }

  /**
   * Animation loop for searching messages using requestAnimationFrame
   * This is more efficient than setInterval and automatically pauses
   * when the tab is not visible or on low-performance devices
   */
  private animateSearchingMessages(intervalMs: number = this.DEFAULT_INTERVAL): void {
    // Track animation frames for performance monitoring
    if (this.debugMode && isPlatformBrowser(this.platformId)) {
      this.performanceMetrics.animationFrames++;

      // Initialize start time if this is the first animation frame
      if (this.performanceMetrics.startTime === 0) {
        this.performanceMetrics.startTime = performance.now();
        this.logPerformance('Search animation started');
      }

      // Log every 100 frames in debug mode
      if (this.performanceMetrics.animationFrames % 100 === 0) {
        this.logPerformance(`Total animation frames: ${this.performanceMetrics.animationFrames}`);
      }
    }

    // Store animation ID so we can cancel it later
    this.searchingAnimationId = requestAnimationFrame((timestamp) => {
      // Check if enough time has passed since last update
      if (timestamp - this.lastSearchingUpdateTime >= intervalMs) {
        this.setRandomSearchingMessage();
        this.lastSearchingUpdateTime = timestamp;
      }

      // Continue animation loop if page is visible and device has adequate performance
      if (this.isPageVisible && this.hasAdequatePerformance) {
        this.animateSearchingMessages(intervalMs);
      } else if (!this.hasAdequatePerformance && this.searchingAnimationId !== null) {
        // If performance is no longer adequate, stop the animation
        this.stopSearchingMessages();
        if (this.debugMode) {
          this.logPerformance('Searching animations stopped due to performance constraints');
        }
      }
    });
  }

  /**
   * Stops rotating searching messages
   */
  stopSearchingMessages(): void {
    // Don't do anything in SSR
    if (!isPlatformBrowser(this.platformId)) return;

    if (this.searchingAnimationId !== null) {
      cancelAnimationFrame(this.searchingAnimationId);
      this.searchingAnimationId = null;
    }
  }

  /**
   * Sets a random loading message, avoiding duplicates
   */
  private setRandomLoadingMessage(): void {
    const messages = this.getMovieTvLoadingMessages();
    let randomIndex: number;

    // Avoid showing the same message twice in a row
    do {
      randomIndex = Math.floor(Math.random() * messages.length);
    } while (randomIndex === this.previousLoadingIndex && messages.length > 1);

    // Store the index to avoid duplicates next time
    this.previousLoadingIndex = randomIndex;

    // Update the signal (only if the value actually changes to avoid unnecessary renders)
    const newMessage = messages[randomIndex];
    if (this.currentLoadingMessage() !== newMessage) {
      // Track message updates for performance monitoring
      if (this.debugMode && isPlatformBrowser(this.platformId)) {
        this.performanceMetrics.messageUpdates++;

        // Log every 10 message updates in debug mode
        if (this.performanceMetrics.messageUpdates % 10 === 0) {
          this.logPerformance(`Total message updates: ${this.performanceMetrics.messageUpdates}`);
        }
      }

      // Set the new message
      this.currentLoadingMessage.set(newMessage);
    }
  }

  /**
   * Sets a random searching message, avoiding duplicates
   */
  private setRandomSearchingMessage(): void {
    const messages = this.getSearchingMessages();
    let randomIndex: number;

    // Avoid showing the same message twice in a row
    do {
      randomIndex = Math.floor(Math.random() * messages.length);
    } while (randomIndex === this.previousSearchingIndex && messages.length > 1);

    // Store the index to avoid duplicates next time
    this.previousSearchingIndex = randomIndex;

    // Update the signal (only if the value actually changes to avoid unnecessary renders)
    const newMessage = messages[randomIndex];
    if (this.currentSearchingMessage() !== newMessage) {
      // Track message updates for performance monitoring
      if (this.debugMode && isPlatformBrowser(this.platformId)) {
        this.performanceMetrics.messageUpdates++;

        // Log every 10 message updates in debug mode
        if (this.performanceMetrics.messageUpdates % 10 === 0) {
          this.logPerformance(`Total message updates: ${this.performanceMetrics.messageUpdates}`);
        }
      }

      // Set the new message
      this.currentSearchingMessage.set(newMessage);
    }
  }
}
