import { inject, Injectable } from '@angular/core';
import { PocketBaseService } from '../pocketBase/pocketBaseService.service';
import { Status } from '../../models/status/status.model';

export interface CreateStatusData {
  name: string;
  projects: string;
  category: string;
  color: string;
  position: number;
  is_initial: boolean;
}

export interface UpdateStatusData {
  name?: string;
  category?: string;
  color?: string;
  position?: number;
  is_initial?: boolean;
}

@Injectable({ providedIn: 'root' })
export class StatusesService {
  private readonly pb = inject(PocketBaseService).client;

  async getByProject(projectId: string): Promise<Status[]> {
    return this.pb.collection('statuses').getFullList<Status>({
      filter: `projects = "${this.escapeFilterValue(projectId)}"`,
      sort: 'position,created',
    });
  }

  async getById(statusId: string): Promise<Status> {
    return this.pb.collection('statuses').getOne<Status>(statusId);
  }

  async create(data: CreateStatusData): Promise<Status> {
    const payload: CreateStatusData = {
      ...data,
      name: data.name.trim(),
    };

    return this.pb.collection('statuses').create<Status>(payload);
  }

  async update(statusId: string, data: UpdateStatusData): Promise<Status> {
    const payload: UpdateStatusData = { ...data };

    if (data.name !== undefined) {
      payload.name = data.name.trim();
    }

    return this.pb.collection('statuses').update<Status>(statusId, payload);
  }

  async delete(statusId: string): Promise<boolean> {
    return this.pb.collection('statuses').delete(statusId);
  }

  private escapeFilterValue(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }
}
