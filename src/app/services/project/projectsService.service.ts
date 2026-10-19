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
  async getAllShared() {
    const listSharedProjects = (
      await this.pb.collection('project_members').getFullList<any>({
        filter: `user="${this.pb.authStore.record?.id}"`,
      })
    ).map((projects) => projects['project'] as string);
    console.log('IDs de proyectos compartidos:', listSharedProjects);
    if (listSharedProjects.length === 0) {
      return [];
    }
    const filterQuery = listSharedProjects.map((id) => `id="${id}"`).join(' || ');
    console.log('Filtro para proyectos compartidos:', filterQuery);
    return this.pb.collection('projects').getFullList<Project>({
      sort: '-created',
      filter: filterQuery,
    });
  }
  create(data: { name: string; description: string; color: string; owner: string }) {
    return this.pb.collection('projects').create<Project>(data);
  }
  getCurrentUserId(): string {
    return this.pb.authStore.record?.id ?? '';
  }
}
