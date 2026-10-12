import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TodoService } from '../../services/todo.service';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule],
  selector: 'app-todo-detail',
  styleUrl: './todo-detail.scss',
  templateUrl: './todo-detail.html',
})
export class TodoDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly todoService = inject(TodoService);

  // Obtenemos el ID de la ruta actual
  todoId: string | null = this.route.snapshot.paramMap.get('id');

  // Buscamos la tarea específica dentro del signal del servicio
  todo = computed(() => {
    return this.todoService.todos().find((t) => t.id === this.todoId);
  });

  deleteAndReturn() {
    if (this.todoId) {
      this.todoService.deleteTodo(this.todoId);
      this.router.navigate(['/']);
    }
  }
}
