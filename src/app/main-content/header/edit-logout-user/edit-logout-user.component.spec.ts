import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditLogoutUserComponent } from './edit-logout-user.component';

describe('EditLogoutUserComponent', () => {
  let component: EditLogoutUserComponent;
  let fixture: ComponentFixture<EditLogoutUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditLogoutUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditLogoutUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
