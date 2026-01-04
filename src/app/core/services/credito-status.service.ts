import { Injectable } from '@angular/core';

export type StatusCredito = 'CONSTITUIDO' | 'EM_ANALISE' | 'APROVADO' | 'REPROVADO';

@Injectable({
  providedIn: 'root'
})
export class CreditoStatusService {
  extractSituacao(credito: unknown): string {
    if (!credito) {
      return '';
    }

    if (typeof credito === 'string') {
      return credito.trim();
    }

    const pickText = (value: unknown): string => {
      if (typeof value === 'string') {
        return value.trim();
      }

      if (!value || typeof value !== 'object') {
        return '';
      }

      const obj = value as Record<string, unknown>;
      const fields = ['descricao', 'label', 'nome', 'name', 'value', 'texto', 'text'];

      for (const f of fields) {
        const v = obj[f];
        if (typeof v === 'string' && v.trim() !== '') {
          return v.trim();
        }
      }

      return '';
    };

    const asObj = credito as Record<string, unknown>;
    const directCandidates = [
      asObj['situacao'],
      asObj['situacaoCredito'],
      asObj['situacaoAtual'],
      asObj['status'],
      asObj['statusCredito'],
      asObj['statusAtual']
    ];

    for (const cand of directCandidates) {
      const text = pickText(cand);
      if (text !== '') {
        return text;
      }
    }

    // Busca profunda por strings que representem situação/status
    const needles = ['APROV', 'REPROV', 'ANALISE', 'CONSTITU'];
    const visited = new Set<unknown>();
    const queue: Array<{ value: unknown; depth: number }> = [{ value: credito, depth: 0 }];
    const maxDepth = 4;

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        break;
      }

      const { value, depth } = current;
      if (!value || visited.has(value)) {
        continue;
      }
      visited.add(value);

      if (typeof value === 'string') {
        const normalized = this.normalizeStatus(value);
        if (needles.some(n => normalized.includes(n))) {
          return value.trim();
        }
        continue;
      }

      if (depth >= maxDepth) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          queue.push({ value: item, depth: depth + 1 });
        }
        continue;
      }

      if (typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        for (const v of Object.values(obj)) {
          queue.push({ value: v, depth: depth + 1 });
        }
      }
    }

    return '';
  }

  getStatusLabel(status: StatusCredito | string): string {
    const normalized = this.normalizeStatus(status);

    switch (normalized) {
      case 'CONSTITUIDO':
        return 'Constituído';
      case 'EM_ANALISE':
        return 'Em análise';
      case 'APROVADO':
        return 'Aprovado';
      case 'REPROVADO':
        return 'Reprovado';
      default:
        return status || 'Desconhecido';
    }
  }

  getStatusBadgeClass(status: StatusCredito | string): string {
    const normalized = this.normalizeStatus(status);

    switch (normalized) {
      case 'CONSTITUIDO':
        return 'status-constituido';
      case 'EM_ANALISE':
        return 'status-em-analise';
      case 'APROVADO':
        return 'status-aprovado';
      case 'REPROVADO':
        return 'status-reprovado';
      default:
        return 'status-desconhecido';
    }
  }

  private normalizeStatus(status: StatusCredito | string): string {
    if (!status) {
      return '';
    }

    return status
      .toString()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
