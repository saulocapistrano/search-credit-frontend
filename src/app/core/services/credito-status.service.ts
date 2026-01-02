import { Injectable } from '@angular/core';

export type StatusCredito = 'CONSTITUIDO' | 'EM_ANALISE' | 'APROVADO' | 'REPROVADO';

@Injectable({
  providedIn: 'root'
})
export class CreditoStatusService {
  getStatusLabel(status: StatusCredito | string): string {
    const normalized = this.normalizeStatus(status);

    switch (normalized) {
      case 'CONSTITUIDO':
        return 'Constituído';
      case 'EM_ANALISE':
        return 'Em análise';
      case 'APROVADO':
        return 'Aprovado';
      case 'REPROVADO':
        return 'Reprovado';
      default:
        return status || 'Desconhecido';
    }
  }

  getStatusBadgeClass(status: StatusCredito | string): string {
    const normalized = this.normalizeStatus(status);

    switch (normalized) {
      case 'CONSTITUIDO':
        return 'badge-secondary';
      case 'EM_ANALISE':
        return 'badge-warning';
      case 'APROVADO':
        return 'badge-success';
      case 'REPROVADO':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  private normalizeStatus(status: StatusCredito | string): string {
    if (!status) {
      return '';
    }

    return status
      .toString()
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
  }
}
