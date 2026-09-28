import api from './axios'
import type {
  AvaliarItemRequest,
  ItemConsertoCreateRequest,
  ItemEntradaCreateRequest,
  ItemEntradaDTO,
} from '../types/os'

export const itensEntradaApi = {
  criar: (data: ItemEntradaCreateRequest) =>
    api.post<ItemEntradaDTO>('/v1/itens-entrada', data).then(r => r.data),

  listarPorOS: (osId: string) =>
    api.get<ItemEntradaDTO[]>('/v1/itens-entrada', { params: { osId } }).then(r => r.data),

  remover: (id: string) =>
    api.delete<void>(`/v1/itens-entrada/${id}`).then(() => undefined),

  /** @returns o item original (com a quantidade reduzida) e o item novo, nessa ordem. */
  desmembrar: (id: string, quantidade: number) =>
    api.post<ItemEntradaDTO[]>(`/v1/itens-entrada/${id}/desmembrar`, { quantidade }).then(r => r.data),

  avaliar: (id: string, data: AvaliarItemRequest) =>
    api.patch<ItemEntradaDTO>(`/v1/itens-entrada/${id}/avaliar`, data).then(r => r.data),

  atualizarAvaliacao: (id: string, data: AvaliarItemRequest) =>
    api.put<ItemEntradaDTO>(`/v1/itens-entrada/${id}/avaliacao`, data).then(r => r.data),

  autorizar: (id: string) =>
    api.patch<ItemEntradaDTO>(`/v1/itens-entrada/${id}/autorizar`).then(r => r.data),

  naoAutorizar: (id: string, motivo: string) =>
    api.patch<ItemEntradaDTO>(`/v1/itens-entrada/${id}/nao-autorizar`, { motivo }).then(r => r.data),

  iniciarManutencao: (id: string) =>
    api.patch<ItemEntradaDTO>(`/v1/itens-entrada/${id}/iniciar-manutencao`).then(r => r.data),

  marcarAguardandoPeca: (id: string) =>
    api.patch<ItemEntradaDTO>(`/v1/itens-entrada/${id}/marcar-aguardando-peca`).then(r => r.data),

  concluirManutencao: (id: string) =>
    api.patch<ItemEntradaDTO>(`/v1/itens-entrada/${id}/concluir-manutencao`).then(r => r.data),

  aguardarEntrega: (id: string) =>
    api.patch<ItemEntradaDTO>(`/v1/itens-entrada/${id}/aguardar-entrega`).then(r => r.data),

  entregar: (id: string) =>
    api.patch<ItemEntradaDTO>(`/v1/itens-entrada/${id}/entregar`).then(r => r.data),

  adicionarItemConserto: (id: string, data: ItemConsertoCreateRequest) =>
    api.post<ItemEntradaDTO>(`/v1/itens-entrada/${id}/itens-conserto`, data).then(r => r.data),

  removerItemConserto: (id: string, itemConsertoId: string) =>
    api.delete<ItemEntradaDTO>(`/v1/itens-entrada/${id}/itens-conserto/${itemConsertoId}`).then(r => r.data),

  atualizarValorItemConserto: (id: string, itemConsertoId: string, valorUnitario: number) =>
    api.patch<ItemEntradaDTO>(`/v1/itens-entrada/${id}/itens-conserto/${itemConsertoId}`, { valorUnitario }).then(r => r.data),
}
