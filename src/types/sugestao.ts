export type CampoSugestao = 'DEFEITO_ENCONTRADO' | 'CAUSA_DEFEITO' | 'SOLUCAO_RECOMENDADA' | 'OBSERVACOES_TECNICAS'

export interface SugestaoTextoDTO {
  id: string
  valor: string
  contagemUso: number
}
