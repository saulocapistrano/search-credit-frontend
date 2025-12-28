export interface CreditoDetalhadoDto {
  numeroCredito: string;
  numeroNfse: string;
  dataConstituicao?: string;
  valorIssqn?: number;
  tipoCredito?: string;
  simplesNacional?: string;
  aliquota?: number;
  valorFaturado?: number;
  valorDeducao?: number;
  baseCalculo?: number;
  valor?: number;
  dataEmissao?: string;
  status?: string;
  [key: string]: unknown;
}

