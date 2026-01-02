import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { CreditoService } from '../../core/services/credito.service';
import { CreditoCacheService } from '../../core/services/credito-cache.service';
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
  private readonly creditoCacheService = inject(CreditoCacheService);
  readonly creditoStatusService = inject(CreditoStatusService);
  private readonly userRoleService = inject(UserRoleService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private cacheSubscription?: Subscription;

  creditos: CreditoResponseDto[] = [];
  creditosFiltrados: CreditoResponseDto[] = [];
  termoBusca = '';
  canAccess = false;

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  sortBy = 'dataEmissao';
  sortDir: 'asc' | 'desc' = 'desc';

  creditoSelecionado: CreditoDetalhadoDto | null = null;
  mostrarDetalhes = false;
  isLoadingDetalhes = false;

  ngOnInit(): void {
    const role = this.userRoleService.getRole();
    this.canAccess = role === 'admin-full';

    if (!this.canAccess) {
      this.router.navigate(['/consulta-nfse']);
      return;
    }

    // Carregar créditos do cache
    this.carregarCreditosDoCache();

    // Escutar mudanças no cache
    this.cacheSubscription = this.creditoCacheService.creditos$.subscribe(() => {
      this.carregarCreditosDoCache();
    });
  }

  ngOnDestroy(): void {
    this.cacheSubscription?.unsubscribe();
  }

  carregarCreditosDoCache(): void {
    this.creditos = this.creditoCacheService.obterTodosCreditos();
    this.aplicarFiltroEBusca();
  }

  onBuscaChange(termo: string): void {
    this.termoBusca = termo;
    this.currentPage = 0;
    this.aplicarFiltroEBusca();
  }

  aplicarFiltroEBusca(): void {
    let resultado = [...this.creditos];

    // Aplicar filtro de busca
    if (this.termoBusca && this.termoBusca.trim() !== '') {
      const termoLower = this.termoBusca.toLowerCase().trim();
      resultado = resultado.filter(credito => {
        const numeroCredito = credito.numeroCredito?.toLowerCase() || '';
        const numeroNfse = credito.numeroNfse?.toLowerCase() || '';
        const tipoCredito = credito.tipoCredito?.toLowerCase() || '';
        const status = credito.status?.toLowerCase() || '';
        const valorIssqn = credito.valorIssqn?.toString() || '';

        return numeroCredito.includes(termoLower) ||
               numeroNfse.includes(termoLower) ||
               tipoCredito.includes(termoLower) ||
               status.includes(termoLower) ||
               valorIssqn.includes(termoLower);
      });
    }

    // Aplicar ordenação
    resultado = this.ordenarCreditos(resultado);

    // Atualizar totais
    this.totalElements = resultado.length;
    this.totalPages = Math.ceil(this.totalElements / this.pageSize);

    // Aplicar paginação
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.creditosFiltrados = resultado.slice(startIndex, endIndex);
  }

  ordenarCreditos(creditos: CreditoResponseDto[]): CreditoResponseDto[] {
    return [...creditos].sort((a, b) => {
      let valorA: any;
      let valorB: any;

      switch (this.sortBy) {
        case 'numeroCredito':
          valorA = a.numeroCredito || '';
          valorB = b.numeroCredito || '';
          break;
        case 'numeroNfse':
          valorA = a.numeroNfse || '';
          valorB = b.numeroNfse || '';
          break;
        case 'tipoCredito':
          valorA = a.tipoCredito || '';
          valorB = b.tipoCredito || '';
          break;
        case 'valorIssqn':
          valorA = a.valorIssqn || 0;
          valorB = b.valorIssqn || 0;
          break;
        case 'dataConstituicao':
          valorA = a.dataConstituicao ? new Date(a.dataConstituicao).getTime() : 0;
          valorB = b.dataConstituicao ? new Date(b.dataConstituicao).getTime() : 0;
          break;
        case 'status':
          valorA = a.status || '';
          valorB = b.status || '';
          break;
        case 'dataEmissao':
        default:
          valorA = a.dataEmissao ? new Date(a.dataEmissao).getTime() : 0;
          valorB = b.dataEmissao ? new Date(b.dataEmissao).getTime() : 0;
          break;
      }

      if (typeof valorA === 'string' && typeof valorB === 'string') {
        return this.sortDir === 'asc'
          ? valorA.localeCompare(valorB)
          : valorB.localeCompare(valorA);
      } else {
        return this.sortDir === 'asc'
          ? valorA - valorB
          : valorB - valorA;
      }
    });
  }

  onPageChange(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.aplicarFiltroEBusca();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDir = 'desc';
    }
    this.currentPage = 0;
    this.aplicarFiltroEBusca();
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
    return this.sortDir === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
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

  exibirDetalhes(credito: CreditoResponseDto): void {
    if (!credito.numeroCredito) {
      this.toastService.warning('Número do crédito não disponível');
      return;
    }

    this.isLoadingDetalhes = true;
    this.mostrarDetalhes = false;
    this.creditoSelecionado = null;

    this.creditoService.buscarPorNumeroCredito(credito.numeroCredito).subscribe({
      next: (resultado) => {
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

