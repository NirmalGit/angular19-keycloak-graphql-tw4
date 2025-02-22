import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

interface KeycloakToken {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  session_state: string;
  scope: string;
}

interface JwtPayload {
  resource_access: {
    baxter_client: {
      roles: string[];
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_ENDPOINT = 'http://localhost:8080/realms/baxter_realm/protocol/openid-connect/token';
  private readonly CLIENT_ID = 'baxter_client';
  private readonly CLIENT_SECRET = 'dGDP5dxWfxZPPxahwSr6XVL3YATB9pev';

  private isAuthenticatedSignal = signal<boolean>(false);
  private tokenSignal = signal<string | null>(null);
  private userRoleSignal = signal<string>('');

  readonly isAuthenticated$ = this.isAuthenticatedSignal.asReadonly();
  readonly userRole$ = computed(() => this.userRoleSignal());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkStoredToken();
  }

  private checkStoredToken() {
    const token = localStorage.getItem('access_token');
    if (token) {
      this.tokenSignal.set(token);
      this.isAuthenticatedSignal.set(true);
      this.updateUserRole(token);
    }
  }

  login(username: string, password: string): Observable<KeycloakToken> {
    const body = new URLSearchParams();
    body.set('username', username);
    body.set('password', password);
    body.set('grant_type', 'password');
    body.set('client_id', this.CLIENT_ID);
    body.set('client_secret', this.CLIENT_SECRET);

    return this.http.post<KeycloakToken>(this.TOKEN_ENDPOINT, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }).pipe(
      tap(response => {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('refresh_token', response.refresh_token);
        this.tokenSignal.set(response.access_token);
        this.isAuthenticatedSignal.set(true);
        this.updateUserRole(response.access_token);
        this.router.navigate(['/dashboard']);
      })
    );
  }

  private updateUserRole(token: string) {
    try {
      const decodedToken = jwtDecode<JwtPayload>(token);
      const roles = decodedToken.resource_access?.baxter_client?.roles || [];
      this.userRoleSignal.set(roles.includes('admin') ? 'administrator' : 'user');
    } catch (error) {
      console.error('Error decoding token:', error);
      this.userRoleSignal.set('user');
    }
  }

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.tokenSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.userRoleSignal.set('');
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSignal();
  }
}