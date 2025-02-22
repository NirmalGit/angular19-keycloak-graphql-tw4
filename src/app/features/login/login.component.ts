import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <div *ngIf="errorMessage()" class="error-message">
        {{ errorMessage() }}
      </div>
      <div *ngIf="isLoading()" class="loading-message">
        <p>Processing authentication...</p>
      </div>
    </div>
  `,
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Check if we're handling a callback from Keycloak
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      // If we have a code, let the AuthService handle it
      this.isLoading.set(true);
      // The AuthService's constructor will handle the code exchange
    } else {
      // If no code is present and we're not authenticated, start the login flow
      const isAuthenticated = this.authService.isAuthenticated();
      if (!isAuthenticated) {
        this.authService.initiateLogin();
      }
    }
  }
}