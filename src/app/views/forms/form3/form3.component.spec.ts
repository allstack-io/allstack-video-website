import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Form3Component } from './form3.component';
import { SharedModule } from '../../../shared/shared.module';

describe('Form3Component', () => {
  let component: Form3Component;
  let fixture: ComponentFixture<Form3Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule
      ],
      declarations: [ Form3Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Form3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
