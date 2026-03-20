import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterStartComponent } from './footer-start.component';

describe('FooterStartComponent', () => {
  let component: FooterStartComponent;
  let fixture: ComponentFixture<FooterStartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterStartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FooterStartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
