import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ConsultaNfseComponent } from './consulta-nfse.component';
import { CreditoService } from '../../core/services/credito.service';
import { CreditoResponseDto } from '../../core/models/credito-response.dto';

describe('ConsultaNfseComponent', () => {
  let component: ConsultaNfseComponent;
  let fixture: ComponentFixture<ConsultaNfseComponent>;
  let httpMock: HttpTestingController;
  let creditoService: CreditoService;

  const mockCreditos: CreditoResponseDto[] = [
    {
      id: 1,
      numeroCredito: '123456',
      numeroNfse: '7891011',
      valor: 1500.75,
      dataEmissao: '2024-02-25',
      status: 'Ativo',
      tipoCredito: 'ISSQN',
      valorFaturado: 30000,
      baseCalculo: 25000,
      aliquota: 5
    },
    {
      id: 2,
      numeroCredito: '789012',
      numeroNfse: '7891011',
      valor: 2000.50,
      dataEmissao: '2024-02-26',
      status: 'Pendente',
      tipoCredito: 'ISSQN'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ConsultaNfseComponent,
        HttpClientTestingModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultaNfseComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    creditoService = TestBed.inject(CreditoService);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with empty values', () => {
    expect(component.consultaForm).toBeDefined();
    expect(component.consultaForm.get('numeroNfse')?.value).toBe('');
    expect(component.consultaForm.get('numeroNfse')?.invalid).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.creditos).toEqual([]);
    expect(component.isLoading).toBeFalse();
    expect(component.errorMessage).toBeNull();
    expect(component.hasSearched).toBeFalse();
    expect(component.creditoSelecionado).toBeNull();
    expect(component.mostrarDetalhes).toBeFalse();
  });

  describe('buscar()', () => {
    it('should not call service if form is invalid', () => {
      component.consultaForm.get('numeroNfse')?.setValue('');
      component.buscar();

      httpMock.expectNone('/api/creditos/');
      expect(component.hasSearched).toBeFalse();
    });

    it('should call service and set loading state when form is valid', () => {
      const numeroNfse = '7891011';
      component.consultaForm.get('numeroNfse')?.setValue(numeroNfse);

      component.buscar();

      expect(component.isLoading).toBeTrue();
      expect(component.hasSearched).toBeTrue();

      const req = httpMock.expectOne(`/api/creditos/${encodeURIComponent(numeroNfse)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCreditos);
    });

    it('should handle successful search with results', () => {
      const numeroNfse = '7891011';
      component.consultaForm.get('numeroNfse')?.setValue(numeroNfse);

      component.buscar();

      const req = httpMock.expectOne(`/api/creditos/${encodeURIComponent(numeroNfse)}`);
      req.flush(mockCreditos);

      expect(component.isLoading).toBeFalse();
      expect(component.creditos).toEqual(mockCreditos);
      expect(component.errorMessage).toBeNull();
    });

    it('should handle successful search with empty results', () => {
      const numeroNfse = '7891011';
      component.consultaForm.get('numeroNfse')?.setValue(numeroNfse);

      component.buscar();

      const req = httpMock.expectOne(`/api/creditos/${encodeURIComponent(numeroNfse)}`);
      req.flush([]);

      expect(component.isLoading).toBeFalse();
      expect(component.creditos).toEqual([]);
      expect(component.errorMessage).toBe('Nenhum crédito encontrado para o número de NFSe informado');
    });

    it('should handle error response', () => {
      const numeroNfse = '7891011';
      component.consultaForm.get('numeroNfse')?.setValue(numeroNfse);

      component.buscar();

      const req = httpMock.expectOne(`/api/creditos/${encodeURIComponent(numeroNfse)}`);
      req.error(new ErrorEvent('Network error'), { status: 500 });

      expect(component.isLoading).toBeFalse();
      expect(component.creditos).toEqual([]);
      expect(component.errorMessage).toBeTruthy();
    });

    it('should mark form fields as touched when invalid', () => {
      component.consultaForm.get('numeroNfse')?.setValue('');
      component.buscar();

      expect(component.consultaForm.get('numeroNfse')?.touched).toBeTrue();
    });
  });

  describe('exibirDetalhes()', () => {
    it('should set creditoSelecionado and mostrarDetalhes to true', () => {
      const credito = mockCreditos[0];

      component.exibirDetalhes(credito);

      expect(component.creditoSelecionado).toEqual(credito);
      expect(component.mostrarDetalhes).toBeTrue();
    });
  });

  describe('fecharDetalhes()', () => {
    it('should reset mostrarDetalhes and creditoSelecionado', () => {
      component.creditoSelecionado = mockCreditos[0];
      component.mostrarDetalhes = true;

      component.fecharDetalhes();

      expect(component.mostrarDetalhes).toBeFalse();
      expect(component.creditoSelecionado).toBeNull();
    });
  });

  describe('isCreditoSelecionado()', () => {
    it('should return true when credito is selected', () => {
      component.creditoSelecionado = mockCreditos[0];

      expect(component.isCreditoSelecionado(mockCreditos[0])).toBeTrue();
    });

    it('should return false when credito is not selected', () => {
      component.creditoSelecionado = mockCreditos[0];

      expect(component.isCreditoSelecionado(mockCreditos[1])).toBeFalse();
    });

    it('should return false when no credito is selected', () => {
      component.creditoSelecionado = null;

      expect(component.isCreditoSelecionado(mockCreditos[0])).toBeFalse();
    });
  });

  describe('limpar()', () => {
    it('should reset all form and component state', () => {
      component.consultaForm.get('numeroNfse')?.setValue('7891011');
      component.creditos = mockCreditos;
      component.errorMessage = 'Erro';
      component.hasSearched = true;
      component.creditoSelecionado = mockCreditos[0];
      component.mostrarDetalhes = true;

      component.limpar();

      expect(component.consultaForm.get('numeroNfse')?.value).toBeNull();
      expect(component.creditos).toEqual([]);
      expect(component.errorMessage).toBeNull();
      expect(component.hasSearched).toBeFalse();
      expect(component.creditoSelecionado).toBeNull();
      expect(component.mostrarDetalhes).toBeFalse();
    });
  });

  describe('formatarPercentual()', () => {
    it('should format number as percentage', () => {
      expect(component.formatarPercentual(5)).toBe('5%');
      expect(component.formatarPercentual(10.5)).toBe('10.5%');
    });

    it('should return "Não informado" for undefined or null', () => {
      expect(component.formatarPercentual(undefined)).toBe('Não informado');
    });
  });

  describe('formatarSimplesNacional()', () => {
    it('should return "Sim" for true', () => {
      expect(component.formatarSimplesNacional(true)).toBe('Sim');
    });

    it('should return "Não" for false', () => {
      expect(component.formatarSimplesNacional(false)).toBe('Não');
    });

    it('should return "Não informado" for undefined or null', () => {
      expect(component.formatarSimplesNacional(undefined)).toBe('Não informado');
    });
  });

  describe('temErro()', () => {
    it('should return true for invalid touched field', () => {
      component.consultaForm.get('numeroNfse')?.setValue('');
      component.consultaForm.get('numeroNfse')?.markAsTouched();

      expect(component.temErro('numeroNfse')).toBeTrue();
    });

    it('should return false for valid field', () => {
      component.consultaForm.get('numeroNfse')?.setValue('7891011');
      component.consultaForm.get('numeroNfse')?.markAsTouched();

      expect(component.temErro('numeroNfse')).toBeFalse();
    });

    it('should return false for untouched field', () => {
      component.consultaForm.get('numeroNfse')?.setValue('');

      expect(component.temErro('numeroNfse')).toBeFalse();
    });
  });

  describe('getMensagemErro()', () => {
    it('should return required message for empty field', () => {
      component.consultaForm.get('numeroNfse')?.setValue('');
      component.consultaForm.get('numeroNfse')?.markAsTouched();

      expect(component.getMensagemErro('numeroNfse')).toBe('Número da NFSe é obrigatório');
    });

    it('should return null for valid field', () => {
      component.consultaForm.get('numeroNfse')?.setValue('7891011');
      component.consultaForm.get('numeroNfse')?.markAsTouched();

      expect(component.getMensagemErro('numeroNfse')).toBeNull();
    });
  });
});

