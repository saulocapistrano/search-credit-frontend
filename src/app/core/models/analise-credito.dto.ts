export interface AnaliseCreditoDto {
  status: 'APROVADO' | 'REPROVADO';
  comentario?: string;
}

export interface AnaliseCreditoResponseDto {
  numeroCredito: string;
  status: string;
  comentario?: string;
  dataAnalise?: string;
}

