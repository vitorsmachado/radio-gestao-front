export type StatusOS = 'ABERTA' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA'

export type StatusItemEntrada =
  | 'PENDENTE_AVALIACAO'
  | 'EM_AVALIACAO'
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

/** Só relevante para equipamento (rádio) — faixa de frequência. */
export type FaixaEquipamento = 'VHF' | 'UHF' | 'DUAL_BAND'

export const FAIXA_EQUIPAMENTO_LABEL: Record<FaixaEquipamento, string> = {
  VHF: 'VHF',
  UHF: 'UHF',
  DUAL_BAND: 'Dual band',
}

export type ResultadoAvaliacao = 'AJUSTE' | 'ORCAMENTO' | 'SEM_DEFEITO' | 'SEM_CONSERTO'

export const RESULTADO_AVALIACAO_LABEL: Record<ResultadoAvaliacao, string> = {
  AJUSTE: 'Ajuste',
  ORCAMENTO: 'Precisa de orçamento',
  SEM_DEFEITO: 'Sem defeito',
  SEM_CONSERTO: 'Sem conserto',
}

export type AcaoReordenarFila = 'SUBIR' | 'DESCER' | 'POSICAO'

export interface ReordenarFilaRequest {
  acao: AcaoReordenarFila
  /** Índice (0-based) dentro do bloco atual da OS — obrigatório quando acao = 'POSICAO'. */
  posicao?: number
}

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
  numeroRelatorio?: string
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
  numeroRelatorio?: string
}

export interface DividirOSRequest {
  itemIds: string[]
  solicitante?: string
}

/** Edição livre da OS — permitida em qualquer status, menos CONCLUIDA. */
export interface AtualizarOrdemServicoRequest {
  clienteId: string
  postoId?: string
  tecnicoId?: string
  solicitante?: string
  dataAbertura: string
  observacoes?: string
  numeroRelatorio?: string
}

export interface ItemConsertoDTO {
  id: string
  tipo: TipoItemConserto
  itemEstoqueId?: string
  descricao?: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
  /** Se essa peça tem cobertura de garantia ativa agora — só informativo, o admin decide se cobra. */
  coberto: boolean
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
  faixa?: FaixaEquipamento
  defeitoRelatado?: string
  avaliacaoTecnica?: string
  semDefeito: boolean
  garantia: boolean
  status: StatusItemEntrada
  motivoNaoAutorizado?: string
  resultadoAvaliacao?: ResultadoAvaliacao
  detalheAjuste?: string
  defeitoEncontrado?: string
  causaDefeito?: string
  solucaoRecomendada?: string
  observacoesTecnicas?: string
  confirmadoAguardandoPecaEm?: string
  itensConserto: ItemConsertoDTO[]
  valorTotalConserto: number
}

export interface SalvarAvaliacaoTecnicaRequest {
  resultado: ResultadoAvaliacao
  detalheAjuste?: string
  defeitoEncontrado?: string
  causaDefeito?: string
  solucaoRecomendada?: string
  observacoesTecnicas?: string
  /** Coberturas de garantia (de itensEntradaAvaliacaoApi.listarGarantiaDisponivel) que o técnico está reivindicando, se houver — pode ser mais de uma. */
  garantiaPecaIds?: string[]
}

/** Cobertura de garantia ativa de uma peça trocada num reparo anterior do mesmo equipamento/acessório. */
export interface GarantiaPecaDTO {
  id: string
  pecaEstoqueId: string
  descricaoPeca?: string
  dataInicio: string
  dataFim: string
}

/**
 * bloco agrupa visualmente (1 = em avaliação, 2 = pronta pra manutenção,
 * 3 = aguardando avaliação, 4 = aguardando peça confirmado) — setas/arrastar
 * reordenam só dentro do mesmo bloco.
 */
export interface FilaManutencaoOSDTO {
  osId: string
  osNumero: string
  clienteId: string
  clienteNome?: string
  bloco: number
  itens: ItemEntradaDTO[]
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
  faixa?: FaixaEquipamento
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
