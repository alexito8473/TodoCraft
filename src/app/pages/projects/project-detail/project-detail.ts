import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TasksService } from '../../../services/task/task.service';
import { Task, TaskPriority } from '../../../models/tasks/task.model';
import { FormsModule } from '@angular/forms';
import { Status } from '../../../models/status/status.model';
import { StatusesService } from '../../../services/status/status.service';

@Component({
  imports: [DragDropModule, FormsModule, RouterLink],
  selector: 'app-project-detail',
  styleUrl: './project-detail.scss',
  templateUrl: './project-detail.html',
})
export class ProjectDetail implements OnInit, OnDestroy {
  // variables
  // Edición de tareas
  readonly editingTaskId = signal('');

  // Gestión de estados
  readonly showStatusForm = signal(false);
  readonly editingStatusId = signal('');
  readonly statusName = signal('');
  readonly statusColor = signal('#635bff');
  private unsubscribeTasks?: () => Promise<void>;
  readonly projectId = signal('');
  readonly projectName = signal('Mi proyecto');
  readonly statusCategory = signal('todo');
  readonly statuses = signal<Status[]>([]);
  readonly tasks = signal<Task[]>([]);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  readonly showCreateForm = signal(false);
  readonly newTitle = signal('');
  readonly newDescription = signal('');
  readonly newPriority = signal<TaskPriority>('medium');
  readonly newStatusId = signal('');

  // inject
  private readonly route = inject(ActivatedRoute);
  private readonly tasksService = inject(TasksService);
  private readonly statusesService = inject(StatusesService);

  async ngOnInit(): Promise<void> {
    this.projectId.set(this.route.snapshot.paramMap.get('projectId') ?? '');

    if (!this.projectId()) {
      this.errorMessage.set('No se ha indicado un proyecto.');
      this.loading.set(false);
      return;
    }

    await this.loadBoard();

    // No iniciar realtime si la carga inicial ha fallado.
    if (this.errorMessage()) return;

    try {
      await this.startRealtime();
    } catch (error) {
      console.error('Error iniciando realtime:', error);
      this.errorMessage.set('El tablero está cargado, pero no se pudo activar realtime.');
    }
  }

