import api from './axios'
import type { CriticidadeEstoque, MovimentacaoEstoqueDTO, PecaCreateRequest, PecaDTO, PecaUpdateRequest } from '../types/peca'
import type { PageResponse } from '../types/pagination'

export const pecasApi = {
  listar: (params: { page?: number; criticidade?: CriticidadeEstoque; modeloCompativelId?: string } = {}) =>
    api.get<PageResponse<PecaDTO>>('/v1/estoque/pecas', { params }).then(r => r.data),

  criar: (data: PecaCreateRequest) =>
    api.post<PecaDTO>('/v1/estoque/pecas', data).then(r => r.data),

  atualizar: (id: string, data: PecaUpdateRequest) =>
    api.put<PecaDTO>(`/v1/estoque/pecas/${id}`, data).then(r => r.data),

  vincularModeloCompativel: (id: string, catalogoModeloId: string) =>
    api.post<PecaDTO>(`/v1/estoque/pecas/${id}/modelos-compativeis/${catalogoModeloId}`).then(r => r.data),

  desvincularModeloCompativel: (id: string, catalogoModeloId: string) =>
    api.delete<PecaDTO>(`/v1/estoque/pecas/${id}/modelos-compativeis/${catalogoModeloId}`).then(r => r.data),

  darEntrada: (id: string, quantidade: number, motivo?: string) =>
    api.post<number>(`/v1/estoque/pecas/${id}/entrada`, { quantidade, motivo }).then(r => r.data),

  darSaida: (id: string, quantidade: number, motivo?: string) =>
    api.post<number>(`/v1/estoque/pecas/${id}/saida`, { quantidade, motivo }).then(r => r.data),

  ajustar: (id: string, quantidade: number, motivo?: string) =>
    api.put<number>(`/v1/estoque/pecas/${id}/ajuste`, { quantidade, motivo }).then(r => r.data),

  listarMovimentacoes: (id: string, page = 0) =>
    api.get<PageResponse<MovimentacaoEstoqueDTO>>(`/v1/estoque/pecas/${id}/movimentacoes`, { params: { page } }).then(r => r.data),
}
