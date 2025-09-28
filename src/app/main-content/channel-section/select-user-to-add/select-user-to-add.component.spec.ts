import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectUserToAddComponent } from './select-user-to-add.component';

describe('SelectUserToAddComponent', () => {
  let component: SelectUserToAddComponent;
  let fixture: ComponentFixture<SelectUserToAddComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectUserToAddComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectUserToAddComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
