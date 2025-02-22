import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal, effect } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, map, tap, interval, Subscription } from 'rxjs';
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
  private readonly BASE_URL = 'http://localhost:8080';
  private readonly AUTH_ENDPOINT = `${this.BASE_URL}/realms/baxter_realm/protocol/openid-connect/auth`;
  private readonly TOKEN_ENDPOINT = `${this.BASE_URL}/realms/baxter_realm/protocol/openid-connect/token`;
  private readonly LOGOUT_ENDPOINT = `${this.BASE_URL}/realms/baxter_realm/protocol/openid-connect/logout`;
  private readonly CLIENT_ID = 'baxter_client';
  private readonly CLIENT_SECRET = 'dGDP5dxWfxZPPxahwSr6XVL3YATB9pev';
  private readonly REDIRECT_URI = 'http://localhost:4200/login';
  private errorMessage = signal<string>('');

  private isAuthenticatedSignal = signal<boolean>(false);
  private tokenSignal = signal<string | null>(null);
  private userRoleSignal = signal<string>('');
  private tokenExpirySignal = signal<number>(0);
  private refreshTimerSubscription?: Subscription;

  readonly isAuthenticated$ = this.isAuthenticatedSignal.asReadonly();
  readonly userRole$ = computed(() => this.userRoleSignal());
  readonly tokenTimeRemaining$ = computed(() => this.tokenExpirySignal());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkStoredToken();
    this.handleAuthorizationCode();

    // Setup effect to monitor token expiry
    effect(() => {
      const timeRemaining = this.tokenTimeRemaining$();
      if (timeRemaining > 0 && timeRemaining <= 30) {
        this.refreshToken();
      }
    });
  }

  checkAuthentication() {
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.initiateLogin();
      return false;
    }
    this.tokenSignal.set(token);
    this.isAuthenticatedSignal.set(true);
    this.updateUserRole(token);
    return true;
  }

  private checkStoredToken() {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const expiryTime = (decodedToken as any).exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeRemaining = Math.floor((expiryTime - now) / 1000);
        
        if (timeRemaining > 0) {
          this.tokenSignal.set(token);
          this.isAuthenticatedSignal.set(true);
          this.updateUserRole(token);
          this.startExpiryTimer(timeRemaining);
        } else {
          this.refreshToken();
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        this.logout();
      }
    }
  }

  initiateLogin() {
    this.logout();
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      response_type: 'code',
      redirect_uri: this.REDIRECT_URI
    });
    window.location.href = `${this.AUTH_ENDPOINT}?${params.toString()}`;
  }

  private async handleAuthorizationCode(): Promise<void> {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
      console.log('Starting token exchange with code:', code);
      
      const body = new URLSearchParams();
      body.set('grant_type', 'authorization_code');
      body.set('code', code);
      body.set('redirect_uri', this.REDIRECT_URI);
      body.set('client_id', this.CLIENT_ID);
      body.set('client_secret', this.CLIENT_SECRET);

      try {
        const response = await fetch(this.TOKEN_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const token: KeycloakToken = await response.json();
        console.log('Token exchange successful');
        
        localStorage.setItem('access_token', token.access_token);
        localStorage.setItem('refresh_token', token.refresh_token);
        this.tokenSignal.set(token.access_token);
        this.isAuthenticatedSignal.set(true);
        this.updateUserRole(token.access_token);
        this.startExpiryTimer(token.expires_in);
        window.history.replaceState({}, document.title, window.location.pathname);
        this.router.navigate(['/dashboard']);
      } catch (error) {
        console.error('Token exchange error:', error);
        this.errorMessage.set('Authentication failed. Please try again.');
        this.logout();
        this.router.navigate(['/login']);
      }
    }
  }

  private startExpiryTimer(expiresIn: number) {
    if (this.refreshTimerSubscription) {
      this.refreshTimerSubscription.unsubscribe();
    }

    this.tokenExpirySignal.set(expiresIn);
    this.refreshTimerSubscription = interval(1000).subscribe(() => {
      const newValue = this.tokenExpirySignal() - 1;
      this.tokenExpirySignal.set(newValue > 0 ? newValue : 0);
    });
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      this.logout();
      return;
    }

    const body = new URLSearchParams();
    body.set('grant_type', 'refresh_token');
    body.set('refresh_token', refreshToken);
    body.set('client_id', this.CLIENT_ID);
    body.set('client_secret', this.CLIENT_SECRET);

    try {
      const response = await fetch(this.TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const token: KeycloakToken = await response.json();
      localStorage.setItem('access_token', token.access_token);
      localStorage.setItem('refresh_token', token.refresh_token);
      this.tokenSignal.set(token.access_token);
      this.isAuthenticatedSignal.set(true);
      this.updateUserRole(token.access_token);
      this.startExpiryTimer(token.expires_in);
    } catch (error) {
      console.error('Token refresh error:', error);
      this.logout();
    }
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
    if (this.refreshTimerSubscription) {
      this.refreshTimerSubscription.unsubscribe();
    }
    this.tokenExpirySignal.set(0);

    const refreshToken = localStorage.getItem('refresh_token');
    const body = new URLSearchParams();
    body.set('client_id', this.CLIENT_ID);
    body.set('client_secret', this.CLIENT_SECRET);
    body.set('refresh_token', refreshToken || '');

    // Clear local state first
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.tokenSignal.set(null);
    this.isAuthenticatedSignal.set(false);
    this.userRoleSignal.set('');

    // Notify Keycloak about logout
    fetch(this.LOGOUT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    }).finally(() => {
      // Redirect to login page regardless of logout endpoint response
      this.router.navigate(['/login']);
    });
  }

  getToken(): string | null {
    return this.tokenSignal();
  }

  isAuthenticated(): boolean {
    return this.isAuthenticatedSignal();
  }
}