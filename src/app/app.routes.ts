import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/todo-home/todo-home').then((m) => m.TodoHomeComponent),
  },
  {
    path: 'todo/:id',
    loadComponent: () =>
      import('./pages/todo-detail/todo-detail').then((m) => m.TodoDetailComponent),
  },
  {
    path: 'stats',
    loadComponent: () => import('./pages/stats/stats').then((m) => m.StatsComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
