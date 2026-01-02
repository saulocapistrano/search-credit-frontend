import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { CreditoService } from '../../core/services/credito.service';
import { CreditoCacheService } from '../../core/services/credito-cache.service';
import { CreditoStatusService } from '../../core/services/credito-status.service';
import { CreditoDetalhadoDto } from '../../core/models/credito-detalhado.dto';
import { CreditoResponseDto } from '../../core/models/credito-response.dto';

@Component({
  selector: 'app-consulta-credito',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './consulta-credito.component.html',
  styleUrl: './consulta-credito.component.scss'
})
export class ConsultaCreditoComponent {
  private readonly creditoService = inject(CreditoService);
  private readonly creditoCacheService = inject(CreditoCacheService);
  readonly creditoStatusService = inject(CreditoStatusService);
  private readonly formBuilder = inject(FormBuilder);

  consultaForm: FormGroup;
  credito: CreditoDetalhadoDto | null = null;
  isLoading = false;
  errorMessage: string | null = null;
  mostrarDetalhes = false;

  constructor() {
    this.consultaForm = this.criarFormulario();
  }

  private criarFormulario(): FormGroup {
    return this.formBuilder.group({
      numeroCredito: [{ value: '', disabled: false }, [Validators.required, Validators.minLength(1)]]
    });
  }

  private atualizarEstadoFormulario(): void {
    const control = this.consultaForm.get('numeroCredito');
    if (control) {
      if (this.isLoading) {
        control.disable();
      } else {
        control.enable();
      }
    }
  }

  buscar(): void {
    const numeroCredito = this.consultaForm.get('numeroCredito')?.value?.trim();

    if (!numeroCredito || numeroCredito === '') {
      this.errorMessage = 'Informe um número de crédito válido.';
      this.marcarCamposComoTocados();
      return;
    }

    if (this.consultaForm.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    this.realizarBusca(numeroCredito);
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.consultaForm.controls).forEach(key => {
      this.consultaForm.get(key)?.markAsTouched();
    });
  }

  private realizarBusca(numeroCredito: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.credito = null;
    this.mostrarDetalhes = false;
    this.atualizarEstadoFormulario();

    this.creditoService.buscarPorNumeroCredito(numeroCredito).subscribe({
      next: (resultado) => {
        this.isLoading = false;
        this.credito = resultado;
        this.mostrarDetalhes = true;
        // Converter CreditoDetalhadoDto para CreditoResponseDto e armazenar no cache
        const creditoResponse: CreditoResponseDto = {
          id: resultado.numeroCredito ? parseInt(resultado.numeroCredito) || 0 : 0,
          numeroCredito: resultado.numeroCredito,
          numeroNfse: resultado.numeroNfse,
          valor: resultado.valor || 0,
          dataEmissao: resultado.dataEmissao || '',
          status: resultado.status || '',
          dataConstituicao: resultado.dataConstituicao,
          valorIssqn: resultado.valorIssqn,
          tipoCredito: resultado.tipoCredito,
          simplesNacional: typeof resultado.simplesNacional === 'boolean' ? resultado.simplesNacional : undefined,
          aliquota: resultado.aliquota,
          valorFaturado: resultado.valorFaturado,
          valorDeducao: resultado.valorDeducao,
          baseCalculo: resultado.baseCalculo
        };
        this.creditoCacheService.adicionarCredito(creditoResponse);
        this.atualizarEstadoFormulario();
      },
      error: (error: HttpErrorResponse | Error) => {
        this.isLoading = false;
        this.atualizarEstadoFormulario();

        if (error instanceof HttpErrorResponse) {
          if (error.status === 404) {
            this.errorMessage = 'Crédito não encontrado para o número informado.';
          } else if (error.status === 500) {
            this.errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
          } else if (error.status) {
            this.errorMessage = `Ocorreu um erro inesperado. Código: ${error.status}`;
          } else {
            this.errorMessage = error.error?.message || 'Erro ao buscar crédito';
          }
        } else {
          if (error.message) {
            this.errorMessage = error.message
              .replace(/solicita(ç|c)[aã]o de cr(é|e)dito/gi, 'crédito');
          } else {
            this.errorMessage = 'Erro ao buscar crédito';
          }
        }

        this.credito = null;
        this.mostrarDetalhes = false;
      }
    });
  }

  limpar(): void {
    this.consultaForm.reset();
    this.credito = null;
    this.errorMessage = null;
    this.mostrarDetalhes = false;
    this.isLoading = false;
    this.atualizarEstadoFormulario();
  }

  fecharDetalhes(): void {
    this.mostrarDetalhes = false;
  }

  temErro(campo: string): boolean {
    const control = this.consultaForm.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  getMensagemErro(campo: string): string | null {
    const control = this.consultaForm.get(campo);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        return 'Número do crédito é obrigatório';
      }
      if (control.errors['minlength']) {
        return 'Número do crédito deve ter pelo menos 1 caractere';
      }
    }
    return null;
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
