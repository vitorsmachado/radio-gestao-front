import api from './axios'
import type { ClienteCreateRequest, ClienteDTO, ClienteUpdateRequest, ConsultaCnpjDTO, ItemGarantiaDTO, PageResponse, StatusCliente } from '../types/cliente'

export const clientesApi = {
  listar: (params: { page?: number; busca?: string; status?: StatusCliente } = {}) =>
    api.get<PageResponse<ClienteDTO>>('/v1/clientes', { params }).then(r => r.data),

  buscarPorId: (id: string) =>
    api.get<ClienteDTO>(`/v1/clientes/${id}`).then(r => r.data),

  consultarCNPJ: (cnpj: string) =>
    api.get<ConsultaCnpjDTO>(`/v1/clientes/consulta-cnpj/${cnpj}`).then(r => r.data),

  buscarCompleto: (id: string) =>
    api.get<ClienteDTO>(`/v1/clientes/${id}/completo`).then(r => r.data),

  listarItensGarantia: (id: string) =>
    api.get<ItemGarantiaDTO[]>(`/v1/clientes/${id}/itens-garantia`).then(r => r.data),

  criar: (data: ClienteCreateRequest) =>
    api.post<ClienteDTO>('/v1/clientes', data).then(r => r.data),

  atualizar: (id: string, data: ClienteUpdateRequest) =>
    api.put<ClienteDTO>(`/v1/clientes/${id}`, data).then(r => r.data),

  ativar: (id: string, motivo?: string) =>
    api.patch<ClienteDTO>(`/v1/clientes/${id}/ativar`, motivo ? { motivo } : undefined).then(r => r.data),

  bloquear: (id: string, motivo?: string) =>
    api.patch<ClienteDTO>(`/v1/clientes/${id}/bloquear`, motivo ? { motivo } : undefined).then(r => r.data),

  inativar: (id: string, motivo?: string) =>
    api.patch<ClienteDTO>(`/v1/clientes/${id}/inativar`, motivo ? { motivo } : undefined).then(r => r.data),
}
