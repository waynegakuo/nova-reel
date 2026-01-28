import { Component, Input, signal, OnInit, OnDestroy, Inject, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { MarkdownUtils } from '../../../utils/markdown-utils';

@Component({
  selector: 'app-truncated-text',
  standalone: true,
  imports: [],
  template: `
    <div class="truncated-text-container">
      <p
        class="reasoning-text"
        [class.truncated]="!isExpanded() && shouldTruncate()"
        [innerHTML]="displayText()">
      </p>
      @if (shouldTruncate()) {
        <button
          class="read-more-btn"
          (click)="toggleExpanded()"
          type="button">
          {{ isExpanded() ? 'Read Less' : 'Read More' }}
        </button>
      }
    </div>
  `,
  styles: [`
    .truncated-text-container {
      position: relative;
    }

    .reasoning-text {
      margin: 0;
      line-height: 1.6;
      transition: all 0.3s ease;
      word-wrap: break-word;
      overflow-wrap: break-word;

      p {
        margin: 0 0 0.5rem 0;
        &:last-child {
          margin-bottom: 0;
        }
      }

      ul, ol {
        margin: 0.5rem 0;
        padding-left: 1.2rem;

        li {
          margin-bottom: 0.3rem;
          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      strong {
        color: #007bff; // Using a blue color for bold text in reasoning
        font-weight: 700;
      }
    }

    .reasoning-text.truncated {
      display: -webkit-box;
      -webkit-line-clamp: 6;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;

      // Fallback for browsers that don't support -webkit-line-clamp
      @supports not (-webkit-line-clamp: 6) {
        max-height: calc(1.6em * 6); // 6 lines based on line-height
        overflow: hidden;
        position: relative;

        &::after {
          content: '...';
          position: absolute;
          right: 0;
          bottom: 0;
          background: inherit;
          padding-left: 1rem;
        }
      }
    }

    .read-more-btn {
      background: none;
      border: none;
      color: #007bff;
      cursor: pointer;
      font-family: 'Source Sans 3', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: underline;
      margin-top: 0.5rem;
      padding: 0;
      transition: color 0.3s ease;

      &:hover {
        color: #0056b3;
      }

      &:focus {
        outline: 2px solid #007bff;
        outline-offset: 2px;
        border-radius: 2px;
      }
    }

    // Mobile responsiveness
    @media (max-width: 768px) {
      .reasoning-text.truncated {
        -webkit-line-clamp: 4; // Reduce to 4 lines on mobile

        @supports not (-webkit-line-clamp: 4) {
          max-height: calc(1.6em * 4);
        }
      }

      .read-more-btn {
        font-size: 0.85rem;
      }
    }

    @media (max-width: 480px) {
      .reasoning-text.truncated {
        -webkit-line-clamp: 3; // Further reduce to 3 lines on small mobile

        @supports not (-webkit-line-clamp: 3) {
          max-height: calc(1.6em * 3);
        }
      }
    }
  `]
})
export class TruncatedTextComponent implements OnInit, OnDestroy {
  @Input() text: string = '';
  @Input() maxLines: number = 6; // Default to 6 lines as requested

  isExpanded = signal(false);
  isMobile = signal(false);
  private resizeListener?: () => void;
  private sanitizer = inject(DomSanitizer);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkMobile();
      this.resizeListener = () => this.checkMobile();
      window.addEventListener('resize', this.resizeListener);
    }
  }

  ngOnDestroy() {
    if (this.resizeListener && isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.resizeListener);
    }
  }

  private checkMobile() {
    this.isMobile.set(window.innerWidth <= 768);
  }

  displayText(): SafeHtml {
    const html = MarkdownUtils.formatMarkdown(this.text);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  shouldTruncate(): boolean {
    if (!this.text || !this.isMobile()) return false;

    // Simple heuristic: if text is longer than approximately 6 lines worth of characters
    // Assuming roughly 80-100 characters per line for mobile-friendly text
    const approximateCharsPerLine = 85;
    const maxChars = this.maxLines * approximateCharsPerLine;

    return this.text.length > maxChars;
  }

  toggleExpanded() {
    this.isExpanded.update(expanded => !expanded);
  }
}
