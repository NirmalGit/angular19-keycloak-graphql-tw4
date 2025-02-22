import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username: string = '';
  password: string = '';
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  constructor(private authService: AuthService) {}

  onSubmit() {
    if (this.username && this.password) {
      this.isLoading.set(true);
      this.errorMessage.set('');
      
      this.authService.login(this.username, this.password).subscribe({
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set('Invalid credentials. Please try again.');
          console.error('Login error:', error);
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
    }
  }
}