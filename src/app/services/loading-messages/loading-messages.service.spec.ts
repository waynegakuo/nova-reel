import { TestBed } from '@angular/core/testing';
import { LoadingMessagesService } from './loading-messages.service';
import { PLATFORM_ID } from '@angular/core';

describe('LoadingMessagesService', () => {
  let service: LoadingMessagesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoadingMessagesService,
        { provide: PLATFORM_ID, useValue: 'browser' } // Simulate browser environment
      ]
    });
    service = TestBed.inject(LoadingMessagesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should provide default loading and searching messages', () => {
    expect(service.getLoadingMessage()).toBeTruthy();
    expect(service.getSearchingMessage()).toBeTruthy();
  });

  it('should respect device performance capabilities', () => {
    // Test that animations are enabled by default
    expect(service.areAnimationsEnabled()).toBeTrue();

    // Test manual disabling of animations
    service.setAnimationsEnabled(false);
    expect(service.areAnimationsEnabled()).toBeFalse();

    // Test manual enabling of animations
    service.setAnimationsEnabled(true);
    expect(service.areAnimationsEnabled()).toBeTrue();
  });

  it('should provide performance statistics', () => {
    const stats = service.getPerformanceStats();
    expect(stats).toBeDefined();
    expect(stats.messageUpdates).toEqual(0);
    expect(stats.animationFrames).toEqual(0);

    // Reset stats and verify
    service.resetPerformanceStats();
    const newStats = service.getPerformanceStats();
    expect(newStats.messageUpdates).toEqual(0);
    expect(newStats.animationFrames).toEqual(0);
  });

  it('should start and stop loading messages', () => {
    // Start loading messages
    service.startLoadingMessages();

    // Get initial message
    const initialMessage = service.getLoadingMessage();
    expect(initialMessage).toBeTruthy();

    // Stop loading messages
    service.stopLoadingMessages();
  });

  it('should start and stop searching messages', () => {
    // Start searching messages
    service.startSearchingMessages();

    // Get initial message
    const initialMessage = service.getSearchingMessage();
    expect(initialMessage).toBeTruthy();

    // Stop searching messages
    service.stopSearchingMessages();
  });
});
