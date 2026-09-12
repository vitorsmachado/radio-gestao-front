import type { TipoItem } from './os'

export type StatusCatalogo = 'ATIVO' | 'INATIVO' | 'OBSOLETO'
export type TipoAcessorio =
  | 'BATERIA' | 'ANTENA' | 'BASE' | 'FONTE'
  | 'CAPA_COURO' | 'CLIP_CINTO' | 'FONE_OUVIDO' | 'OUTRO'

export interface CatalogoModeloDTO {
  id: string
  tipoItem: TipoItem
  tipoAcessorio?: TipoAcessorio
  referencia?: string
  marca: string
  modelo: string
  descricao?: string
  valorReferencia?: number
  status: StatusCatalogo
  controlePorSerie: boolean
  possuiPatrimonio: boolean
  dataCriacao?: string
  dataAtualizacao?: string
}

export interface CatalogoModeloCreateRequest {
  tipoItem: TipoItem
  tipoAcessorio?: TipoAcessorio
  referencia?: string
  marca: string
  modelo: string
  descricao?: string
  valorReferencia?: number
  controlePorSerie?: boolean
  possuiPatrimonio?: boolean
}

export interface CatalogoModeloUpdateRequest {
  tipoAcessorio?: TipoAcessorio
  referencia?: string
  descricao?: string
  valorReferencia?: number
  status?: StatusCatalogo
  controlePorSerie?: boolean
  possuiPatrimonio?: boolean
}
