import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpStatusCode } from '@angular/common/http';
import { CreditoResponseDto } from '../models/credito-response.dto';
import { CreditoDetalhadoDto } from '../models/credito-detalhado.dto';
import { CreditoWorkflowResponseDto } from '../models/credito-workflow.dto';

@Injectable({
  providedIn: 'root'
})
export class CreditoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

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

  buscarMinhasSolicitacoes(nomeSolicitante: string, page: number = 0, size: number = 10): Observable<{ content: CreditoWorkflowResponseDto[], totalElements: number, totalPages: number, size: number, number: number }> {
    const url = `${this.apiUrl}/creditos`;
    const params = {
      nomeSolicitante: encodeURIComponent(nomeSolicitante),
      page: page.toString(),
      size: size.toString()
    };

    return this.http.get<{ content: CreditoWorkflowResponseDto[], totalElements: number, totalPages: number, size: number, number: number }>(url, { params }).pipe(
      catchError(this.handleErrorWorkflowGet)
    );
  }

  buscarTodasSolicitacoes(page: number = 0, size: number = 10, sortBy: string = 'dataSolicitacao', sortDir: string = 'desc'): Observable<{ content: CreditoWorkflowResponseDto[], totalElements: number, totalPages: number, size: number, number: number }> {
    const url = `${this.apiUrl}/creditos/todas`;
    const params = {
      page: page.toString(),
      size: size.toString(),
      sortBy,
      sortDir
    };

    return this.http.get<{ content: CreditoWorkflowResponseDto[], totalElements: number, totalPages: number, size: number, number: number }>(url, { params }).pipe(
      catchError(this.handleErrorWorkflowGet)
    );
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

