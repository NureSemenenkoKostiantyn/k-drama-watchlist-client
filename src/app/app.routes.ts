import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Drama Watch',
    loadComponent: () =>
      import('./features/home/pages/home-page/home-page').then(({ HomePage }) => HomePage),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
