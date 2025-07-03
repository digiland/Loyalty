import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPointsComponent } from './add-points.component';

describe('AddPointsComponent', () => {
  let component: AddPointsComponent;
  let fixture: ComponentFixture<AddPointsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AddPointsComponent]
    });
    fixture = TestBed.createComponent(AddPointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
