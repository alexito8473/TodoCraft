import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.Login),
  },
  {
    path: 'projects/:projectId',
    loadComponent: () =>
      import('./pages/projects/project-detail/project-detail').then((m) => m.ProjectDetail),
  },
  {
    path: 'projects',
    loadComponent: () =>
      import('./pages/projects/project-list/project-list').then((m) => m.ProjectList),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
