import type { CatalogoModeloDTO } from './catalogo'

export type StatusItemEstoque = 'ATIVO' | 'INATIVO' | 'OBSOLETO'
export type CriticidadeEstoque = 'EM_FALTA' | 'ESTOQUE_BAIXO' | 'CRITICO'

export interface PecaDTO {
  id: string
  codigo: string
  descricao: string
  quantidadeDisponivel: number
  quantidadeMinima?: number
  status: StatusItemEstoque
  catalogoModeloId?: string
  observacoes?: string
  localizacaoFisica?: string
  emFalta: boolean
  estoqueBaixo: boolean
  modelosCompativeis: CatalogoModeloDTO[]
  dataCriacao?: string
  dataAtualizacao?: string
}

export interface PecaCreateRequest {
  descricao: string
  quantidadeDisponivel?: number
  quantidadeMinima?: number
  catalogoModeloId?: string
  marca?: string
  modelo?: string
  modelosCompativeisIds?: string[]
}

export interface PecaUpdateRequest {
  codigo?: string
  descricao?: string
  quantidadeMinima?: number
  observacoes?: string
  localizacaoFisica?: string
}

export type TipoMovimentacaoEstoque = 'ENTRADA' | 'SAIDA' | 'AJUSTE'

export interface MovimentacaoEstoqueDTO {
  id: string
  tipoMovimentacao: TipoMovimentacaoEstoque
  saldoAnterior: number
  saldoNovo: number
  motivo?: string
  dataCriacao?: string
}
