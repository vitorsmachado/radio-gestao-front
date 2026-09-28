import api from './axios'
import type {
  AgrupamentoOrcamento,
  AtualizarOrcamentoRequest,
  OrcamentoDTO,
  OrcamentoResumoDTO,
  StatusOrcamento,
} from '../types/orcamento'
import type { PageResponse } from '../types/pagination'

export const orcamentosApi = {
  listar: (params: { busca?: string; status?: StatusOrcamento; page?: number } = {}) =>
    api.get<PageResponse<OrcamentoResumoDTO>>('/v1/orcamentos/busca', { params }).then(r => r.data),

  buscarPorId: (id: string) =>
    api.get<OrcamentoDTO>(`/v1/orcamentos/${id}`).then(r => r.data),

  listarPorOS: (osId: string) =>
    api.get<OrcamentoDTO[]>('/v1/orcamentos', { params: { osId } }).then(r => r.data),

  atualizar: (id: string, data: AtualizarOrcamentoRequest) =>
    api.patch<OrcamentoDTO>(`/v1/orcamentos/${id}`, data).then(r => r.data),

  enviar: (id: string) =>
    api.patch<OrcamentoDTO>(`/v1/orcamentos/${id}/enviar`).then(r => r.data),

  reabrir: (id: string) =>
    api.patch<OrcamentoDTO>(`/v1/orcamentos/${id}/reabrir`).then(r => r.data),

  cancelar: (id: string, motivo: string) =>
    api.patch<OrcamentoDTO>(`/v1/orcamentos/${id}/cancelar`, { motivo }).then(r => r.data),

  baixarPdf: (id: string, agrupamento: AgrupamentoOrcamento) =>
    api.get(`/v1/orcamentos/${id}/pdf`, { params: { agrupamento }, responseType: 'blob' }).then(r => r.data as Blob),
}
