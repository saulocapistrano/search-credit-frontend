export interface CreditoResponseDto {
  id: number;
  numeroNfse: string;
  numeroCredito: string;
  valor: number;
  dataEmissao: string;
  status: string;
  [key: string]: unknown;
}

