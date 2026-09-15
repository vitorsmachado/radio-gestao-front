import api from './axios'
import type { OrdemServicoCreateRequest, OrdemServicoDTO, OrdemServicoResumoDTO } from '../types/os'
import type { PageResponse } from '../types/pagination'

export const osApi = {
  criar: (data: OrdemServicoCreateRequest) =>
    api.post<OrdemServicoDTO>('/v1/ordens-servico', data).then(r => r.data),

  listar: (params: { busca?: string; dataInicial?: string; dataFinal?: string; page?: number; sort?: string } = {}) =>
    api.get<PageResponse<OrdemServicoResumoDTO>>('/v1/ordens-servico/busca', { params }).then(r => r.data),

  buscarPorId: (id: string) =>
    api.get<OrdemServicoDTO>(`/v1/ordens-servico/${id}`).then(r => r.data),

  buscarPorNumero: (numero: string) =>
    api.get<OrdemServicoDTO>(`/v1/ordens-servico/numero/${numero}`).then(r => r.data),

  listarPorCliente: (clienteId: string) =>
    api.get<OrdemServicoDTO[]>('/v1/ordens-servico', { params: { clienteId } }).then(r => r.data),

  iniciarAndamento: (id: string) =>
    api.patch<OrdemServicoDTO>(`/v1/ordens-servico/${id}/iniciar-andamento`).then(r => r.data),

  confirmarEntrega: (id: string, nomeRecebedor: string) =>
    api.patch<OrdemServicoDTO>(`/v1/ordens-servico/${id}/confirmar-entrega`, { nomeRecebedor }).then(r => r.data),

  cancelar: (id: string, motivo: string) =>
    api.patch<OrdemServicoDTO>(`/v1/ordens-servico/${id}/cancelar`, { motivo }).then(r => r.data),

  baixarPdf: (id: string) =>
    api.get(`/v1/ordens-servico/${id}/pdf`, { responseType: 'blob' }).then(r => r.data as Blob),
}
