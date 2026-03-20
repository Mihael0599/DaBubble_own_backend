import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderStartComponent } from './header-start.component';

describe('HeaderStartComponent', () => {
  let component: HeaderStartComponent;
  let fixture: ComponentFixture<HeaderStartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderStartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderStartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
