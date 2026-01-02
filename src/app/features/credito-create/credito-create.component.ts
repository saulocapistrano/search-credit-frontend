import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CreditoWorkflowService } from '../../core/services/credito-workflow.service';
import { ComprovanteService } from '../../core/services/comprovante.service';
import { PadroesService } from '../../core/services/padroes.service';
import { UserRoleService } from '../../core/services/user-role.service';
import { ToastService } from '../../core/services/toast.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const DEDUCAO_PERCENTUAL = 0.15; // 15%

@Component({
  selector: 'app-credito-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './credito-create.component.html',
  styleUrl: './credito-create.component.scss'
})
export class CreditoCreateComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly creditoWorkflowService = inject(CreditoWorkflowService);
  private readonly comprovanteService = inject(ComprovanteService);
  private readonly padroesService = inject(PadroesService);
  private readonly userRoleService = inject(UserRoleService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  creditoForm!: FormGroup;
  comprovanteFile: File | null = null;
  fileName: string = '';
  isLoading = false;
  isLoadingNumbers = false;
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

    // Carregar números sequenciais e data atual
    this.carregarDadosIniciais();
  }

  private criarFormulario(): FormGroup {
    const hoje = new Date();
    const dataFormatada = hoje.toISOString().split('T')[0];

    const form = this.formBuilder.group({
      numeroCredito: [{ value: '', disabled: true }, [Validators.required]],
      numeroNfse: [{ value: '', disabled: true }, [Validators.required]],
      dataConstituicao: [dataFormatada, [Validators.required]],
      valorIssqn: ['', [Validators.required]],
      tipoCredito: ['ISSQN', [Validators.required]],
      simplesNacional: ['Sim', [Validators.required]],
      aliquota: ['', [Validators.required]],
      valorFaturado: ['', [Validators.required, Validators.min(0)]],
      valorDeducao: [{ value: '', disabled: true }, [Validators.required]],
      baseCalculo: ['', [Validators.required]],
      nomeSolicitante: ['', [Validators.required, Validators.minLength(3)]],
      comprovanteRenda: [null, [Validators.required]]
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

  private carregarDadosIniciais(): void {
    this.isLoadingNumbers = true;

    forkJoin({
      numeroCredito: this.creditoWorkflowService.getNextNumeroCredito(),
      numeroNfse: this.creditoWorkflowService.getNextNumeroNfse()
    }).subscribe({
      next: (response) => {
        this.creditoForm.patchValue({
          numeroCredito: response.numeroCredito,
          numeroNfse: response.numeroNfse
        });
        this.isLoadingNumbers = false;
      },
      error: (error) => {
        this.isLoadingNumbers = false;
        this.toastService.error('Erro ao carregar números sequenciais: ' + (error.message || 'Erro desconhecido'));
      }
    });
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
        this.creditoForm.patchValue({ comprovanteRenda: null });
        input.value = '';
        return;
      }

      // Validar tamanho do arquivo
      if (file.size > MAX_FILE_SIZE) {
        this.toastService.error(`Arquivo muito grande. Tamanho máximo: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
        this.comprovanteFile = null;
        this.fileName = '';
        this.creditoForm.patchValue({ comprovanteRenda: null });
        input.value = '';
        return;
      }

      this.comprovanteFile = file;
      this.fileName = file.name;
      this.creditoForm.patchValue({ comprovanteRenda: file });
    }
  }

  onSubmit(): void {
    if (this.creditoForm.invalid || !this.comprovanteFile) {
      this.markFormGroupTouched(this.creditoForm);
      this.toastService.error('Por favor, preencha todos os campos corretamente e selecione o comprovante de renda');
      return;
    }

    this.isLoading = true;

    const formValue = this.creditoForm.getRawValue();
    const simplesNacional = formValue.simplesNacional === 'Sim' || formValue.simplesNacional === 'true';

    const dados = {
      numeroCredito: formValue.numeroCredito,
      numeroNfse: formValue.numeroNfse,
      dataConstituicao: formValue.dataConstituicao,
      valorIssqn: parseFloat(formValue.valorIssqn),
      tipoCredito: formValue.tipoCredito,
      simplesNacional: simplesNacional,
      aliquota: parseFloat(formValue.aliquota),
      valorFaturado: parseFloat(formValue.valorFaturado),
      valorDeducao: parseFloat(formValue.valorDeducao),
      baseCalculo: parseFloat(formValue.baseCalculo),
      nomeSolicitante: formValue.nomeSolicitante
    };

    this.creditoWorkflowService.criarCredito(dados, this.comprovanteFile).subscribe({
      next: (response) => {
        this.isLoading = false;
        localStorage.setItem('nome-solicitante', dados.nomeSolicitante);
        this.toastService.success('Crédito criado com sucesso! Status: EM_ANALISE');
        this.resetForm();
      },
      error: (error) => {
        this.isLoading = false;
        this.toastService.error(error.message || 'Erro ao criar crédito. Tente novamente.');
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
    
    // Recarregar números sequenciais
    this.carregarDadosIniciais();
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

