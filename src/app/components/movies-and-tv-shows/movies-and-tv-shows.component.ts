import { Component, Input, Output, EventEmitter, inject } from '@angular/core';

import { MediaGridComponent } from '../../shared/components/media-grid/media-grid.component';
import { PaginationControlsComponent } from '../../shared/components/pagination-controls/pagination-controls.component';
import { CategorySelectorComponent, CategoryItem } from '../../shared/components/category-selector/category-selector.component';
import { Movie, TvShow } from '../../models/media.model';
import { Analytics, logEvent } from '@angular/fire/analytics';

@Component({
  selector: 'app-movies-and-tv-shows',
  imports: [
    MediaGridComponent,
    PaginationControlsComponent,
    CategorySelectorComponent
],
  templateUrl: './movies-and-tv-shows.component.html',
  styleUrl: './movies-and-tv-shows.component.scss'
})
export class MoviesAndTvShowsComponent {
  @Input() activeTab!: string;
  @Input() movies: Movie[] = [];
  @Input() tvShows: TvShow[] = [];
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;
  @Input() movieCategories: CategoryItem[] = [];
  @Input() tvShowCategories: CategoryItem[] = [];
  @Input() activeMovieCategory!: string;
  @Input() activeTVShowCategory!: string;
  @Input() currentMoviePage: number = 1;
  @Input() currentTVShowPage: number = 1;
  @Input() maxPages: number = 10;

  @Output() loadMovies = new EventEmitter<string>();
  @Output() loadTVShows = new EventEmitter<string>();
  @Output() goToMoviePage = new EventEmitter<number>();
  @Output() goToTVShowPage = new EventEmitter<number>();
  @Output() shareMedia = new EventEmitter<any>();

  private analytics = inject(Analytics);

  onMovieCategoryChange(category: string): void {
    this.loadMovies.emit(category);
    if (this.analytics) {
      logEvent(this.analytics, 'change_movie_category', { category });
    }
  }

  onTVShowCategoryChange(category: string): void {
    this.loadTVShows.emit(category);
    if (this.analytics) {
      logEvent(this.analytics, 'change_tv_show_category', { category });
    }
  }

  onMoviePageChange(page: number): void {
    this.goToMoviePage.emit(page);
    if (this.analytics) {
      logEvent(this.analytics, 'change_movie_page', { page });
    }
  }

  onTVShowPageChange(page: number): void {
    this.goToTVShowPage.emit(page);
    if (this.analytics) {
      logEvent(this.analytics, 'change_tv_show_page', { page });
    }
  }

  onShareMedia(event: any): void {
    this.shareMedia.emit(event);
    if (this.analytics) {
      logEvent(this.analytics, 'share_media', { media_type: event.type, media_id: event.item.id });
    }
  }
}
