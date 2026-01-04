import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CreditoResponseDto } from '../models/credito-response.dto';

/**
 * Serviço de cache para armazenar créditos no frontend.
 * Armazena créditos conforme são consultados e permite acesso centralizado.
 */
@Injectable({
  providedIn: 'root'
})
export class CreditoCacheService {
  private readonly storageKey = 'creditos_cache';
  private readonly creditosSubject = new BehaviorSubject<CreditoResponseDto[]>([]);
  public readonly creditos$: Observable<CreditoResponseDto[]> = this.creditosSubject.asObservable();

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        this.creditosSubject.next(parsed as CreditoResponseDto[]);
      }
    } catch {
      return;
    }
  }

  private persistir(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(this.creditosSubject.value));
    } catch {
      return;
    }
  }

  /**
   * Adiciona créditos ao cache, evitando duplicatas baseado no ID.
   */
  adicionarCreditos(creditos: CreditoResponseDto[]): void {
    const creditosAtuais = this.creditosSubject.value;
    const novosCreditos = creditos.filter(
      novoCredito => !creditosAtuais.some(existente => existente.id === novoCredito.id)
    );

    if (novosCreditos.length > 0) {
      this.creditosSubject.next([...creditosAtuais, ...novosCreditos]);
      this.persistir();
    }
  }

  /**
   * Adiciona um único crédito ao cache.
   */
  adicionarCredito(credito: CreditoResponseDto): void {
    const creditosAtuais = this.creditosSubject.value;
    const existe = creditosAtuais.some(c => c.id === credito.id);

    if (!existe) {
      this.creditosSubject.next([...creditosAtuais, credito]);
      this.persistir();
    }
  }

  /**
   * Retorna todos os créditos armazenados no cache.
   */
  obterTodosCreditos(): CreditoResponseDto[] {
    return [...this.creditosSubject.value];
  }

  /**
   * Limpa o cache de créditos.
   */
  limparCache(): void {
    this.creditosSubject.next([]);
    this.persistir();
  }

  /**
   * Retorna o número total de créditos no cache.
   */
  obterTotalCreditos(): number {
    return this.creditosSubject.value.length;
  }
}

