import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-100 p-6">
      <div class="max-w-7xl mx-auto">
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div class="bg-white shadow rounded-lg p-6">
          <p class="text-gray-600">Welcome to your dashboard!</p>
          <p class="mt-4 text-gray-800">Your role: 
            <span class="font-semibold">{{ authService.userRole$() }}</span>
          </p>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {
  protected authService = inject(AuthService);
}