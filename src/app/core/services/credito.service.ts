import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpStatusCode } from '@angular/common/http';
import { CreditoResponseDto } from '../models/credito-response.dto';
import { CreditoDetalhadoDto } from '../models/credito-detalhado.dto';
import { CreditoWorkflowResponseDto } from '../models/credito-workflow.dto';

export type CreditoCreateRequestDto = {
  numeroNfse: string;
  dataConstituicao: string;
  valorIssqn: number;
  tipoCredito: string;
  simplesNacional: boolean;
  aliquota: number;
  valorFaturado: number;
  valorDeducao: number;
  baseCalculo: number;
  solicitadoPor: string;
};

export type CreditoAdminResponseDto = {
  id?: number;
  numeroCredito: string;
  numeroNfse: string;
  dataConstituicao: string;
  valorIssqn: number;
  tipoCredito: string;
  simplesNacional: string;
  aliquota: number;
  valorFaturado: number;
  valorDeducao: number;
  baseCalculo: number;
  nomeSolicitante?: string;
  status: string;
  comprovanteRendaUrl?: string;
  dataSolicitacao?: string;
};

export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

@Injectable({
  providedIn: 'root'
})
export class CreditoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  buscarCreditosPaginados(
    page: number,
    size: number,
    sortBy: string,
    sortDir: string
  ): Observable<PageResponse<CreditoResponseDto>> {
    const url = `${this.apiUrl}/creditos`;

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http.get<PageResponse<CreditoResponseDto>>(url, { params }).pipe(
      catchError(this.handleError)
    );
  }

  getNextNumeroCredito(): Observable<string> {
    const url = `${this.apiUrl}/creditos/next-numero-credito`;
    return this.http.get(url, { responseType: 'text' }).pipe(
      catchError(this.handleErrorWorkflowGet)
    );
  }

  getNextNumeroNfse(): Observable<string> {
    const url = `${this.apiUrl}/creditos/next-numero-nfse`;
    return this.http.get(url, { responseType: 'text' }).pipe(
      catchError(this.handleErrorWorkflowGet)
    );
  }

  buscarPorNumeroCredito(numeroCredito: string): Observable<CreditoDetalhadoDto> {
    if (!numeroCredito || numeroCredito.trim() === '') {
      return throwError(() => new Error('Número do crédito é obrigatório'));
    }

    const url = `${this.apiUrl}/creditos/credito/${encodeURIComponent(numeroCredito.trim())}`;

    return this.http.get<CreditoDetalhadoDto>(url).pipe(
      catchError(this.handleErrorCredito)
    );
  }

  buscarPorNumeroNfse(numeroNfse: string): Observable<CreditoResponseDto[]> {
    if (!numeroNfse || numeroNfse.trim() === '') {
      return throwError(() => new Error('Número da NFSe é obrigatório'));
    }

    const url = `${this.apiUrl}/creditos/${encodeURIComponent(numeroNfse.trim())}`;

    return this.http.get<CreditoResponseDto[]>(url).pipe(
      map(response => Array.isArray(response) ? response : []),
      catchError(this.handleError)
    );
  }

  buscarMinhasSolicitacoes(
    _nomeSolicitante: string,
    _page: number = 0,
    _size: number = 10
  ): Observable<{ content: CreditoWorkflowResponseDto[]; totalElements: number; totalPages: number; size: number; number: number }> {
    return throwError(() => new Error('Operação não suportada pela API atual. Utilize a busca por NFSe ou Número do Crédito.'));
  }

  criarCredito(formData: FormData): Observable<CreditoAdminResponseDto> {
    return this.http.post<CreditoAdminResponseDto>('/api/creditos', formData);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Erro ao buscar créditos';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      switch (error.status) {
        case HttpStatusCode.NotFound:
          errorMessage = 'Nenhum crédito encontrado para o número de NFSe informado';
          break;
        case HttpStatusCode.BadRequest:
          errorMessage = 'Número de NFSe inválido';
          break;
        case HttpStatusCode.InternalServerError:
          errorMessage = 'Erro interno do servidor. Tente novamente mais tarde';
          break;
        case HttpStatusCode.ServiceUnavailable:
          errorMessage = 'Serviço temporariamente indisponível';
          break;
        default:
          errorMessage = error.error?.message || `Erro ${error.status}: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  private handleErrorWorkflowGet(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Erro ao enviar solicitação de crédito';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      switch (error.status) {
        case HttpStatusCode.BadRequest:
          errorMessage = error.error?.message || 'Dados inválidos. Verifique os campos preenchidos';
          break;
        case HttpStatusCode.UnprocessableEntity:
          errorMessage = error.error?.message || 'Erro de validação. Verifique os dados informados';
          break;
        case HttpStatusCode.InternalServerError:
          errorMessage = 'Erro interno do servidor. Tente novamente mais tarde';
          break;
        case HttpStatusCode.ServiceUnavailable:
          errorMessage = 'Serviço temporariamente indisponível';
          break;
        default:
          errorMessage = error.error?.message || `Erro ${error.status}: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  private handleErrorCredito(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Erro ao buscar crédito';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      switch (error.status) {
        case HttpStatusCode.NotFound:
          errorMessage = 'Crédito não encontrado para o número informado';
          break;
        case HttpStatusCode.BadRequest:
          errorMessage = 'Número de crédito inválido';
          break;
        case HttpStatusCode.InternalServerError:
          errorMessage = 'Erro interno do servidor. Tente novamente mais tarde';
          break;
        default:
          errorMessage = error.error?.message || `Erro ${error.status}: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}