  ngOnDestroy(): void {
    void this.unsubscribeTasks?.();
  }
  // functions
  async loadBoard(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const projectId = this.projectId();

      const [project, statuses, tasks] = await Promise.all([
        this.tasksService.getProject(projectId),
        this.statusesService.getByProject(projectId),
        this.tasksService.getByProject(projectId),
      ]);

      this.projectName.set(String(project['name'] ?? 'Mi proyecto'));
      this.statuses.set(statuses);
      this.tasks.set(tasks);

      if (!statuses.some((status) => status.id === this.newStatusId())) {
        this.newStatusId.set(
          statuses.find((status) => status.is_initial)?.id ?? statuses[0]?.id ?? '',
        );
      }

      if (statuses.length === 0) {
        this.errorMessage.set('Este proyecto todavía no tiene estados en la colección statuses.');
      }
    } catch (error) {
      console.error('Error cargando el tablero:', error);
      this.errorMessage.set(
        'No se pudo cargar el tablero. Comprueba los permisos y las relaciones en PocketBase.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  getTasks(statusId: string): Task[] {
    return this.tasks()
      .filter((task) => task.status === statusId)
      .sort((a, b) => a.position - b.position);
  }

  openCreateForm(statusId: string): void {
    this.newStatusId.set(statusId);
    this.newTitle.set('');
    this.newDescription.set('');
    this.newPriority.set('medium');
    this.showCreateForm.set(true);
  }

  async createTask(): Promise<void> {
    const title = this.newTitle().trim();
    const statusId = this.newStatusId();

    if (!title || !statusId || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set('');

    try {
      const task = await this.tasksService.create({
        title,
        description: this.newDescription().trim(),
        project: this.projectId(),
        status: statusId,
        priority: this.newPriority(),
        position: this.getTasks(statusId).length,
      });

      this.showCreateForm.set(false);
    } catch (error) {
      console.error('Error creando la tarea:', error);
      this.errorMessage.set(
        'No se pudo crear la tarea. Revisa los campos obligatorios y las opciones de priority en PocketBase.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  async drop(event: CdkDragDrop<Task[]>, destinationStatusId: string): Promise<void> {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }

    const changes = new Map<string, { status: string; position: number }>();

    event.previousContainer.data.forEach((task, index) => {
      changes.set(task.id, {
        status: event.previousContainer.id,
        position: index,
      });
    });

    event.container.data.forEach((task, index) => {
      changes.set(task.id, {
        status: destinationStatusId,
        position: index,
      });
    });

    this.tasks.update((current) =>
      current.map((task) => {
        const change = changes.get(task.id);
        return change ? { ...task, ...change } : task;
      }),
    );

    try {
      await Promise.all(
        [...changes.entries()].map(([taskId, change]) =>
          this.tasksService.updatePosition(taskId, change.status, change.position),
        ),
      );
    } catch (error) {
      console.error('Error guardando el movimiento:', error);
      this.errorMessage.set('No se pudo guardar el cambio. Se recargará el tablero.');
      await this.loadBoard();
    }
  }

  priorityLabel(priority: TaskPriority): string {
    const labels: Record<TaskPriority, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      highest: 'Urgente',
    };

    return labels[priority] ?? String(priority);
  }
  // fetch

  private async startRealtime(): Promise<void> {
    await this.unsubscribeTasks?.();
    this.unsubscribeTasks = undefined;

    const projectId = this.projectId();

    this.unsubscribeTasks = await this.tasksService.subscribeToProject(
      projectId,
      (action, task) => {
        this.tasks.update((current) => {
          if (action === 'delete' || task.project !== projectId) {
            return current.filter((item) => item.id !== task.id);
          }

          // Crear o actualizar sin duplicar tareas.
          if (action === 'create' || action === 'update') {
            const exists = current.some((item) => item.id === task.id);

            return exists
              ? current.map((item) => (item.id === task.id ? task : item))
              : [...current, task];
          }

          return current;
        });
      },
    );
  }
  closeTaskForm(): void {
    this.showCreateForm.set(false);
    this.editingTaskId.set('');
  }

  openEditTaskForm(task: Task): void {
    this.editingTaskId.set(task.id);
    this.newTitle.set(task.title);
    this.newDescription.set(task.description ?? '');
    this.newPriority.set(task.priority);
    this.newStatusId.set(task.status);
    this.showCreateForm.set(true);
  }

  async saveTask(): Promise<void> {
    const title = this.newTitle().trim();
    const statusId = this.newStatusId();

    if (!title || !statusId || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set('');

    try {
      const taskId = this.editingTaskId();

      if (taskId) {
        const updated = await this.tasksService.update(taskId, {
          title,
          description: this.newDescription().trim(),
          status: statusId,
          priority: this.newPriority(),
        });

        this.tasks.update((items) => items.map((item) => (item.id === taskId ? updated : item)));
      } else {
        const created = await this.tasksService.create({
          title,
          description: this.newDescription().trim(),
          project: this.projectId(),
          status: statusId,
          priority: this.newPriority(),
          position: this.getTasks(statusId).length,
        });

        this.tasks.update((items) => [...items, created]);
      }

      this.closeTaskForm();
    } catch (error) {
      console.error('Error guardando la tarea:', error);
      this.errorMessage.set('No se pudo guardar la tarea.');
    } finally {
      this.saving.set(false);
    }
  }

  async deleteTask(task: Task): Promise<void> {
    const confirmed = confirm(`¿Quieres eliminar la tarea "${task.title}"?`);
    if (!confirmed || this.saving()) return;

    this.saving.set(true);

    try {
      await this.tasksService.delete(task.id);
      this.tasks.update((items) => items.filter((item) => item.id !== task.id));
    } catch (error) {
      console.error('Error eliminando la tarea:', error);
      this.errorMessage.set('No se pudo eliminar la tarea.');
    } finally {
      this.saving.set(false);
    }
  }

  openStatusForm(status?: Status): void {
    this.editingStatusId.set(status?.id ?? '');
    this.statusName.set(status?.name ?? '');
    this.statusColor.set(status?.color || '#635bff');
    this.showStatusForm.set(true);
  }

  closeStatusForm(): void {
    this.showStatusForm.set(false);
    this.editingStatusId.set('');
  }

  async saveStatus(): Promise<void> {
    const name = this.statusName().trim();
    if (!name || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set('');

    try {
      const statusId = this.editingStatusId();

      if (statusId) {
        const updated = await this.statusesService.update(statusId, {
          name,
          color: this.statusColor(),
          category: this.statusCategory(),
        });

        this.statuses.update((items) =>
          items.map((item) => (item.id === statusId ? updated : item)),
        );
      } else {
        const created = await this.statusesService.create({
          name,
          color: this.statusColor(),
          projects: this.projectId(),
          position: this.statuses().length,
          category: this.statusCategory(),
          is_initial: this.statuses().length === 0,
        });

        this.statuses.update((items) => [...items, created]);
        this.newStatusId.set(created.id);
      }

      this.closeStatusForm();
    } catch (error) {
      console.error('Error guardando el estado:', error);
      this.errorMessage.set(
        'No se pudo guardar el estado. Comprueba los campos y los permisos de PocketBase.',
      );
    } finally {
      this.saving.set(false);
    }
  }

  async deleteStatus(status: Status): Promise<void> {
    const associatedTasks = this.getTasks(status.id);

    if (associatedTasks.length > 0) {
      this.errorMessage.set(
        `No puedes eliminar "${status.name}" porque tiene ${associatedTasks.length} tarea(s). Mueve o elimina esas tareas primero.`,
      );
      return;
    }

    if (!confirm(`¿Quieres eliminar el estado "${status.name}"?`)) return;

    this.saving.set(true);
    this.errorMessage.set('');

    try {
      await this.statusesService.delete(status.id);

      this.statuses.update((items) => items.filter((item) => item.id !== status.id));

      if (this.newStatusId() === status.id) {
        this.newStatusId.set(this.statuses()[0]?.id ?? '');
      }
    } catch (error) {
      console.error('Error eliminando el estado:', error);
      this.errorMessage.set('No se pudo eliminar el estado.');
    } finally {
      this.saving.set(false);
    }
  }

  async dropStatuses(event: CdkDragDrop<Status[]>): Promise<void> {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const previousStatuses = [...this.statuses()];
    const reorderedStatuses = [...previousStatuses];

    moveItemInArray(reorderedStatuses, event.previousIndex, event.currentIndex);

    // Actualizar la interfaz inmediatamente
    this.statuses.set(reorderedStatuses);
    this.saving.set(true);
    this.errorMessage.set('');

    try {
      // Guardar la nueva posición de cada columna en PocketBase
      await Promise.all(
        reorderedStatuses.map((status, index) =>
          this.statusesService.update(status.id, {
            position: index,
          }),
        ),
      );
    } catch (error) {
      // Restaurar el orden anterior si falla el guardado
      this.statuses.set(previousStatuses);
      this.errorMessage.set('No se pudo guardar el orden de las columnas.');

      console.error('Error al reordenar estados:', error);
    } finally {
      this.saving.set(false);
    }
  }
}
