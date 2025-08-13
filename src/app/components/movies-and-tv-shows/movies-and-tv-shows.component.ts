import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaGridComponent } from '../../shared/components/media-grid/media-grid.component';
import { PaginationControlsComponent } from '../../shared/components/pagination-controls/pagination-controls.component';
import { CategorySelectorComponent, CategoryItem } from '../../shared/components/category-selector/category-selector.component';
import { Movie, TvShow } from '../../models/media.model';

@Component({
  selector: 'app-movies-and-tv-shows',
  imports: [
    CommonModule,
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

  onMovieCategoryChange(category: string): void {
    this.loadMovies.emit(category);
  }

  onTVShowCategoryChange(category: string): void {
    this.loadTVShows.emit(category);
  }

  onMoviePageChange(page: number): void {
    this.goToMoviePage.emit(page);
  }

  onTVShowPageChange(page: number): void {
    this.goToTVShowPage.emit(page);
  }

  onShareMedia(event: any): void {
    this.shareMedia.emit(event);
  }
}
