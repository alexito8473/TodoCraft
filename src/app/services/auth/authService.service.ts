import { inject, Injectable } from '@angular/core';
import { PocketBaseService } from '../pocketBase/pocketBaseService.service';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthServiceService {
  private readonly pocketBase = inject(PocketBaseService);
  private readonly router = inject(Router);

  async login(email: string, password: string): Promise<void> {
    await this.pocketBase.client.collection('userAppTodo').authWithPassword(email, password);

    this.pocketBase.saveAuthCookie();

    await this.router.navigate(['/projects']);
  }

  logout(): void {
    this.pocketBase.client.authStore.clear();
    this.pocketBase.clearAuthCookie();
    void this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.pocketBase.client.authStore.isValid;
  }
}
