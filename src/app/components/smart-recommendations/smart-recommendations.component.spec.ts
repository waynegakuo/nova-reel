import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartRecommendationsComponent } from './smart-recommendations.component';

describe('SmartRecommendationsComponent', () => {
  let component: SmartRecommendationsComponent;
  let fixture: ComponentFixture<SmartRecommendationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartRecommendationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmartRecommendationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
