import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div class="max-w-lg w-full text-center">
        <h1 class="text-6xl font-bold text-indigo-600">404</h1>
        <p class="mt-4 text-2xl font-semibold text-gray-900">Page not found</p>
        <p class="mt-2 text-gray-600">Sorry, we couldn't find the page you're looking for.</p>
        <div class="mt-6">
          <a routerLink="/login" class="text-indigo-600 hover:text-indigo-500">Go back home</a>
        </div>
      </div>
    </div>
  `
})
export class NotFoundComponent {}