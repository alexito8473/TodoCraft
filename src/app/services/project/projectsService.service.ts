import { inject, Injectable } from '@angular/core';
import { PocketBaseService } from '../pocketBase/pocketBaseService.service';
import { Project } from '../../models/projects/project.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private readonly pb = inject(PocketBaseService).client;

  getAll() {
    return this.pb.collection('projects').getFullList<Project>({
      sort: '-created',
    });
  }

  create(data: { name: string; description: string; color: string; owner: string }) {
    return this.pb.collection('projects').create<Project>(data);
  }
  getCurrentUserId(): string {
  return this.pb.authStore.record?.id ?? '';
}
}
