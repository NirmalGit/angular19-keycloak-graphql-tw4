import { Routes } from '@angular/router';
import { LoginComponent } from '@app/features/login/login.component';
import { DashboardComponent } from '@app/features/dashboard/dashboard.component';
import { NotFoundComponent } from '@app/not-found/not-found.component';
import { authGuard } from '@app/core/guards/auth.guard';
import { MainLayoutComponent } from '@app/layouts/main-layout/main-layout.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', component: NotFoundComponent }
];
