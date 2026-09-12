import api from './axios'
import type { CatalogoModeloCreateRequest, CatalogoModeloDTO } from '../types/catalogo'
import type { PageResponse } from '../types/pagination'
import type { TipoItem } from '../types/os'

export const catalogoApi = {
  listar: (params: { busca?: string; tipoItem?: TipoItem; status?: string; page?: number } = {}) =>
    api.get<PageResponse<CatalogoModeloDTO>>('/v1/catalogo-modelos', { params }).then(r => r.data),

  listarMarcas: () =>
    api.get<string[]>('/v1/catalogo-modelos/marcas').then(r => r.data),

  criar: (data: CatalogoModeloCreateRequest) =>
    api.post<CatalogoModeloDTO>('/v1/catalogo-modelos', data).then(r => r.data),
}
