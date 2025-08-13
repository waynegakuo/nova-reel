import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-truncated-text',
  standalone: true,
  imports: [CommonModule],
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
export class TruncatedTextComponent {
  @Input() text: string = '';
  @Input() maxLines: number = 6; // Default to 6 lines as requested

  isExpanded = signal(false);

  displayText() {
    return this.text || '';
  }

  shouldTruncate(): boolean {
    if (!this.text) return false;

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
