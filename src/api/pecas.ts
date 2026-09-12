import api from './axios'
import type { CriticidadeEstoque, PecaCreateRequest, PecaDTO } from '../types/peca'
import type { PageResponse } from '../types/pagination'

export const pecasApi = {
  listar: (params: { page?: number; criticidade?: CriticidadeEstoque; modeloCompativelId?: string } = {}) =>
    api.get<PageResponse<PecaDTO>>('/v1/estoque/pecas', { params }).then(r => r.data),

  criar: (data: PecaCreateRequest) =>
    api.post<PecaDTO>('/v1/estoque/pecas', data).then(r => r.data),

  vincularModeloCompativel: (id: string, catalogoModeloId: string) =>
    api.post<PecaDTO>(`/v1/estoque/pecas/${id}/modelos-compativeis/${catalogoModeloId}`).then(r => r.data),

  desvincularModeloCompativel: (id: string, catalogoModeloId: string) =>
    api.delete<PecaDTO>(`/v1/estoque/pecas/${id}/modelos-compativeis/${catalogoModeloId}`).then(r => r.data),
}
