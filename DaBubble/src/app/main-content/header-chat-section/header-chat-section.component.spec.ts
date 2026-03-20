import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderChatSectionComponent } from './header-chat-section.component';

describe('HeaderChatSectionComponent', () => {
  let component: HeaderChatSectionComponent;
  let fixture: ComponentFixture<HeaderChatSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderChatSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderChatSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
