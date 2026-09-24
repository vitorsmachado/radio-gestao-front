import type { FaixaEquipamento } from './os'

export interface EquipamentoDTO {
  id: string
  numeroSerie: string
  clienteId?: string
}

export interface ResolverEquipamentoPorNSRequest {
  numeroSerie: string
  clienteId: string
  faixa: FaixaEquipamento
  descricao?: string
  catalogoModeloId?: string
  marca?: string
  modelo?: string
}
