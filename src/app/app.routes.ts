import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/landing-page/landing-page.component').then(m => m.LandingPageComponent)
  },
  {
    path: 'details/:type/:id',
    loadComponent: () => import('./pages/media-details/media-details.component').then(m => m.MediaDetailsComponent)
  }
];
