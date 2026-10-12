import { Component, computed, inject } from '@angular/core';
import { TodoService } from '../../services/todo.service';

@Component({
  imports: [],
  selector: 'app-stats',
  styleUrl: './stats.scss',
  templateUrl: './stats.html',
})
export class StatsComponent {
  private readonly todoService = inject(TodoService);

  totalTasks = computed(() => this.todoService.todos().length);

  completedTasks = computed(() => this.todoService.todos().filter((t) => t.completed).length);

  pendingTasks = computed(() => this.totalTasks() - this.completedTasks());

  progressPercentage = computed(() => {
    const total = this.totalTasks();
    if (total === 0) return 0;
    return Math.round((this.completedTasks() / total) * 100);
  });
}
