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
  observacoes?: string
}

export interface OrdemServicoCreateRequest {
  clienteId: string
  postoId?: string
  tecnicoId?: string
  solicitante?: string
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
  tipoItem: TipoItem
  descricao: string
  numeroSerie?: string
  patrimonio?: string
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
  tipoItem: TipoItem
  descricao: string
  numeroSerie?: string
  patrimonio?: string
  marca?: string
  modelo?: string
  defeitoRelatado?: string
  garantia?: boolean
}

export interface AvaliarItemRequest {
  avaliacaoTecnica?: string
  semDefeito: boolean
}
