export type { PageResponse } from './pagination'

export type TipoPessoa = 'PESSOA_FISICA' | 'PESSOA_JURIDICA'
export type StatusCliente = 'ATIVO' | 'INATIVO' | 'BLOQUEADO'

export interface EnderecoDTO {
  cep: string
  logradouro: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  estado?: string
}

export interface ContatoDTO {
  id: string
  nome: string
  tipo: 'COMERCIAL' | 'TECNICO' | 'FINANCEIRO' | 'GERENCIAL'
  telefone?: string
  email?: string
  cargo?: string
  principal: boolean
}

export interface PostoDTO {
  id: string
  nome: string
  endereco?: EnderecoDTO
  responsavel?: string
  padrao: boolean
}

export interface ClienteDTO {
  id: string
  numeroIdentificacao: number
  tipo: TipoPessoa
  documento: string
  nomeRazaoSocial: string
  nomeFantasia?: string
  inscricaoEstadual?: string
  status: StatusCliente
  dataCriacao: string
  dataAtualizacao?: string
  endereco?: EnderecoDTO
  contatos?: ContatoDTO[]
  postos?: PostoDTO[]
}

export interface ClienteCreateRequest {
  tipo?: TipoPessoa
  documento: string
  nomeRazaoSocial: string
  nomeFantasia?: string
  inscricaoEstadual?: string
  endereco?: EnderecoDTO
}

export interface ClienteUpdateRequest {
  numeroIdentificacao?: number
  nomeRazaoSocial?: string
  nomeFantasia?: string
  inscricaoEstadual?: string
  endereco?: EnderecoDTO
}
