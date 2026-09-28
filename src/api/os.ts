import api from './axios'
import type {
  AtualizarOrdemServicoRequest,
  FilaManutencaoOSDTO,
  GarantiaPecaDTO,
  HistoricoOSItemDTO,
  ItemEntradaDTO,
  OrdemServicoCreateRequest,
  OrdemServicoDTO,
  OrdemServicoResumoDTO,
  ReordenarFilaRequest,
  SalvarAvaliacaoTecnicaRequest,
  SepararOSRequest,
} from '../types/os'
import type { PageResponse } from '../types/pagination'

export const osApi = {
  criar: (data: OrdemServicoCreateRequest) =>
    api.post<OrdemServicoDTO>('/v1/ordens-servico', data).then(r => r.data),

  listarHistoricoPorItemEstoque: (itemEstoqueId: string) =>
    api.get<HistoricoOSItemDTO[]>(`/v1/ordens-servico/itens/${itemEstoqueId}/historico`).then(r => r.data),

  listar: (params: { busca?: string; dataInicial?: string; dataFinal?: string; page?: number; sort?: string } = {}) =>
    api.get<PageResponse<OrdemServicoResumoDTO>>('/v1/ordens-servico/busca', { params }).then(r => r.data),

  buscarPorId: (id: string) =>
    api.get<OrdemServicoDTO>(`/v1/ordens-servico/${id}`).then(r => r.data),

  atualizar: (id: string, data: AtualizarOrdemServicoRequest) =>
    api.put<OrdemServicoDTO>(`/v1/ordens-servico/${id}`, data).then(r => r.data),

  buscarPorNumero: (numero: string) =>
    api.get<OrdemServicoDTO>(`/v1/ordens-servico/numero/${numero}`).then(r => r.data),

  listarPorCliente: (clienteId: string) =>
    api.get<OrdemServicoDTO[]>('/v1/ordens-servico', { params: { clienteId } }).then(r => r.data),

  confirmarEntrega: (id: string, nomeRecebedor: string) =>
    api.patch<OrdemServicoDTO>(`/v1/ordens-servico/${id}/confirmar-entrega`, { nomeRecebedor }).then(r => r.data),

  cancelar: (id: string, motivo: string) =>
    api.patch<OrdemServicoDTO>(`/v1/ordens-servico/${id}/cancelar`, { motivo }).then(r => r.data),

  separar: (id: string, data: SepararOSRequest) =>
    api.post<OrdemServicoDTO[]>(`/v1/ordens-servico/${id}/separar`, data).then(r => r.data),

  listarFilaManutencao: () =>
    api.get<FilaManutencaoOSDTO[]>('/v1/ordens-servico/fila-manutencao').then(r => r.data),

  reordenarFila: (id: string, data: ReordenarFilaRequest) =>
    api.patch<FilaManutencaoOSDTO[]>(`/v1/ordens-servico/${id}/reordenar-fila`, data).then(r => r.data),

  baixarPdf: (id: string) =>
    api.get(`/v1/ordens-servico/${id}/pdf`, { responseType: 'blob' }).then(r => r.data as Blob),
}

export const itensEntradaAvaliacaoApi = {
  iniciarAvaliacao: (id: string) =>
    api.patch<ItemEntradaDTO>(`/v1/itens-entrada/${id}/iniciar-avaliacao`).then(r => r.data),

  salvarAvaliacaoTecnica: (id: string, data: SalvarAvaliacaoTecnicaRequest) =>
    api.patch<ItemEntradaDTO>(`/v1/itens-entrada/${id}/avaliacao-tecnica`, data).then(r => r.data),

  atualizarAvaliacaoCompleta: (id: string, data: SalvarAvaliacaoTecnicaRequest) =>
    api.put<ItemEntradaDTO>(`/v1/itens-entrada/${id}/avaliacao-tecnica`, data).then(r => r.data),

  confirmarAguardandoPeca: (id: string) =>
    api.patch<ItemEntradaDTO>(`/v1/itens-entrada/${id}/confirmar-aguardando-peca`).then(r => r.data),

  listarGarantiaDisponivel: (id: string) =>
    api.get<GarantiaPecaDTO[]>(`/v1/itens-entrada/${id}/garantia-disponivel`).then(r => r.data),
}
