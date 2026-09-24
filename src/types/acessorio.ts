import type { TipoAcessorio } from './catalogo'

export interface AcessorioDTO {
  id: string
  numeroSerie: string
  clienteId?: string
}

export interface ResolverAcessorioPorNSRequest {
  numeroSerie: string
  clienteId: string
  tipoAcessorio: TipoAcessorio
  descricao?: string
  catalogoModeloId?: string
  marca?: string
  modelo?: string
}
