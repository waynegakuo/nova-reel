import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SeoData {
  title: string;
  description: string;
  image?: string;
  url?: string;
  /** OG type, e.g. 'website', 'video.movie', 'video.tv_show' */
  type?: string;
  keywords?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta = inject(Meta);
  private titleService = inject(Title);
  private document = inject(DOCUMENT);

  updateSeoData(data: SeoData): void {
    const fullTitle = data.title.includes('Nova Reel')
      ? data.title
      : `${data.title} | Nova Reel`;

    this.titleService.setTitle(fullTitle);

    // Standard meta tags
    this.meta.updateTag({ name: 'description', content: data.description });
    if (data.keywords) {
      this.meta.updateTag({ name: 'keywords', content: data.keywords });
    }

    // Open Graph tags (used by WhatsApp, Facebook, LinkedIn, etc.)
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:type', content: data.type ?? 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'Nova Reel' });
    if (data.url) {
      this.meta.updateTag({ property: 'og:url', content: data.url });
    }
    if (data.image) {
      this.meta.updateTag({ property: 'og:image', content: data.image });
      this.meta.updateTag({ property: 'og:image:width', content: '1280' });
      this.meta.updateTag({ property: 'og:image:height', content: '720' });
    }

    // Twitter Card tags (used by X / Twitter)
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });
    if (data.image) {
      this.meta.updateTag({ name: 'twitter:image', content: data.image });
    }
  }

  setJsonLd(data: object): void {
    this.removeJsonLd();
    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'app-json-ld';
    script.text = JSON.stringify(data);
    this.document.head.appendChild(script);
  }

  removeJsonLd(): void {
    const existing = this.document.getElementById('app-json-ld');
    existing?.remove();
  }
}
