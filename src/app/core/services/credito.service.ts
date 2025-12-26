import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HttpStatusCode } from '@angular/common/http';
import { CreditoResponseDto } from '../models/credito-response.dto';

@Injectable({
  providedIn: 'root'
})
export class CreditoService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

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
}

