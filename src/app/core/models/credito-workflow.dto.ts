export interface CreditoWorkflowDto {
  numeroCredito: string;
  numeroNfse: string;
  dataConstituicao: string;
  valorIssqn: number;
  tipoCredito: string;
  simplesNacional: string;
  aliquota: number;
  valorFaturado: number;
  valorDeducao: number;
  baseCalculo: number;
  nomeSolicitante: string;
  status: string;
  comprovanteRendaUrl?: string;
}

export interface CreditoWorkflowResponseDto {
  id?: number;
  numeroCredito: string;
  numeroNfse: string;
  dataConstituicao: string;
  valorIssqn: number;
  tipoCredito: string;
  simplesNacional: string;
  aliquota: number;
  valorFaturado: number;
  valorDeducao: number;
  baseCalculo: number;
  nomeSolicitante: string;
  status: string;
  comprovanteRendaUrl?: string;
  dataSolicitacao?: string;
}

