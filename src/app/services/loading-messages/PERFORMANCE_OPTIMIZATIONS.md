# Loading Messages Service Performance Optimizations

This document outlines the performance optimizations implemented in the `LoadingMessagesService` to ensure that the rotating funny loading messages feature does not negatively impact the application's performance.

## Overview

The `LoadingMessagesService` provides rotating funny loading messages related to movies and TV shows during content loading and searching operations. To ensure this feature doesn't impact performance, several optimizations have been implemented.

## Performance Optimizations

### 1. Lazy Loading of Message Arrays

- Message arrays are only loaded when needed, reducing initial memory footprint
- Prevents unnecessary memory allocation for unused message arrays

```typescript
private getMovieTvLoadingMessages(): string[] {
  if (!this.movieTvLoadingMessages) {
    this.movieTvLoadingMessages = [
      // Messages loaded only when needed
    ];
  }
  return this.movieTvLoadingMessages;
}
```

### 2. RequestAnimationFrame Instead of SetInterval

- Uses `requestAnimationFrame` instead of `setInterval` for better performance and battery life
- Automatically pauses when tab is not visible
- Provides smoother animations by syncing with the browser's rendering cycle

```typescript
private animateLoadingMessages(intervalMs: number = this.DEFAULT_INTERVAL): void {
  this.loadingAnimationId = requestAnimationFrame((timestamp) => {
    // Animation logic
  });
}
```

### 3. Page Visibility Detection

- Automatically pauses animations when the tab is not visible
- Resumes animations when the tab becomes visible again
- Saves CPU and battery when the user is not actively viewing the app

```typescript
fromEvent(document, 'visibilitychange')
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(() => {
    this.isPageVisible = document.visibilityState === 'visible';
    
    if (this.isPageVisible) {
      this.resumeAnimations();
    } else {
      this.pauseAnimations();
    }
  });
```

### 4. Device Performance Detection

- Automatically detects device performance capabilities
- Disables animations on low-end devices or when reduced motion is preferred
- Checks for limited memory, limited CPU cores, data saver mode, slow connections, and reduced motion preference

```typescript
private detectDevicePerformance(): void {
  // Check for low-end device indicators
  const limitedMemory = 'deviceMemory' in navigator && 
    (navigator as any).deviceMemory < 4;
  
  // Additional checks...
  
  this.hasAdequatePerformance = !(issueCount >= 2 || prefersReducedMotion);
}
```

### 5. Conditional Animation Enabling/Disabling

- Provides API to check if animations are enabled
- Allows manual enabling/disabling of animations
- Dynamically stops animations if performance constraints are detected

```typescript
areAnimationsEnabled(): boolean {
  return this.hasAdequatePerformance;
}

setAnimationsEnabled(enabled: boolean): void {
  this.hasAdequatePerformance = enabled;
  // Additional logic...
}
```

### 6. Duplicate Message Prevention

- Prevents showing the same message twice in a row
- Reduces unnecessary DOM updates when the same message would be displayed

```typescript
private setRandomLoadingMessage(): void {
  let randomIndex: number;
  
  // Avoid showing the same message twice in a row
  do {
    randomIndex = Math.floor(Math.random() * messages.length);
  } while (randomIndex === this.previousLoadingIndex && messages.length > 1);
  
  // Additional logic...
}
```

### 7. Conditional Signal Updates

- Only updates signals when the value actually changes
- Prevents unnecessary re-renders when the same message would be displayed

```typescript
// Update the signal (only if the value actually changes to avoid unnecessary renders)
const newMessage = messages[randomIndex];
if (this.currentLoadingMessage() !== newMessage) {
  this.currentLoadingMessage.set(newMessage);
}
```

### 8. Proper Cleanup

- Ensures all animations are properly stopped when components are destroyed
- Uses Angular's DestroyRef for automatic cleanup
- Prevents memory leaks and background processing

```typescript
private destroyRef = inject(DestroyRef);

// Usage with RxJS
fromEvent(document, 'visibilitychange')
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe(() => {
    // Logic...
  });
```

### 9. SSR Compatibility

- Checks for browser environment before running browser-specific code
- Ensures the service works correctly in Server-Side Rendering (SSR) environments
- Prevents errors when running on the server

```typescript
if (isPlatformBrowser(this.platformId)) {
  // Browser-specific code
}
```

### 10. Performance Monitoring

- Tracks animation frames and message updates
- Provides methods to get and reset performance statistics
- Helps identify and debug performance issues

```typescript
getPerformanceStats(): { messageUpdates: number, animationFrames: number, runningTimeMs: number } {
  return {
    messageUpdates: this.performanceMetrics.messageUpdates,
    animationFrames: this.performanceMetrics.animationFrames,
    runningTimeMs: this.performanceMetrics.startTime > 0 
      ? performance.now() - this.performanceMetrics.startTime 
      : 0
  };
}
```

## Conclusion

These optimizations ensure that the rotating funny loading messages feature has minimal impact on the application's performance, even on low-end devices or in challenging network conditions. The service automatically adapts to the device's capabilities and user preferences, providing an enhanced user experience without sacrificing performance.
