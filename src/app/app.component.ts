import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, filter } from 'rxjs';
import { UserProfileSelectorComponent } from './shared/components/user-profile-selector/user-profile-selector.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { UserRoleService, UserRole } from './core/services/user-role.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, UserProfileSelectorComponent, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Consulta de Créditos';
  
  private readonly router = inject(Router);
  private readonly userRoleService = inject(UserRoleService);
  private roleSubscription?: Subscription;
  private navigationSubscription?: Subscription;
  private isInitialLoad = true;
  private lastRole: UserRole | null = null;

  // Propriedades para controle do menu
  currentRole: UserRole = 'admin-consulta';
  
  // Métodos para verificar acesso aos itens do menu
  canAccessConsultaNfse(): boolean {
    return this.currentRole === 'admin-consulta';
  }

  canAccessConsultaCredito(): boolean {
    return this.currentRole === 'admin-consulta';
  }

  canAccessSolicitacaoCredito(): boolean {
    return this.currentRole === 'admin-solicitacao' || this.currentRole === 'admin-full';
  }

  canAccessMinhasSolicitacoes(): boolean {
    return this.currentRole === 'admin-solicitacao' || this.currentRole === 'admin-full';
  }

  canAccessListaGeral(): boolean {
    return this.currentRole === 'admin-full';
  }

  canAccessListaGeralCreditos(): boolean {
    return this.currentRole === 'admin-full';
  }

  ngOnInit(): void {
    // Redirecionar na inicialização baseado no perfil atual
    const initialRole = this.userRoleService.getRole();
    this.currentRole = initialRole;
    this.lastRole = initialRole;
    this.redirectBasedOnRole(initialRole, true);

    // Escutar mudanças de perfil e redirecionar
    this.roleSubscription = this.userRoleService.role$.subscribe(role => {
      this.currentRole = role;
      // Ignorar a primeira emissão (que é o valor inicial)
      if (this.lastRole !== null && this.lastRole !== role) {
        this.redirectBasedOnRole(role, false);
      }
      this.lastRole = role;
      this.isInitialLoad = false;
    });

    // Marcar quando a navegação inicial terminar
    this.navigationSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isInitialLoad) {
          this.isInitialLoad = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.roleSubscription?.unsubscribe();
    this.navigationSubscription?.unsubscribe();
  }

  private redirectBasedOnRole(role: UserRole, isInitialLoad: boolean): void {
    const currentUrl = this.router.url;
    
    // Mapear perfil para rota destino (dashboard inicial)
    let targetRoute: string | null = null;
    
    switch (role) {
      case 'admin-consulta':
        // Admin Consulta → Consulta por NFS-e
        targetRoute = '/consulta-nfse';
        break;
      case 'admin-solicitacao':
        // Admin Solicitação → Solicitação de Crédito
        targetRoute = '/solicitacao-credito';
        break;
      case 'admin-full':
        // Admin Full → Lista Geral de Créditos (sempre redireciona quando muda para este perfil)
        targetRoute = '/lista-geral-creditos';
        break;
      default:
        targetRoute = '/consulta-nfse';
    }

    // Só redireciona se não estiver já na rota correta e se houver uma rota destino definida
    if (targetRoute && currentUrl !== targetRoute) {
      this.router.navigate([targetRoute]);
    }
  }
}
