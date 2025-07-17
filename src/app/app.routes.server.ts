import {RenderMode, ServerRoute} from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'details/:type/:id',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
