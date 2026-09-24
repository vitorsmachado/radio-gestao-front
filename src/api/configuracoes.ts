import api from './axios'
import type { AtualizarConfiguracaoRequest, ConfiguracaoDTO } from '../types/configuracao'

export const configuracoesApi = {
  buscar: () =>
    api.get<ConfiguracaoDTO>('/v1/configuracoes').then(r => r.data),

  atualizar: (data: AtualizarConfiguracaoRequest) =>
    api.put<ConfiguracaoDTO>('/v1/configuracoes', data).then(r => r.data),
}
