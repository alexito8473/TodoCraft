import { Component, computed, inject, signal } from '@angular/core';
import { TodoService } from '../../services/todo.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-todo-home',
  standalone: true,
  styleUrl: './todo-home.scss',
  templateUrl: './todo-home.html',
})
export class TodoHomeComponent {
  private readonly todoService = inject(TodoService);
  router = inject(Router);

  newTodoTitle = signal<string>('');
  totalTasks = computed(() => this.todoService.todos().length);
  onAdd() {
    if (this.newTodoTitle().trim()) {
      this.todoService.addTodo(this.newTodoTitle());
      this.newTodoTitle.set('');
    }
  }

  onGoToDetail(id: string) {
    this.router.navigate(['/todo', id]);
  }
}
