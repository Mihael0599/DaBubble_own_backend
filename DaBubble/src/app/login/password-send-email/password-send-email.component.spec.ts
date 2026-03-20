import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordSendEmailComponent } from './password-send-email.component';

describe('PasswordSendEmailComponent', () => {
  let component: PasswordSendEmailComponent;
  let fixture: ComponentFixture<PasswordSendEmailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordSendEmailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PasswordSendEmailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
