import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TriviaHistoryComponent } from './trivia-history.component';

describe('TriviaHistoryComponent', () => {
  let component: TriviaHistoryComponent;
  let fixture: ComponentFixture<TriviaHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TriviaHistoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TriviaHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
