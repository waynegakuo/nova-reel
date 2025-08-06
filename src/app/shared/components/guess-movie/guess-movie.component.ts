import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LoadingMessagesService } from '../../../services/loading-messages/loading-messages.service';
import { MediaService } from '../../../services/media/media.service';

@Component({
  selector: 'app-guess-movie',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './guess-movie.component.html',
  styleUrls: ['./guess-movie.component.scss']
})
export class GuessMovieComponent {
  private http = inject(HttpClient);
  public loadingMessagesService = inject(LoadingMessagesService);
  private mediaService = inject(MediaService);

  // Signals for reactive state management
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  selectedFile = signal<File | null>(null);
  imagePreview = signal<string | null>(null);
  guessResult = signal<any | null>(null);

  // File input validation
  maxFileSize = 5 * 1024 * 1024; // 5MB
  allowedFileTypes = ['image/jpeg', 'image/png', 'image/webp'];

  /**
   * Handles file selection from the file input
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      this.resetState();
      return;
    }

    const file = input.files[0];

    // Validate file type
    if (!this.allowedFileTypes.includes(file.type)) {
      this.error.set('Please select a valid image file (JPEG, PNG, or WebP)');
      this.resetFileInput();
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      this.error.set(`File size exceeds the maximum limit of ${this.maxFileSize / (1024 * 1024)}MB`);
      this.resetFileInput();
      return;
    }

    // Clear any previous errors
    this.error.set(null);
    this.selectedFile.set(file);

    // Create image preview
    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview.set(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  /**
   * Submits the image to the AI for movie/show identification
   */
  submitImage(): void {
    if (!this.selectedFile()) {
      this.error.set('Please select an image first');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.guessResult.set(null);

    // Convert the file to base64
    const reader = new FileReader();
    reader.readAsDataURL(this.selectedFile()!);
    reader.onload = () => {
      try {
        // Extract the base64 data from the data URL
        const base64Data = (reader.result as string).split(',')[1];

        // Use MediaService to analyze the image
        this.mediaService.getGuessMovieResult(
          base64Data,
          this.selectedFile()!.type
        ).subscribe({
          next: (result) => {
            this.isLoading.set(false);
            this.guessResult.set(result);
          },
          error: (error) => {
            this.isLoading.set(false);
            this.error.set(`Failed to analyze the image: ${error.message}`);
            console.error('Error analyzing image:', error);
          }
        });
      } catch (err: any) {
        this.isLoading.set(false);
        this.error.set(`Error processing image: ${err.message}`);
        console.error('Error processing image:', err);
      }
    };

    reader.onerror = (err) => {
      this.isLoading.set(false);
      this.error.set('Failed to read the image file.');
      console.error('Error reading file:', err);
    };
  }

  /**
   * Resets the component state to start over
   */
  resetState(): void {
    this.selectedFile.set(null);
    this.imagePreview.set(null);
    this.guessResult.set(null);
    this.error.set(null);
    this.resetFileInput();
  }

  /**
   * Resets the file input element
   */
  private resetFileInput(): void {
    // Reset the file input element
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
    this.selectedFile.set(null);
    this.imagePreview.set(null);
  }
}
