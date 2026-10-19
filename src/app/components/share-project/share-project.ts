import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ProjectRole,
  ProjectSharingService,
} from '../../services/projectSharing/projectSharing.service';

@Component({
  selector: 'app-share-project',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './share-project.html',
  styleUrl: './share-project.scss',
})
export class ShareProjectComponent {
  @Input({ required: true }) projectId = '';
  @Output() close = new EventEmitter<void>();

  private readonly sharing = inject(ProjectSharingService);

  role: ProjectRole = 'editor';

  code = signal('');
  expiresAt = signal('');
  loading = signal(false);
  error = signal('');
  copied = signal(false);

  async createCode(): Promise<void> {
    this.error.set('');
    this.code.set('');
    this.expiresAt.set('');
    this.copied.set(false);

    if (!this.projectId?.trim()) {
      this.error.set('No se ha recibido el ID del proyecto.');
      return;
    }

    if (this.loading()) return;

    this.loading.set(true);

    try {
      const invitation = await this.sharing.createInvitation(this.projectId, this.role);

      this.code.set(invitation.code);
      this.expiresAt.set(invitation.expiresAt);
    } catch (err: unknown) {
      console.error('Error creando invitación:', err);

      const e = err as {
        message?: string;
        response?: {
          message?: string;
          data?: Record<string, { message?: string }>;
        };
      };

      const fieldErrors = Object.entries(e.response?.data ?? {})
        .map(([field, detail]) => `${field}: ${detail.message ?? 'valor inválido'}`)
        .join(', ');

      this.error.set(
        fieldErrors ||
          e.response?.message ||
          e.message ||
          'No se pudo crear el código. Revisa las reglas de PocketBase.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async copyCode(): Promise<void> {
    if (!this.code()) return;

    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
    } catch {
      this.error.set('No se pudo copiar. Selecciona el código y cópialo manualmente.');
    }
  }

  closePanel(): void {
    this.close.emit();
  }
}
