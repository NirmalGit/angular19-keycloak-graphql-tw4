import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isAuthenticatedSignal = signal<boolean>(false);
  readonly isAuthenticated$ = this.isAuthenticatedSignal.asReadonly();

  constructor(private router: Router) {}

  login(username: string, password: string): boolean {
    // TODO: Implement actual authentication logic
    if (username && password) {
      this.isAuthenticatedSignal.set(true);
      this.router.navigate(['/dashboard']);
      return true;
    }
    return false;
  }

  logout() {
    this.isAuthenticatedSignal.set(false);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSignal();
  }
}