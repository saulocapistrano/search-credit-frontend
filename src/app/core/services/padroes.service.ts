import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PadroesService {
  
  getValorIssqn(): number[] {
    return [500.00, 1000.00, 1500.00, 2000.00];
  }

  getTiposCredito(): string[] {
    return ['ISSQN', 'ICMS', 'Outros'];
  }

  getAliquotas(): number[] {
    return [3.0, 5.0, 7.0, 10.0];
  }

  getBaseCalculo(): number[] {
    return [20000, 25000, 30000, 35000, 40000];
  }
}

