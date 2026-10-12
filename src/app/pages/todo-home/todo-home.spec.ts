import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TodoHome } from './todo-home';

describe('TodoHome', () => {
  let component: TodoHome;
  let fixture: ComponentFixture<TodoHome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TodoHome],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoHome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
