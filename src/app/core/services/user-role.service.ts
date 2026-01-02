import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type UserRole = 'admin-full' | 'admin-consulta' | 'admin-solicitacao';

const STORAGE_KEY = 'user-role';
const DEFAULT_ROLE: UserRole = 'admin-consulta';

/**
 * Serviço para gerenciamento de perfil de usuário.
 *
 * Gerencia o perfil atual do usuário com persistência em localStorage.
 * Permite alternar entre três perfis: admin-full, admin-consulta, admin-solicitacao.
 *
 * Exemplo de uso em componentes:
 * ```typescript
 * constructor(private userRoleService: UserRoleService) {}
 *
 * // Verificar perfil atual
 * if (this.userRoleService.isAdminFull()) {
 *   // Exibir funcionalidade apenas para admin-full
 * }
 *
 * // Usar em template com *ngIf
 * // <div *ngIf="userRoleService.isAdminFull()">Conteúdo exclusivo</div>
 *
 * // Escutar mudanças de perfil
 * this.userRoleService.role$.subscribe(role => {
 *   console.log('Perfil alterado para:', role);
 * });
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class UserRoleService {
  private readonly roleSubject: BehaviorSubject<UserRole>;
  public readonly role$: Observable<UserRole>;

  constructor() {
    const storedRole = this.getStoredRole();
    this.roleSubject = new BehaviorSubject<UserRole>(storedRole);
    this.role$ = this.roleSubject.asObservable();
  }

  getRole(): UserRole {
    return this.roleSubject.value;
  }

  setRole(role: UserRole): void {
    this.roleSubject.next(role);
    this.storeRole(role);
  }

  isAdminFull(): boolean {
    return this.getRole() === 'admin-full';
  }

  isAdminConsulta(): boolean {
    return this.getRole() === 'admin-consulta';
  }

  isAdminSolicitacao(): boolean {
    return this.getRole() === 'admin-solicitacao';
  }

  private getStoredRole(): UserRole {
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_ROLE;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && this.isValidRole(stored)) {
        return stored as UserRole;
      }
    } catch (error) {
      console.warn('Erro ao ler localStorage:', error);
    }

    return DEFAULT_ROLE;
  }

  private storeRole(role: UserRole): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, role);
    } catch (error) {
      console.warn('Erro ao salvar no localStorage:', error);
    }
  }

  private isValidRole(role: string): boolean {
    return ['admin-full', 'admin-consulta', 'admin-solicitacao'].includes(role);
  }
}

