import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CreditoService } from '../../core/services/credito.service';
import { CreditoStatusService } from '../../core/services/credito-status.service';
import { UserRoleService } from '../../core/services/user-role.service';
import { ToastService } from '../../core/services/toast.service';
import { CreditoWorkflowResponseDto } from '../../core/models/credito-workflow.dto';

@Component({
  selector: 'app-meus-creditos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meus-creditos.component.html',
  styleUrl: './meus-creditos.component.scss'
})
export class MeusCreditosComponent implements OnInit {
  private readonly creditoService = inject(CreditoService);
  readonly creditoStatusService = inject(CreditoStatusService);
  private readonly userRoleService = inject(UserRoleService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  creditos: CreditoWorkflowResponseDto[] = [];
  isLoading = false;
  canAccess = false;
  nomeSolicitante = 'Usuário Teste';

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  ngOnInit(): void {
    const role = this.userRoleService.getRole();
    this.canAccess = role === 'admin-solicitacao' || role === 'admin-full';

    if (!this.canAccess) {
      this.router.navigate(['/consulta-nfse']);
      return;
    }

    this.carregarNomeSolicitante();
    // Removida chamada automática - aguardar ação do usuário
  }

  private carregarNomeSolicitante(): void {
    const storedName = localStorage.getItem('nome-solicitante');
    if (storedName) {
      this.nomeSolicitante = storedName;
    }
  }

  carregarCreditos(): void {
    this.isLoading = true;

    this.creditoService.buscarMinhasSolicitacoes(this.nomeSolicitante, this.currentPage, this.pageSize).subscribe({
      next: (response) => {
        this.creditos = response.content || [];
        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        const message = (error?.message || 'Erro desconhecido')
          .replace(/solicita(ç|c)[aã]o de cr(é|e)dito/gi, 'crédito');
        this.toastService.error('Erro ao carregar créditos: ' + message);
      }
    });
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.carregarCreditos();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages - 1, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  verComprovante(comprovanteUrl: string): void {
    if (comprovanteUrl) {
      window.open(comprovanteUrl, '_blank');
    } else {
      this.toastService.warning('Comprovante não disponível');
    }
  }

  voltar(): void {
    this.router.navigate(['/solicitacao-credito']);
  }

  formatarData(data: string | undefined): string {
    if (!data) return '-';
    try {
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  }

  formatarValor(valor: number | undefined): string {
    if (valor === undefined || valor === null) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }
}

