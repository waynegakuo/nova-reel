import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Movie, TvShow } from '../../../../models/media.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss'
})
export class SearchResultsComponent {
  // Inputs
  @Input() set results(value: (Movie | TvShow)[]) {
    this.searchResults.set(value);
  }
  @Input() set query(value: string) {
    this.searchQuery.set(value);
  }
  @Input() set type(value: 'movie' | 'tv') {
    this.searchType.set(value);
  }
  @Input() set currentPage(value: number) {
    this.currentSearchPage.set(value);
  }
  @Input() maxPages: number = 5;

  // Outputs
  @Output() pageChange = new EventEmitter<number>();
  @Output() resultClick = new EventEmitter<{ item: Movie | TvShow, type: 'movie' | 'tv' }>();

  // Signals
  searchResults = signal<(Movie | TvShow)[]>([]);
  searchQuery = signal<string>('');
  searchType = signal<'movie' | 'tv'>('movie');
  currentSearchPage = signal<number>(1);
  showSearchResults = signal<boolean>(true);

  constructor(private router: Router) {}

  /**
   * Gets the title of a media item (movie or TV show)
   * @param media - The media item
   * @returns The title of the media item
   */
  getMediaTitle(media: Movie | TvShow): string {
    return media.hasOwnProperty('title')
      ? (media as Movie).title
      : (media as TvShow).name;
  }

  /**
   * Gets the release date of a media item (movie or TV show)
   * @param media - The media item
   * @returns The release date of the media item
   */
  getMediaReleaseDate(media: Movie | TvShow): string {
    return media.hasOwnProperty('release_date')
      ? (media as Movie).release_date
      : (media as TvShow).first_air_date;
  }

  /**
   * Gets the image URL for a poster
   * @param posterPath - The poster path
   * @returns The full image URL
   */
  getMediaImageUrl(posterPath: string): string {
    if (!posterPath) {
      return 'assets/images/no-poster.jpg'; // Fallback image
    }

    // Check if the path already includes the base URL
    if (posterPath.startsWith('http')) {
      return posterPath;
    }

    // TMDB image base URL
    const baseUrl = 'https://image.tmdb.org/t/p/w500';

    // Ensure the path starts with a slash
    const path = posterPath.startsWith('/') ? posterPath : `/${posterPath}`;

    return `${baseUrl}${path}`;
  }

  /**
   * Navigates to the details page for a media item
   * @param media - The media item
   * @param type - The type of media ('movie' or 'tv')
   */
  navigateToDetails(media: Movie | TvShow, type: 'movie' | 'tv'): void {
    this.resultClick.emit({ item: media, type });
  }

  /**
   * Navigates to a specific search results page
   * @param page - The page number to navigate to
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.maxPages) return;
    this.pageChange.emit(page);
  }

  /**
   * Navigates to the next search results page
   */
  nextPage(): void {
    const nextPage = this.currentSearchPage() + 1;
    if (nextPage <= this.maxPages) {
      this.goToPage(nextPage);
    }
  }

  /**
   * Navigates to the previous search results page
   */
  prevPage(): void {
    const prevPage = this.currentSearchPage() - 1;
    if (prevPage >= 1) {
      this.goToPage(prevPage);
    }
  }
}
