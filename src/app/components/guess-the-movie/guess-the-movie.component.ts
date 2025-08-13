import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GuessMovieComponent } from '../../shared/components/guess-movie/guess-movie.component';

@Component({
  selector: 'app-guess-the-movie',
  imports: [
    CommonModule,
    GuessMovieComponent
  ],
  templateUrl: './guess-the-movie.component.html',
  styleUrl: './guess-the-movie.component.scss'
})
export class GuessTheMovieComponent {
  @Input() isLoading: boolean = false;
  @Input() error: string | null = null;
}
