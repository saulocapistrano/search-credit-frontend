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
    path: 'solicitacao-credito',
    loadComponent: () => import('./features/credito-create/credito-create.component').then(m => m.CreditoCreateComponent)
  },
  {
    path: 'minhas-solicitacoes',
    loadComponent: () => import('./features/meus-creditos/meus-creditos.component').then(m => m.MeusCreditosComponent)
  },
  {
    path: 'lista-geral-solicitacoes',
    loadComponent: () => import('./features/lista-geral-creditos-admin/lista-geral-creditos-admin.component').then(m => m.ListaGeralCreditosAdminComponent)
  },
  {
    path: 'lista-geral-creditos',
    loadComponent: () => import('./features/lista-geral-creditos/lista-geral-creditos.component').then(m => m.ListaGeralCreditosComponent)
  },
  {
    path: '',
    redirectTo: '/consulta-nfse',
    pathMatch: 'full'
  }
];
