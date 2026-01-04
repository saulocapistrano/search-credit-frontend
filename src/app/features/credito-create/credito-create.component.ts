import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CreditoAdminResponseDto, CreditoService } from '../../core/services/credito.service';
import { PadroesService } from '../../core/services/padroes.service';
import { UserRoleService } from '../../core/services/user-role.service';
import { ToastService } from '../../core/services/toast.service';

import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const DEDUCAO_PERCENTUAL = 0.15; // 15%
const MAX_SIZE_MB = 5;

@Component({
  selector: 'app-credito-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './credito-create.component.html',
  styleUrl: './credito-create.component.scss'
})
export class CreditoCreateComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly creditoService = inject(CreditoService);
  private readonly padroesService = inject(PadroesService);
  private readonly userRoleService = inject(UserRoleService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  creditoForm!: FormGroup;
  comprovanteFile: File | null = null;
  fileName: string = '';
  isLoading = false;
  canAccess = false;

  // Opções dos selects
  valorIssqnOptions: number[] = [];
  tipoCreditoOptions: string[] = [];
  aliquotaOptions: number[] = [];
  baseCalculoOptions: number[] = [];

  ngOnInit(): void {
    // Verificar se o usuário tem acesso
    const role = this.userRoleService.getRole();
    this.canAccess = role === 'admin-solicitacao' || role === 'admin-full';

    if (!this.canAccess) {
      this.router.navigate(['/consulta-nfse']);
      return;
    }

    // Carregar opções dos selects
    this.valorIssqnOptions = this.padroesService.getValorIssqn();
    this.tipoCreditoOptions = this.padroesService.getTiposCredito();
    this.aliquotaOptions = this.padroesService.getAliquotas();
    this.baseCalculoOptions = this.padroesService.getBaseCalculo();

    // Criar formulário
    this.creditoForm = this.criarFormulario();

    // Buscar números em paralelo (somente exibição)
    this.carregarNumeros();
  }

  private criarFormulario(): FormGroup {
    const hoje = new Date();
    const dataFormatada = hoje.toISOString().split('T')[0];

    const form = this.formBuilder.group({
      numeroCredito: [''],
      numeroNfse: [''],
      dataConstituicao: [dataFormatada, [Validators.required]],
      valorIssqn: ['', [Validators.required]],
      tipoCredito: ['ISSQN', [Validators.required]],
      simplesNacional: ['Sim', [Validators.required]],
      aliquota: ['', [Validators.required]],
      valorFaturado: ['', [Validators.required, Validators.min(0)]],
      valorDeducao: [{ value: '', disabled: true }, [Validators.required]],
      baseCalculo: ['', [Validators.required]],
      nomeSolicitante: ['', [Validators.required, Validators.minLength(3)]]
    });

    // Escutar mudanças no valorFaturado para calcular valorDeducao
    form.get('valorFaturado')?.valueChanges.subscribe(valor => {
      if (valor && !isNaN(parseFloat(valor))) {
        const deducao = parseFloat(valor) * DEDUCAO_PERCENTUAL;
        form.patchValue({ valorDeducao: deducao.toFixed(2) }, { emitEvent: false });
      } else {
        form.patchValue({ valorDeducao: '' }, { emitEvent: false });
      }
    });

    return form;
  }

  private carregarNumeros(): void {
    forkJoin({
      numeroCredito: this.creditoService.getNextNumeroCredito(),
      numeroNfse: this.creditoService.getNextNumeroNfse()
    }).subscribe({
      next: ({ numeroCredito, numeroNfse }) => {
        this.creditoForm.patchValue({
          numeroCredito: this.normalizeNumero(numeroCredito),
          numeroNfse: this.normalizeNumero(numeroNfse)
        });
      },
      error: () => {
        // Não bloquear o submit caso falhe (apenas UX)
      }
    });
  }

  private normalizeNumero(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return '';
    }

    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed) as Record<string, unknown>;
        const candidate = parsed?.['value'] ?? parsed?.['numeroCredito'] ?? parsed?.['numeroNfse'];
        return typeof candidate === 'string' ? candidate : '';
      } catch {
        return trimmed;
      }
    }

    return trimmed;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validar tipo de arquivo
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        this.toastService.error('Tipo de arquivo não permitido. Use PDF, JPG ou PNG');
        this.comprovanteFile = null;
        this.fileName = '';
        input.value = '';
        return;
      }

      // Validar tamanho do arquivo
      if (file.size > MAX_FILE_SIZE) {
        this.toastService.error('Comprovante excede 5MB');
        this.comprovanteFile = null;
        this.fileName = '';
        input.value = '';
        return;
      }

      this.comprovanteFile = file;
      this.fileName = file.name;
    } else {
      this.comprovanteFile = null;
      this.fileName = '';
    }
  }

  onSubmit(): void {
    if (this.creditoForm.invalid) {
      this.markFormGroupTouched(this.creditoForm);
      this.toastService.error('Por favor, preencha todos os campos corretamente');
      return;
    }

    if (this.comprovanteFile && this.comprovanteFile.size > MAX_SIZE_MB * 1024 * 1024) {
      this.toastService.error('Comprovante excede 5MB');
      return;
    }

    this.isLoading = true;

    const raw = this.creditoForm.getRawValue();
    const simplesNacional = raw.simplesNacional === 'Sim' || raw.simplesNacional === 'true';

    const creditoPayload = {
      numeroCredito: null,
      numeroNfse: null,
      dataConstituicao: raw.dataConstituicao,
      tipoCredito: raw.tipoCredito,
      simplesNacional,
      aliquota: Number(raw.aliquota),
      valorFaturado: Number(raw.valorFaturado),
      valorIssqn: Number(raw.valorIssqn),
      valorDeducao: Number(raw.valorDeducao),
      baseCalculo: Number(raw.baseCalculo),
      solicitadoPor: raw.nomeSolicitante
    };

    const formData = new FormData();

    formData.append(
      'credito',
      new Blob([JSON.stringify(creditoPayload)], {
        type: 'application/json'
      })
    );

    if (this.comprovanteFile) {
      formData.append('comprovante', this.comprovanteFile);
    }

    this.creditoService.criarCredito(formData).subscribe({
      next: (_response: CreditoAdminResponseDto) => {
        this.isLoading = false;
        this.toastService.success('Cadastro realizado com sucesso!');

        const role = this.userRoleService.getRole();
        if (role === 'admin-full') {
          this.router.navigate(['/lista-geral-creditos']);
        } else {
          this.router.navigate(['/meus-creditos']);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;

        if (error.status === 413) {
          this.toastService.error('Arquivo muito grande. Máx: 5MB');
          return;
        }

        this.toastService.error(error.error?.message ?? 'Erro ao criar crédito');
      }
    });
  }

  resetForm(): void {
    this.creditoForm.reset({
      tipoCredito: 'ISSQN',
      simplesNacional: 'Sim',
      dataConstituicao: new Date().toISOString().split('T')[0]
    });
    this.comprovanteFile = null;
    this.fileName = '';

    this.carregarNumeros();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.creditoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.creditoForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return 'Campo obrigatório';
      }
      if (field.errors['minlength']) {
        return `Mínimo de ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['min']) {
        return `Valor mínimo: ${field.errors['min'].min}`;
      }
      if (field.errors['max']) {
        return `Valor máximo: ${field.errors['max'].max}`;
      }
    }
    return '';
  }
}

