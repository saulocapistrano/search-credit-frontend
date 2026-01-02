import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpStatusCode } from '@angular/common/http';
import { CreditoWorkflowDto, CreditoWorkflowResponseDto } from '../models/credito-workflow.dto';
import { AnaliseCreditoDto } from '../models/analise-credito.dto';

@Injectable({
  providedIn: 'root'
})
export class CreditoWorkflowService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  getNextNumeroCredito(): Observable<string> {
    const url = `${this.apiUrl}/creditos/next-numero-credito`;
    return this.http.get(url, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  getNextNumeroNfse(): Observable<string> {
    const url = `${this.apiUrl}/creditos/next-numero-nfse`;
    return this.http.get(url, { responseType: 'text' }).pipe(
      catchError(this.handleError)
    );
  }

  enviarSolicitacao(solicitacao: CreditoWorkflowDto, comprovanteUrl: string): Observable<CreditoWorkflowResponseDto> {
    const payload = {
      ...solicitacao,
      comprovanteRendaUrl: comprovanteUrl
    };

    const url = `${this.apiUrl}/creditos`;

    return this.http.post<CreditoWorkflowResponseDto>(url, payload).pipe(
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
      catchError(this.handleError)
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
      catchError(this.handleError)
    );
  }

  analisarSolicitacao(id: number, analise: AnaliseCreditoDto): Observable<void> {
    const url = `${this.apiUrl}/creditos/${id}/analise`;

    return this.http.put<void>(url, analise).pipe(
      catchError(this.handleError)
    );
  }

  criarCredito(
    dados: {
      numeroCredito: string;
      numeroNfse: string;
      dataConstituicao: string;
      valorIssqn: number;
      tipoCredito: string;
      simplesNacional: boolean;
      aliquota: number;
      valorFaturado: number;
      valorDeducao: number;
      baseCalculo: number;
      nomeSolicitante: string;
    },
    comprovante?: File
  ): Observable<CreditoWorkflowResponseDto> {
    const formData = new FormData();

    formData.append('numeroCredito', dados.numeroCredito);
    formData.append('numeroNfse', dados.numeroNfse);
    formData.append('dataConstituicao', dados.dataConstituicao);
    formData.append('valorIssqn', dados.valorIssqn.toString());
    formData.append('tipoCredito', dados.tipoCredito);
    formData.append('simplesNacional', dados.simplesNacional.toString());
    formData.append('aliquota', dados.aliquota.toString());
    formData.append('valorFaturado', dados.valorFaturado.toString());
    formData.append('valorDeducao', dados.valorDeducao.toString());
    formData.append('baseCalculo', dados.baseCalculo.toString());
    formData.append('nomeSolicitante', dados.nomeSolicitante);

    if (comprovante) {
      formData.append('comprovante', comprovante, comprovante.name);
    }

    const url = `${this.apiUrl}/creditos`;

    return this.http.post<CreditoWorkflowResponseDto>(url, formData).pipe(
      catchError(this.handleMultipartError)
    );
  }

  private handleMultipartError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Erro ao criar solicitação de crédito';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      switch (error.status) {
        case HttpStatusCode.BadRequest:
          errorMessage = error.error?.message || 'Dados inválidos. Verifique os campos preenchidos';
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

  private handleError(error: HttpErrorResponse): Observable<never> {
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
}

