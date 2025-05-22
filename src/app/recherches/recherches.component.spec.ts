import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecherchesComponent } from './recherches.component';

describe('RecherchesComponent', () => {
  let component: RecherchesComponent;
  let fixture: ComponentFixture<RecherchesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecherchesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecherchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
