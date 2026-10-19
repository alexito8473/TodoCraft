import { Component, inject, signal } from '@angular/core';
import { AuthServiceService } from '../../services/auth/authService.service';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.scss',
  templateUrl: './login.html',
})
export class Login {
  // variable
  email = signal<string>('');
  password = signal<string>('');
  loading = signal<boolean>(false);
  errorMessage = signal<string>('');
  showPassword = signal<boolean>(false);

  // inject
  private readonly authService = inject(AuthServiceService);

  // functions
  async onSubmit(): Promise<void> {
    this.errorMessage.set('');

    if (!this.email().trim() || !this.password()) {
      this.errorMessage.set('Introduce tu correo y contraseña.');
      return;
    }

    this.loading.set(true);

    try {
      await this.authService.login(this.email().trim(), this.password());
    } catch (error: unknown) {
      console.log(error);
      this.errorMessage.set('No se ha podido iniciar sesión. Comprueba tus credenciales.');
    } finally {
      this.loading.set(false);
    }
  }
}
