import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-100 p-6">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <div class="bg-white shadow rounded-lg p-6">
          <p class="text-gray-600">Welcome to your dashboard!</p>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent {}