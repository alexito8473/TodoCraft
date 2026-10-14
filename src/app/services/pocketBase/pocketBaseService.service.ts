import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import PocketBase from 'pocketbase';
@Injectable({
  providedIn: 'root',
})
export class PocketBaseService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly client = new PocketBase('http://192.168.18.121:8090');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.client.authStore.loadFromCookie(document.cookie || '');
    }
  }

  saveAuthCookie(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.cookie = this.client.authStore.exportToCookie({
        httpOnly: false,
        secure: location.protocol === 'https:',
        sameSite: 'Lax',
        path: '/',
      });
    }
  }

  clearAuthCookie(): void {
    if (isPlatformBrowser(this.platformId)) {
      document.cookie = 'pb_auth=; Path=/; Max-Age=0; SameSite=Lax';
    }
  }
}
