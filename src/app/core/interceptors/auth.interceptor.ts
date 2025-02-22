import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Skip auth interceptor for all Keycloak-related requests
  if (req.url.includes('/realms/baxter_realm/')) {
    return next(req);
  }

  // Skip adding auth header for token endpoint
  if (req.url.includes('/token')) {
    return next(req);
  }

  const token = authService.getToken();
  if (token) {
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(clonedReq);
  }

  return next(req);
};