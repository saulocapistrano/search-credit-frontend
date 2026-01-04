import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpStatusCode } from '@angular/common/http';

export interface ComprovanteUploadResponse {
  url: string;
  fileName: string;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
export class ComprovanteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api';

  upload(file: File): Observable<ComprovanteUploadResponse> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    const url = `${this.apiUrl}/comprovantes/upload`;

    return this.http.post<ComprovanteUploadResponse>(url, formData).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Erro ao fazer upload do comprovante';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      switch (error.status) {
        case HttpStatusCode.BadRequest:
          errorMessage = error.error?.message || 'Arquivo inválido';
          break;
        case 413: // Request Entity Too Large
          errorMessage = 'Arquivo muito grande. Tamanho máximo: 5MB';
          break;
        case HttpStatusCode.UnsupportedMediaType:
          errorMessage = 'Tipo de arquivo não suportado. Use PDF, JPG ou PNG';
          break;
        case HttpStatusCode.InternalServerError:
          errorMessage = 'Erro interno do servidor ao fazer upload';
          break;
        default:
          errorMessage = error.error?.message || `Erro ${error.status}: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}

