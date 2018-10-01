import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashboard3Component } from './dashboard3.component';
import { StatsCardComponent } from '../common/stats-card/stats-card.component';
import { SharedModule } from '../../../shared/shared.module';

describe('Dashboard3Component', () => {
  let component: Dashboard3Component;
  let fixture: ComponentFixture<Dashboard3Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule
      ],
      declarations: [
        Dashboard3Component,
        StatsCardComponent
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Dashboard3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
