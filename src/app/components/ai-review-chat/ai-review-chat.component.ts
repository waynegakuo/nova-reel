import { Component, input, signal, inject, ElementRef, ViewChild, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MediaService } from '../../services/media/media.service';

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

@Component({
  selector: 'app-ai-review-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-review-chat.component.html',
  styleUrls: ['./ai-review-chat.component.scss']
})
export class AiReviewChatComponent {
  mediaId = input.required<number>();
  mediaType = input.required<'movie' | 'tv'>();

  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  private mediaService = inject(MediaService);

  isChatOpen = signal(false);
  isLoading = signal(false);
  userInput = signal('');
  messages = signal<ChatMessage[]>([]);

  quickPrompts = [
    'Should I watch this?',
    'What do people like about it?',
    'What are the common complaints?',
    'Is it worth my time?',
    'Summarize the reviews'
  ];

  constructor() {
    afterNextRender(() => {
      this.scrollToBottom();
    });
  }

  toggleChat() {
    this.isChatOpen.update(v => !v);
  }

  async sendMessage(text?: string) {
    const messageText = text || this.userInput().trim();
    if (!messageText || this.isLoading()) return;

    // Add user message to chat
    const userMessage: ChatMessage = { role: 'user', text: messageText };
    this.messages.update(prev => [...prev, userMessage]);
    this.userInput.set('');
    this.scrollToBottom();

    this.isLoading.set(true);

    try {
      const response = await this.mediaService.getAiReviewChatResponse(
        this.mediaId(),
        this.mediaType(),
        messageText,
        this.messages().slice(0, -1) // Send history excluding the last message
      );

      const aiMessage: ChatMessage = { role: 'model', text: response.response };
      this.messages.update(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        role: 'model',
        text: 'Sorry, I encountered an error. Please try again later.'
      };
      this.messages.update(prev => [...prev, errorMessage]);
    } finally {
      this.isLoading.set(false);
      this.scrollToBottom();
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.scrollContainer) {
        const element = this.scrollContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }
    }, 100);
  }
}
