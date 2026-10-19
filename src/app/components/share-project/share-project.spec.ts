import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ShareProject } from './share-project';

describe('ShareProject', () => {
  let component: ShareProject;
  let fixture: ComponentFixture<ShareProject>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShareProject],
    }).compileComponents();

    fixture = TestBed.createComponent(ShareProject);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
