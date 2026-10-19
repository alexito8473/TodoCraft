import { Injectable, inject } from '@angular/core';
import { PocketBaseService } from '../pocketBase/pocketBaseService.service';

export type ProjectRole = 'admin' | 'editor' | 'reader';

export interface InvitationResult {
  code: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class ProjectSharingService {
  private readonly pb = inject(PocketBaseService).client;

  async createInvitation(
    projectId: string,
    role: ProjectRole = 'editor',
  ): Promise<InvitationResult> {
    const code = crypto.randomUUID().replace(/-/g, '');

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const currentUserId = this.pb.authStore.record?.id;

    if (!currentUserId) {
      throw new Error('Debes iniciar sesión para compartir un proyecto.');
    }

    try {
      const record = await this.pb.collection('project_invitations').create({
        token_hash: code,
        project: projectId,
        email: '',
        role,
        invited_by: currentUserId,
        expires_at: expiresAt,
      });

      return {
        code: record['token_hash'] as string,
        expiresAt: record['expires_at'] as string,
      };
    } catch (error: any) {
      console.error('Status:', error?.status);
      console.error('Mensaje:', error?.message);
      console.error('Respuesta completa:', JSON.stringify(error?.response, null, 2));
      console.error(
        'Datos enviados:',
        JSON.stringify(
          {
            token_hash: code,
            project: projectId,
            email: '',
            role,
            invited_by: currentUserId,
            expires_at: expiresAt,
          },
          null,
          2,
        ),
      );

      throw error;
    }
  }

  async receiveProject(codeInput: string): Promise<{ projectId: string; role: ProjectRole }> {
    let code = codeInput.trim();

    // Aceptar tanto el código como una URL que contenga ?code=
    try {
      const url = new URL(code);
      code = url.searchParams.get('code') ?? code;
    } catch {
      // No es una URL; utilizar el código introducido.
    }

    if (!/^[a-fA-F0-9]{32}$/.test(code)) {
      throw new Error('El código debe tener 32 caracteres hexadecimales.');
    }

    const currentUserId = this.pb.authStore.record?.id;

    if (!currentUserId) {
      throw new Error('Debes iniciar sesión para recibir el proyecto.');
    }

    // Buscar la invitación.
    const invitation = await this.pb
      .collection('project_invitations')
      .getFirstListItem(`token_hash = "${code}"`);

    const expiresAt = invitation['expires_at'] as string;
    const acceptedAt = invitation['accepted_at'] as string | null;

    if (acceptedAt) {
      throw new Error('Este código ya se ha utilizado.');
    }

    if (!expiresAt || new Date(expiresAt).getTime() <= Date.now()) {
      throw new Error('El código ha caducado.');
    }

    const projectId = invitation['project'] as string;
    const role = invitation['role'] as ProjectRole;

    // Comprobar si el usuario ya es miembro del proyecto.
    const existingMembers = await this.pb.collection('project_members').getList(1, 1, {
      filter: `project = "${projectId}" && user = "${currentUserId}"`,
    });

    // Crear la relación solo si todavía no existe.
    if (existingMembers.items.length === 0) {
      await this.pb.collection('project_members').create({
        project: projectId,
        user: currentUserId,
        role,
      });
    }

    // Marcar la invitación como aceptada.
    await this.pb.collection('project_invitations').update(invitation.id, {
      accepted_at: new Date().toISOString(),
    });

    return {
      projectId,
      role,
    };
  }
}
