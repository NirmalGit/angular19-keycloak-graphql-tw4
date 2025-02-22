import { Component } from '@angular/core';
import { AuthService } from '@app/core/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-token-timer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-2">
      <span class="text-sm">Token expires in: {{ formatTime(tokenTimeRemaining()) }}</span>
      <button 
        (click)="refreshToken()"
        class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Refresh
      </button>
    </div>
  `,
  styles: []
})
export class TokenTimerComponent {
  readonly tokenTimeRemaining;

  constructor(private authService: AuthService) {
    this.tokenTimeRemaining = this.authService.tokenTimeRemaining$;
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  refreshToken() {
    this.authService.refreshToken();
  }
}