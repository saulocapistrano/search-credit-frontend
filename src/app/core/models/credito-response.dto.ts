export interface CreditoResponseDto {
  id: number;
  numeroNfse: string;
  numeroCredito: string;
  valor: number;
  dataEmissao: string;
  status: string;
  situacao?: string;
  dataConstituicao?: string;
  valorIssqn?: number;
  tipoCredito?: string;
  simplesNacional?: boolean;
  aliquota?: number;
  valorFaturado?: number;
  valorDeducao?: number;
  baseCalculo?: number;
  [key: string]: unknown;
}

