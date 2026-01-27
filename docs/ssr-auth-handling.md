# SSR Authentication Handling

This document explains how Nova Reel handles authentication state during Server-Side Rendering (SSR) to prevent UI flickering.

## The Problem: "Flash of Unauthenticated Content"

When using Angular SSR with Firebase Authentication, a common issue arises: the "Sign In" button appears briefly on page refresh even if the user is already authenticated.

### Root Cause
1. **Server-Side Execution**: During SSR, the application runs on the server (Node.js).
2. **Firebase Limitations**: Firebase Auth stores session information in the browser's IndexedDB. The server has no access to this storage.
3. **Initial State**: Consequently, on the server, the authentication state defaults to "unauthenticated" or "loading".
4. **Hydration**: The server renders the HTML with the "Sign In" button. When the browser receives this HTML, it displays it immediately.
5. **Client-Side Initialization**: Once the JavaScript loads in the browser (hydration), Firebase Auth initializes, checks IndexedDB, and detects the user session. Only then does the UI update to show the authenticated state.

This gap between server rendering and client-side initialization causes the "flash".

## The Solution

We implemented an SSR-aware authentication service to manage this behavior.

### 1. SSR-Aware `AuthService`

The `AuthService` uses Angular's `PLATFORM_ID` to detect if it's running on the server or in the browser.

```typescript
private platformId = inject(PLATFORM_ID);
isLoading = signal<boolean>(true);

private initAuthState(): void {
  if (!isPlatformBrowser(this.platformId)) {
    // On the server, we keep isLoading as true and don't attempt to initialize auth.
    // This prevents the service from prematurely switching to an "unauthenticated" state.
    return;
  }

  // Client-side initialization follows...
}
```

### 2. Loading State in UI

In the `UserAuthComponent`, we use the `isLoading` signal from `AuthService`. 

- **On the Server**: `isLoading` remains `true`. The template renders a loading spinner instead of the "Sign In" button.
- **On the Client**: Once Firebase Auth initializes, `isLoading` is set to `false`, and the actual authentication state (Authenticated vs. Unauthenticated) is rendered.

### Benefits
- **Consistent UX**: Users see a loading indicator instead of a misleading "Sign In" button.
- **No Flickering**: The transition from the server-rendered loading state to the client-rendered authenticated state is smooth.

## Implementation Details

The core logic resides in `src/app/services/auth/auth.service.ts`. The UI implementation is in `src/app/shared/components/user-auth/user-auth.component.html`.
