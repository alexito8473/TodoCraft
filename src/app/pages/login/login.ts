import { Component, inject } from '@angular/core';
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
  private readonly authService = inject(AuthServiceService);

  email = '';
  password = '';
  loading = false;
  errorMessage = '';
  showPassword = false;

  async onSubmit(): Promise<void> {
    this.errorMessage = '';

    if (!this.email.trim() || !this.password) {
      this.errorMessage = 'Introduce tu correo y contraseña.';
      return;
    }

    this.loading = true;

    try {
      await this.authService.login(this.email.trim(), this.password);
    } catch {
      this.errorMessage = 'No se ha podido iniciar sesión. Comprueba tus credenciales.';
    } finally {
      this.loading = false;
    }
  }
}
