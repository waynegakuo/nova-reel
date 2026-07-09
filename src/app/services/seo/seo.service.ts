import { Injectable, inject, PLATFORM_ID, RendererFactory2 } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export interface SeoData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  twitterCard?: 'summary' | 'summary_large_image';
}

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private document = inject(DOCUMENT);
  private platformId = inject(PLATFORM_ID);
  private rendererFactory = inject(RendererFactory2);
  private renderer = this.rendererFactory.createRenderer(null, null);

  private readonly defaultTitle = 'Nova Reel - Discover Movies & TV Shows';
  private readonly defaultDescription = 'Explore the latest movies and TV shows, get AI recommendations, and track your watchlist with Nova Reel.';
  private readonly defaultImage = 'https://nova-reel.web.app/assets/logo/nova_reel_logo.svg';

  updateSeoData(data: SeoData = {}): void {
    const title = data.title ? `${data.title} | Nova Reel` : this.defaultTitle;
    const description = data.description || this.defaultDescription;
    const image = data.image || this.defaultImage;
    const url = data.url || (isPlatformBrowser(this.platformId) ? this.document.location.href : '');
    const type = data.type || 'website';
    const twitterCard = data.twitterCard || 'summary_large_image';

    this.title.setTitle(title);

    // Standard Meta Tags
    this.meta.updateTag({ name: 'description', content: description });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: type });
    this.meta.updateTag({ property: 'og:site_name', content: 'Nova Reel' });

    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: twitterCard });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
  }

  setJsonLd(data: any): void {
    const existingScript = this.document.getElementById('json-ld');
    const jsonString = JSON.stringify(data);

    if (existingScript) {
      this.renderer.setProperty(existingScript, 'innerHTML', jsonString);
    } else {
      const script = this.renderer.createElement('script');
      this.renderer.setAttribute(script, 'type', 'application/ld+json');
      this.renderer.setAttribute(script, 'id', 'json-ld');
      this.renderer.setProperty(script, 'innerHTML', jsonString);
      this.renderer.appendChild(this.document.head, script);
    }
  }

  removeJsonLd(): void {
    const existingScript = this.document.getElementById('json-ld');
    if (existingScript) {
      this.renderer.removeChild(this.document.head, existingScript);
    }
  }
}
