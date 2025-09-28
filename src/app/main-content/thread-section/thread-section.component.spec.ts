import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreadSectionComponent } from './thread-section.component';

describe('ThreadSectionComponent', () => {
  let component: ThreadSectionComponent;
  let fixture: ComponentFixture<ThreadSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreadSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreadSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
