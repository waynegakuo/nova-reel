import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaCardComponent } from '../../shared/components/media-card/media-card.component';
import { Movie, TvShow } from '../../models/media.model';
import { mockMovies, mockTvShows } from '../../models/mock-data';

@Component({
  selector: 'app-landing-page',
  imports: [CommonModule, MediaCardComponent],
  templateUrl: './landing-page.component.html',
  styleUrl: './landing-page.component.scss'
})
export class LandingPageComponent {
  title = signal('nova-reel');

  // Using signals for reactive state management
  movies = signal<Movie[]>(mockMovies);
  tvShows = signal<TvShow[]>(mockTvShows);
  activeTab = signal<string>('Movies');

  // Method to handle tab changes
  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  // Method to handle sharing
  onShareMedia(event: { item: Movie | TvShow, type: string }): void {
    const title = 'title' in event.item ? event.item.title : event.item.name;
    const type = event.type === 'movie' ? 'Movie' : 'TV Show';

    // Create share data
    const shareData = {
      title: `Check out this ${type}: ${title}`,
      text: event.item.overview,
      url: window.location.href
    };

    // Use Web Share API if available
    if (navigator.share) {
      navigator.share(shareData)
        .then(() => console.log('Shared successfully'))
        .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support Web Share API
      alert(`Share: ${shareData.title}\n${shareData.text}\n${shareData.url}`);
    }
  }
}
