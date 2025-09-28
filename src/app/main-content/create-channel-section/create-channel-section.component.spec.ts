import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateChannelSectionComponent } from './create-channel-section.component';

describe('CreateChannelSectionComponent', () => {
  let component: CreateChannelSectionComponent;
  let fixture: ComponentFixture<CreateChannelSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateChannelSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateChannelSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
