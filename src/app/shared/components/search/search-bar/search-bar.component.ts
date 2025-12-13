import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, tap } from 'rxjs';
import { Analytics, logEvent } from '@angular/fire/analytics';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss'
})
export class SearchBarComponent implements OnInit, OnDestroy {
  // Inputs
  @Input() placeholder: string = 'Search...';
  @Input() debounceTime: number = 500;

  // Outputs
  @Output() search = new EventEmitter<string>();
  @Output() clear = new EventEmitter<void>();

  // Signals
  searchQuery = signal<string>('');
  isSearching = signal<boolean>(false);

  // Subject for managing subscriptions
  private destroy$ = new Subject<void>();
  private searchQueryChanged$ = new Subject<string>();
  private analytics = inject(Analytics);

  ngOnInit(): void {
    // Set up search with debounce and distinctUntilChanged
    this.searchQueryChanged$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(this.debounceTime), // Configurable debounce time
        distinctUntilChanged(), // Only emit when the value changes
        tap(query => {
          // Only show loading indicator for non-empty queries
          // and only after debounce and distinctUntilChanged
          this.isSearching.set(!!query.trim());
        })
      )
      .subscribe(query => {
        // Turn off loading indicator when search is emitted
        this.isSearching.set(false);
        this.search.emit(query);
        if (query.trim()) {
          logEvent(this.analytics, 'search', { search_term: query });
        }
      });
  }

  ngOnDestroy(): void {
    // Complete the subject to unsubscribe from all subscriptions
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handles search query changes
   * @param query - The search query
   */
  onSearchQueryChange(query: string): void {
    this.searchQuery.set(query);
    // Don't set isSearching here - it will be set after debounce and distinctUntilChanged
    this.searchQueryChanged$.next(query);
  }

  /**
   * Clears the search query
   */
  clearSearch(): void {
    this.searchQuery.set('');
    this.isSearching.set(false);
    this.clear.emit();
    logEvent(this.analytics, 'clear_search');
  }
}
