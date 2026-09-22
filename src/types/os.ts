export type StatusOS = 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'

export type StatusItemEntrada =
  | 'PENDENTE_AVALIACAO'
  | 'AVALIADO'
  | 'PENDENTE_AUTORIZACAO'
  | 'AUTORIZADO'
  | 'NAO_AUTORIZADO'
  | 'PENDENTE_MANUTENCAO'
  | 'AGUARDANDO_PECA'
  | 'EM_MANUTENCAO'
  | 'MANUTENCAO_CONCLUIDA'
  | 'AGUARDANDO_ENTREGA'
  | 'ENTREGUE'

export type TipoItem = 'EQUIPAMENTO' | 'ACESSORIO' | 'PECA' | 'SERVICO'
export type TipoItemConserto = 'PECA' | 'MAO_DE_OBRA' | 'DESLOCAMENTO'

/**
 * Tipo de OS — hoje só existe uma opção. É um conceito só de front (o
 * backend ainda não modela "tipo de OS"); serve pra já deixar pronto o
 * padrão de seleção de tipo pra quando existirem outros.
 */
export type TipoOS = 'ORCAMENTO_MANUTENCAO'

export const TIPO_OS_LABEL: Record<TipoOS, string> = {
  ORCAMENTO_MANUTENCAO: 'Orçamento de manutenção',
}

export interface OrdemServicoDTO {
  id: string
  numero: string
  clienteId: string
  postoId?: string
  tecnicoId?: string
  solicitante?: string
  recebedorNome?: string
  status: StatusOS
  dataAbertura: string
  dataConclusao?: string
  dataAtualizacao?: string
  observacoes?: string
}

export interface OrdemServicoResumoDTO {
  id: string
  numero: string
  clienteId: string
  clienteNome?: string
  clienteDocumento?: string
  solicitante?: string
  status: StatusOS
  dataAbertura: string
  dataAtualizacao?: string
}

export interface OrdemServicoCreateRequest {
  clienteId: string
  postoId?: string
  tecnicoId?: string
  solicitante?: string
  /** Opcional — se ausente, o backend usa o momento da criação. */
  dataAbertura?: string
  observacoes?: string
}

export interface ItemConsertoDTO {
  id: string
  tipo: TipoItemConserto
  itemEstoqueId?: string
  descricao?: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

export interface ItemConsertoCreateRequest {
  tipo: TipoItemConserto
  itemEstoqueId?: string
  descricao?: string
  quantidade: number
  valorUnitario: number
}

export interface ItemEntradaDTO {
  id: string
  osId: string
  orcamentoId?: string
  itemEstoqueId?: string
  catalogoModeloId?: string
  /** Preço de referência do modelo do catálogo (novo), quando houver — resolvido pelo backend. */
  catalogoValorReferencia?: number
  tipoItem: TipoItem
  descricao: string
  numeroSerie?: string
  patrimonio?: string
  codigoCliente?: string
  quantidade: number
  marca?: string
  modelo?: string
  defeitoRelatado?: string
  avaliacaoTecnica?: string
  semDefeito: boolean
  garantia: boolean
  status: StatusItemEntrada
  motivoNaoAutorizado?: string
  itensConserto: ItemConsertoDTO[]
  valorTotalConserto: number
}

export interface ItemEntradaCreateRequest {
  osId: string
  itemEstoqueId?: string
  catalogoModeloId?: string
  tipoItem: TipoItem
  descricao: string
  numeroSerie?: string
  patrimonio?: string
  codigoCliente?: string
  /** Opcional — se ausente, assume 1. Maior que 1 só é permitido sem número de série/patrimônio. */
  quantidade?: number
  marca?: string
  modelo?: string
  defeitoRelatado?: string
  garantia?: boolean
}

export interface AvaliarItemRequest {
  avaliacaoTecnica?: string
  semDefeito: boolean
}

export interface HistoricoOSItemDTO {
  osId: string
  osNumero?: string
  osStatus?: StatusOS
  itemStatus: StatusItemEntrada
  dataAbertura?: string
}
