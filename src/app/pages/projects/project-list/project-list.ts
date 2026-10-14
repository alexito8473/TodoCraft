import { Component, inject, signal } from '@angular/core';
import { ProjectsService } from '../../../services/project/projectsService.service';
import { Project } from '../../../models/projects/project.model';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-project-list',
  styleUrl: './project-list.scss',
  templateUrl: './project-list.html',
})
export class ProjectList {
  // varibale
  projects = signal<Project[]>([]);
  search = signal('');
  loading = signal(false);
  errorMessage = signal('');

  showModal = signal(false);
  saving = signal(false);

  name = signal('');
  description = signal('');
  color = signal('#635bff');

  // inject
  private readonly projectsService = inject(ProjectsService);

  async ngOnInit(): Promise<void> {
    await this.loadProjects();
  }

  // get

  get filteredProjects(): Project[] {
    const query = this.search().trim().toLowerCase();

    if (!query) return this.projects();

    return this.projects().filter((project) =>
      `${project.name} ${project.description}`.toLowerCase().includes(query),
    );
  }

  // functions
  async loadProjects(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      this.projects.set(await this.projectsService.getAll());
    } catch {
      this.errorMessage.set(
        'No se han podido cargar los proyectos. Comprueba la conexión con PocketBase.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  openModal(): void {
    this.name.set('');
    this.description.set('');
    this.color.set('#635bff');
    this.showModal.set(true);
  }

  async createProject(): Promise<void> {
    const projectName = this.name().trim();

    if (!projectName || this.saving()) return;

    const owner = this.projectsService.getCurrentUserId();

    if (!owner) {
      this.errorMessage.set('Debes iniciar sesión para crear proyectos.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');

    try {
      const project = await this.projectsService.create({
        name: projectName,
        description: this.description().trim(),
        color: this.color(),
        owner,
      });

      this.projects.set([project, ...this.projects()]);
      this.showModal.set(false);
    } catch {
      this.errorMessage.set(
        'No se ha podido crear el proyecto. Revisa la colección de PocketBase.',
      );
    } finally {
      this.saving.set(false);
    }
  }
}
