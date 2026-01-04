import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CreditoService, PageResponse } from '../../core/services/credito.service';
import { CreditoStatusService } from '../../core/services/credito-status.service';
import { UserRoleService } from '../../core/services/user-role.service';
import { ToastService } from '../../core/services/toast.service';
import { CreditoResponseDto } from '../../core/models/credito-response.dto';
import { CreditoDetalhadoDto } from '../../core/models/credito-detalhado.dto';

@Component({
  selector: 'app-lista-geral-creditos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lista-geral-creditos.component.html',
  styleUrl: './lista-geral-creditos.component.scss'
})
export class ListaGeralCreditosComponent implements OnInit, OnDestroy {
  private readonly creditoService = inject(CreditoService);
  readonly creditoStatusService = inject(CreditoStatusService);
  private readonly userRoleService = inject(UserRoleService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  creditos: CreditoResponseDto[] = [];
  canAccess = false;

  paginaAtual = 0;
  pageSize = 20;
  totalRegistros = 0;
  totalPaginas = 0;

  sortBy = 'dataConstituicao';
  sortDir = 'DESC';

  creditoSelecionado: CreditoDetalhadoDto | null = null;
  mostrarDetalhes = false;
  isLoadingDetalhes = false;
  isLoadingLista = false;

  ngOnInit(): void {
    const role = this.userRoleService.getRole();
    this.canAccess = role === 'admin-full';

    if (!this.canAccess) {
      this.router.navigate(['/consulta-nfse']);
      return;
    }

    this.carregarCreditos(0);
  }

  ngOnDestroy(): void {
    return;
  }

  private carregarCreditos(page: number): void {
    this.isLoadingLista = true;

    this.creditoService.buscarCreditosPaginados(page, this.pageSize, this.sortBy, this.sortDir).subscribe({
      next: (response: PageResponse<CreditoResponseDto>) => {
        this.creditos = response.content;
        this.totalRegistros = response.totalElements;
        this.totalPaginas = response.totalPages;
        this.paginaAtual = response.number;
        this.isLoadingLista = false;
      },
      error: (error: unknown) => {
        this.isLoadingLista = false;
        const message = error instanceof Error ? error.message : 'Erro ao carregar créditos';
        this.toastService.error(message);
      }
    });
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPaginas) {
      this.carregarCreditos(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortDir = this.sortDir === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortBy = field;
      this.sortDir = 'DESC';
    }
    this.carregarCreditos(0);
  }

  formatarData(data: string | undefined): string {
    if (!data) return '-';
    try {
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
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

  getSortIcon(field: string): string {
    if (this.sortBy !== field) {
      return 'fa-sort';
    }
    return this.sortDir === 'ASC' ? 'fa-sort-up' : 'fa-sort-down';
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(0, this.paginaAtual - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPaginas - 1, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  exibirDetalhes(credito: CreditoResponseDto): void {
    if (!credito.numeroCredito) {
      this.toastService.warning('Número do crédito não disponível');
      return;
    }

    this.isLoadingDetalhes = true;
    this.mostrarDetalhes = false;
    this.creditoSelecionado = null;

    this.creditoService.buscarPorNumeroCredito(credito.numeroCredito).subscribe({
      next: (resultado: CreditoDetalhadoDto) => {
        this.isLoadingDetalhes = false;
        this.creditoSelecionado = resultado;
        this.mostrarDetalhes = true;
      },
      error: (error: HttpErrorResponse | Error) => {
        this.isLoadingDetalhes = false;

        if (error instanceof HttpErrorResponse) {
          if (error.status === 404) {
            this.toastService.error('Crédito não encontrado para o número informado.');
          } else if (error.status === 500) {
            this.toastService.error('Erro interno do servidor. Tente novamente mais tarde.');
          } else {
            this.toastService.error(error.error?.message || 'Erro ao buscar detalhes do crédito');
          }
        } else {
          this.toastService.error(error.message || 'Erro ao buscar detalhes do crédito');
        }
      }
    });
  }

  fecharDetalhes(): void {
    this.mostrarDetalhes = false;
    this.creditoSelecionado = null;
  }

  formatarSimplesNacional(valor: string | boolean | undefined): string {
    if (valor === undefined || valor === null) {
      return 'Não informado';
    }
    if (typeof valor === 'boolean') {
      return valor ? 'Sim' : 'Não';
    }
    if (typeof valor === 'string') {
      return valor.toLowerCase() === 'true' || valor.toLowerCase() === 'sim' ? 'Sim' : 'Não';
    }
    return 'Não informado';
  }

  formatarPercentual(valor: number | undefined): string {
    if (valor === undefined || valor === null) {
      return 'Não informado';
    }
    return `${valor}%`;
  }
}

