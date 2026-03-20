import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkSpaceSectionComponent } from './work-space-section.component';

describe('WorkSpaceSectionComponent', () => {
  let component: WorkSpaceSectionComponent;
  let fixture: ComponentFixture<WorkSpaceSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkSpaceSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkSpaceSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
