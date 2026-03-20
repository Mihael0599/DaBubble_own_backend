import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserChannelChatSectionComponent } from './user-channel-chat-section.component';

describe('UserChannelChatSectionComponent', () => {
  let component: UserChannelChatSectionComponent;
  let fixture: ComponentFixture<UserChannelChatSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserChannelChatSectionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserChannelChatSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
