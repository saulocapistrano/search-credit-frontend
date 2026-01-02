import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CreditoService } from '../../core/services/credito.service';
import { CreditoCacheService } from '../../core/services/credito-cache.service';
import { CreditoStatusService } from '../../core/services/credito-status.service';
import { CreditoResponseDto } from '../../core/models/credito-response.dto';

@Component({
  selector: 'app-consulta-nfse',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './consulta-nfse.component.html',
  styleUrl: './consulta-nfse.component.scss'
})
export class ConsultaNfseComponent {
  private readonly creditoService = inject(CreditoService);
  private readonly creditoCacheService = inject(CreditoCacheService);
  readonly creditoStatusService = inject(CreditoStatusService);
  private readonly formBuilder = inject(FormBuilder);

  consultaForm: FormGroup;
  creditos: CreditoResponseDto[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  hasSearched = false;
  creditoSelecionado: CreditoResponseDto | null = null;
  mostrarDetalhes = false;

  constructor() {
    this.consultaForm = this.criarFormulario();
  }

  private criarFormulario(): FormGroup {
    return this.formBuilder.group({
      numeroNfse: [{ value: '', disabled: false }, [Validators.required, Validators.minLength(1)]]
    });
  }

  private atualizarEstadoFormulario(): void {
    const control = this.consultaForm.get('numeroNfse');
    if (control) {
      if (this.isLoading) {
        control.disable();
      } else {
        control.enable();
      }
    }
  }

  buscar(): void {
    if (this.consultaForm.invalid) {
      this.marcarCamposComoTocados();
      return;
    }

    const numeroNfse = this.consultaForm.get('numeroNfse')?.value;
    this.realizarBusca(numeroNfse);
  }

  private marcarCamposComoTocados(): void {
    Object.keys(this.consultaForm.controls).forEach(key => {
      this.consultaForm.get(key)?.markAsTouched();
    });
  }

  private realizarBusca(numeroNfse: string): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.creditos = [];
    this.hasSearched = true;
    this.atualizarEstadoFormulario();

    this.creditoService.buscarPorNumeroNfse(numeroNfse).subscribe({
      next: (resultado) => {
        this.isLoading = false;
        this.creditos = resultado;
        // Armazenar créditos no cache
        this.creditoCacheService.adicionarCreditos(resultado);
        this.atualizarEstadoFormulario();
        if (resultado.length === 0) {
          this.errorMessage = 'Nenhum crédito encontrado para o número de NFSe informado';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Erro ao buscar créditos';
        this.creditos = [];
        this.atualizarEstadoFormulario();
      }
    });
  }

  limpar(): void {
    this.consultaForm.reset();
    this.creditos = [];
    this.errorMessage = null;
    this.hasSearched = false;
    this.creditoSelecionado = null;
    this.mostrarDetalhes = false;
    this.isLoading = false;
    this.atualizarEstadoFormulario();
  }

  exibirDetalhes(credito: CreditoResponseDto): void {
    console.log('Crédito selecionado:', credito);
    this.creditoSelecionado = credito;
    this.mostrarDetalhes = true;
  }

  fecharDetalhes(): void {
    this.mostrarDetalhes = false;
    this.creditoSelecionado = null;
  }

  isCreditoSelecionado(credito: CreditoResponseDto): boolean {
    return this.creditoSelecionado?.id === credito.id;
  }

  formatarSimplesNacional(valor: boolean | undefined): string {
    if (valor === undefined || valor === null) {
      return 'Não informado';
    }
    return valor ? 'Sim' : 'Não';
  }

  formatarPercentual(valor: number | undefined): string {
    if (valor === undefined || valor === null) {
      return 'Não informado';
    }
    return `${valor}%`;
  }

  temErro(campo: string): boolean {
    const control = this.consultaForm.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  getMensagemErro(campo: string): string | null {
    const control = this.consultaForm.get(campo);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        return 'Número da NFSe é obrigatório';
      }
      if (control.errors['minlength']) {
        return 'Número da NFSe deve ter pelo menos 1 caractere';
      }
    }
    return null;
  }

}
