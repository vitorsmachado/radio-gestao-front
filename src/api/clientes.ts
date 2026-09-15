import api from './axios'
import type { ClienteCreateRequest, ClienteDTO, PageResponse } from '../types/cliente'

export const clientesApi = {
  listar: (page: number, nome?: string) =>
    api
      .get<PageResponse<ClienteDTO>>(nome ? '/v1/clientes/buscar' : '/v1/clientes', {
        params: nome ? { nome, page } : { page },
      })
      .then(r => r.data),

  buscarPorId: (id: string) =>
    api.get<ClienteDTO>(`/v1/clientes/${id}`).then(r => r.data),

  criar: (data: ClienteCreateRequest) =>
    api.post<ClienteDTO>('/v1/clientes', data).then(r => r.data),

  ativar: (id: string, motivo?: string) =>
    api.patch<ClienteDTO>(`/v1/clientes/${id}/ativar`, motivo ? { motivo } : undefined).then(r => r.data),

  bloquear: (id: string, motivo?: string) =>
    api.patch<ClienteDTO>(`/v1/clientes/${id}/bloquear`, motivo ? { motivo } : undefined).then(r => r.data),

  inativar: (id: string, motivo?: string) =>
    api.patch<ClienteDTO>(`/v1/clientes/${id}/inativar`, motivo ? { motivo } : undefined).then(r => r.data),
}
