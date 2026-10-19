import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectSharingService } from '../../services/projectSharing/projectSharing.service';
import { Router } from '@angular/router';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-receive-project',
  styleUrl: './receive-project.scss',
  templateUrl: './receive-project.html',
})
export class ReceiveProjectComponent {
  private readonly sharing = inject(ProjectSharingService);
  private readonly router = inject(Router);

  @Output() close = new EventEmitter<void>();

  code = '';
  loading = signal(false);
  error = signal('');
  success = signal('');

  async receive(): Promise<void> {
    this.error.set('');
    this.success.set('');

    if (!this.code.trim()) {
      this.error.set('Introduce el código que te han enviado.');
      return;
    }

    this.loading.set(true);

    try {
      const result = await this.sharing.receiveProject(this.code);

      this.success.set('Código aceptado. Abriendo proyecto...');

      await this.router.navigate(['/projects', result.projectId]);
      this.close.emit();
    } catch (error: unknown) {
      console.error('Error al recibir proyecto:', error);

      this.error.set(
        error instanceof Error ? error.message : 'No se ha podido recibir el proyecto.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
