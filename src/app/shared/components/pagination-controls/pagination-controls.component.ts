import { Component, Input, Output, EventEmitter } from '@angular/core';


@Component({
  selector: 'app-pagination-controls',
  standalone: true,
  imports: [],
  templateUrl: './pagination-controls.component.html',
  styleUrl: './pagination-controls.component.scss'
})
export class PaginationControlsComponent {
  @Input() currentPage: number = 1;
  @Input() maxPages: number = 5;
  @Input() totalPages: number = 5;
  @Output() pageChange = new EventEmitter<number>();

  get pages(): number[] {
    return Array.from({ length: Math.min(this.totalPages, this.maxPages) }, (_, i) => i + 1);
  }

  onPreviousPage(): void {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  onNextPage(): void {
    if (this.currentPage < this.maxPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  onPageClick(page: number): void {
    this.pageChange.emit(page);
  }
}
