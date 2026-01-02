import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CreditoWorkflowService } from '../../core/services/credito-workflow.service';
import { UserRoleService } from '../../core/services/user-role.service';
import { ToastService } from '../../core/services/toast.service';
import { CreditoWorkflowResponseDto } from '../../core/models/credito-workflow.dto';
import { AnaliseCreditoDto } from '../../core/models/analise-credito.dto';

@Component({
  selector: 'app-lista-geral-creditos-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './lista-geral-creditos-admin.component.html',
  styleUrl: './lista-geral-creditos-admin.component.scss'
})
export class ListaGeralCreditosAdminComponent implements OnInit {
  private readonly creditoWorkflowService = inject(CreditoWorkflowService);
  private readonly userRoleService = inject(UserRoleService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  creditos: CreditoWorkflowResponseDto[] = [];
  isLoading = false;
  canAccess = false;

  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  sortBy = 'dataSolicitacao';
  sortDir = 'desc';

  showAnaliseModal = false;
  creditoSelecionado: CreditoWorkflowResponseDto | null = null;
  analiseForm!: FormGroup;
  isSubmittingAnalise = false;

  ngOnInit(): void {
    const role = this.userRoleService.getRole();
    this.canAccess = role === 'admin-full';

    if (!this.canAccess) {
      this.router.navigate(['/consulta-nfse']);
      return;
    }

    this.analiseForm = this.formBuilder.group({
      decisao: ['', [Validators.required]],
      comentario: ['']
    });

    this.carregarCreditos();
  }

  carregarCreditos(): void {
    this.isLoading = true;

    this.creditoWorkflowService.buscarTodasSolicitacoes(this.currentPage, this.pageSize, this.sortBy, this.sortDir).subscribe({
      next: (response) => {
        this.creditos = response.content || [];
        this.totalElements = response.totalElements || 0;
        this.totalPages = response.totalPages || 0;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error('Erro ao carregar créditos: ' + (error.message || 'Erro desconhecido'));
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

  onSort(field: string): void {
    if (this.sortBy === field) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDir = 'desc';
    }
    this.currentPage = 0;
    this.carregarCreditos();
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'EM_ANALISE':
        return 'bg-info';
      case 'APROVADO':
        return 'bg-success';
      case 'REPROVADO':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }

  getStatusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'EM_ANALISE':
        return 'Em Análise';
      case 'APROVADO':
        return 'Aprovado';
      case 'REPROVADO':
        return 'Reprovado';
      default:
        return status || 'Desconhecido';
    }
  }

  verComprovante(comprovanteUrl: string): void {
    if (comprovanteUrl) {
      window.open(comprovanteUrl, '_blank');
    } else {
      this.toastService.warning('Comprovante não disponível');
    }
  }

  formatarData(data: string | undefined): string {
    if (!data) return '-';
    try {
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
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

  abrirModalAnalise(credito: CreditoWorkflowResponseDto): void {
    this.creditoSelecionado = credito;
    this.analiseForm.reset({
      decisao: '',
      comentario: ''
    });
    this.showAnaliseModal = true;
  }

  fecharModalAnalise(): void {
    this.showAnaliseModal = false;
    this.creditoSelecionado = null;
    this.analiseForm.reset();
  }

  onSubmitAnalise(): void {
    if (this.analiseForm.invalid || !this.creditoSelecionado) {
      this.analiseForm.markAllAsTouched();
      return;
    }

    this.isSubmittingAnalise = true;
    const formValue = this.analiseForm.value;

    if (!this.creditoSelecionado.id) {
      this.toastService.error('ID do crédito não encontrado');
      this.isSubmittingAnalise = false;
      return;
    }

    const analise: AnaliseCreditoDto = {
      status: formValue.decisao,
      comentario: formValue.comentario || undefined
    };

    this.creditoWorkflowService.analisarSolicitacao(this.creditoSelecionado.id, analise).subscribe({
      next: () => {
        this.isSubmittingAnalise = false;
        const statusLabel = analise.status === 'APROVADO' ? 'aprovado' : 'reprovado';
        this.toastService.success(`Crédito ${statusLabel} com sucesso!`);

        if (this.creditoSelecionado?.id) {
          const index = this.creditos.findIndex(c => c.id === this.creditoSelecionado?.id);
          if (index !== -1) {
            this.creditos[index].status = analise.status;
          }
        }

        this.carregarCreditos();
        this.fecharModalAnalise();
      },
      error: (error) => {
        this.isSubmittingAnalise = false;
        this.toastService.error(error.message || 'Erro ao analisar crédito. Tente novamente.');
      }
    });
  }

  isEmAnalise(status: string | undefined): boolean {
    return status?.toUpperCase() === 'EM_ANALISE';
  }
}

