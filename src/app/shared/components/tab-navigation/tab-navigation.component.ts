import { Component, Input, Output, EventEmitter } from '@angular/core';


export interface TabItem {
  label: string;
  value: string;
  icon?: string;
}

@Component({
  selector: 'app-tab-navigation',
  standalone: true,
  imports: [],
  templateUrl: './tab-navigation.component.html',
  styleUrl: './tab-navigation.component.scss'
})
export class TabNavigationComponent {
  @Input() tabs: TabItem[] = [];
  @Input() activeTab: string = '';
  @Output() tabChange = new EventEmitter<string>();

  onTabClick(tab: TabItem): void {
    this.tabChange.emit(tab.value);
  }
}
