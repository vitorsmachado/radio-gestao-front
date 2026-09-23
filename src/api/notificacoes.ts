import api from './axios'
import type { NotificacaoDTO } from '../types/notificacao'
import type { PageResponse } from '../types/pagination'

export const notificacoesApi = {
  listar: (params: { lida?: boolean; page?: number } = {}) =>
    api.get<PageResponse<NotificacaoDTO>>('/v1/notificacoes', { params }).then(r => r.data),

  contarNaoLidas: () =>
    api.get<number>('/v1/notificacoes/contagem-nao-lidas').then(r => r.data),

  marcarComoLida: (id: string) =>
    api.patch<NotificacaoDTO>(`/v1/notificacoes/${id}/marcar-lida`).then(r => r.data),
}
