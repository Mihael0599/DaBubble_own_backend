import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersInChannelComponent } from './users-in-channel.component';

describe('UsersInChannelComponent', () => {
  let component: UsersInChannelComponent;
  let fixture: ComponentFixture<UsersInChannelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersInChannelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsersInChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
