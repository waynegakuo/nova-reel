import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface CategoryItem {
  label: string;
  value: string;
}

@Component({
  selector: 'app-category-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-selector.component.html',
  styleUrl: './category-selector.component.scss'
})
export class CategorySelectorComponent {
  @Input() categories: CategoryItem[] = [];
  @Input() activeCategory: string = '';
  @Output() categoryChange = new EventEmitter<string>();

  onCategoryClick(category: CategoryItem): void {
    this.categoryChange.emit(category.value);
  }
}
