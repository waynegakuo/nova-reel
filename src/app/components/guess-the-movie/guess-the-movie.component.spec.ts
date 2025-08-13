import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuessTheMovieComponent } from './guess-the-movie.component';

describe('GuessTheMovieComponent', () => {
  let component: GuessTheMovieComponent;
  let fixture: ComponentFixture<GuessTheMovieComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuessTheMovieComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuessTheMovieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
