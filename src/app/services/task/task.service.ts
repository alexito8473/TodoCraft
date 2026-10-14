import { inject, Injectable } from '@angular/core';
import { PocketBaseService } from '../pocketBase/pocketBaseService.service';
import { Task, TaskPriority } from '../../models/tasks/task.model';

export interface CreateTaskData {
  title: string;
  description: string;
  project: string;
  status: string;
  priority: TaskPriority;
  position: number;
  phase?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: string;
  priority?: TaskPriority;
  position?: number;
  phase?: string;
}

@Injectable({ providedIn: 'root' })
export class TasksService {
  private readonly pb = inject(PocketBaseService).client;

  async getByProject(projectId: string): Promise<Task[]> {
    return this.pb.collection('tasks').getFullList<Task>({
      filter: `project = "${this.escapeFilterValue(projectId)}"`,
      sort: 'position,created',
    });
  }

  async getById(taskId: string): Promise<Task> {
    return this.pb.collection('tasks').getOne<Task>(taskId);
  }

  async create(data: CreateTaskData): Promise<Task> {
    const payload = {
      ...data,
      title: data.title.trim(),
      description: data.description?.trim() ?? '',
    };

    return this.pb.collection('tasks').create<Task>(payload);
  }

  async update(taskId: string, data: UpdateTaskData): Promise<Task> {
    const payload: UpdateTaskData = { ...data };

    if (data.title !== undefined) {
      payload.title = data.title.trim();
    }

    if (data.description !== undefined) {
      payload.description = data.description.trim();
    }

    return this.pb.collection('tasks').update<Task>(taskId, payload);
  }

  async updatePosition(taskId: string, statusId: string, position: number): Promise<Task> {
    return this.pb.collection('tasks').update<Task>(taskId, {
      status: statusId,
      position,
    });
  }

  async delete(taskId: string): Promise<boolean> {
    return this.pb.collection('tasks').delete(taskId);
  }
  async getProject(projectId: string) {
    return this.pb.collection('projects').getOne(projectId);
  }

  async subscribeToProject(
    projectId: string,
    onChange: (action: string, task: Task) => void,
  ): Promise<() => Promise<void>> {
    const unsubscribe = await this.pb.collection('tasks').subscribe('*', (event) => {
      const task = event.record as unknown as Task;
      if (task.project !== projectId) {
        return;
      }

      onChange(event.action, task);
    });

    return unsubscribe;
  }

  private escapeFilterValue(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }
}
