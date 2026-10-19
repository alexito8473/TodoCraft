import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReceiveProject } from './receive-project';

describe('ReceiveProject', () => {
  let component: ReceiveProject;
  let fixture: ComponentFixture<ReceiveProject>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReceiveProject],
    }).compileComponents();

    fixture = TestBed.createComponent(ReceiveProject);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
