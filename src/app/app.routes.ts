import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'consulta-nfse',
    loadComponent: () => import('./features/consulta-nfse/consulta-nfse.component').then(m => m.ConsultaNfseComponent)
  },
  {
    path: 'consulta-credito',
    loadComponent: () => import('./features/consulta-credito/consulta-credito.component').then(m => m.ConsultaCreditoComponent)
  },
  {
    path: '',
    redirectTo: '/consulta-nfse',
    pathMatch: 'full'
  }
];
