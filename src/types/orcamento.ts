import type { ItemEntradaDTO } from './os'

export type StatusOrcamento = 'RASCUNHO' | 'ENVIADO' | 'CANCELADO'

export const STATUS_ORCAMENTO_LABEL: Record<StatusOrcamento, string> = {
  RASCUNHO: 'Rascunho',
  ENVIADO: 'Enviado',
  CANCELADO: 'Cancelado',
}

export const STATUS_ORCAMENTO_BADGE: Record<StatusOrcamento, string> = {
  RASCUNHO: 'b-gray',
  ENVIADO: 'b-blue',
  CANCELADO: 'b-red',
}

export type StatusAprovacaoOrcamento = 'PENDENTE' | 'AUTORIZADO' | 'NAO_AUTORIZADO' | 'PARCIALMENTE_AUTORIZADO'

export const STATUS_APROVACAO_LABEL: Record<StatusAprovacaoOrcamento, string> = {
  PENDENTE: 'Pendente',
  AUTORIZADO: 'Autorizado',
  NAO_AUTORIZADO: 'Não autorizado',
  PARCIALMENTE_AUTORIZADO: 'Parcialmente autorizado',
}

export const STATUS_APROVACAO_BADGE: Record<StatusAprovacaoOrcamento, string> = {
  PENDENTE: 'b-gray',
  AUTORIZADO: 'b-green',
  NAO_AUTORIZADO: 'b-red',
  PARCIALMENTE_AUTORIZADO: 'b-amber',
}

/** Como os itens de conserto são apresentados — por equipamento (padrão) ou consolidados por descrição. */
export type AgrupamentoOrcamento = 'EQUIPAMENTO' | 'ITENS'

export interface OrcamentoResumoDTO {
  id: string
  numero: string
  osId: string
  osNumero?: string
  clienteId: string
  clienteNome?: string
  status: StatusOrcamento
  statusAprovacao: StatusAprovacaoOrcamento
  dataEmissao: string
  validade?: string
  expirado: boolean
  valorTotal: number
  quantidadeItens: number
  resumoItens: string
}

export interface OrcamentoDTO {
  id: string
  numero: string
  osId: string
  clienteId: string
  validade?: string
  condicoesPagamento?: string
  desconto: number
  status: StatusOrcamento
  dataEmissao: string
  observacoes?: string
  expirado: boolean
  valorTotal: number
  statusAprovacao: StatusAprovacaoOrcamento
  itens: ItemEntradaDTO[]
}

export interface AtualizarOrcamentoRequest {
  validade?: string
  condicoesPagamento?: string
  desconto?: number
}
