import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoviesAndTvShowsComponent } from './movies-and-tv-shows.component';

describe('MoviesAndTvShowsComponent', () => {
  let component: MoviesAndTvShowsComponent;
  let fixture: ComponentFixture<MoviesAndTvShowsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoviesAndTvShowsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoviesAndTvShowsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
