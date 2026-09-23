import api from './axios'
import type { CampoSugestao, SugestaoTextoDTO } from '../types/sugestao'

export const sugestoesApi = {
  buscar: (campo: CampoSugestao, busca?: string) =>
    api.get<SugestaoTextoDTO[]>('/v1/sugestoes', { params: { campo, busca } }).then(r => r.data),

  excluir: (id: string) =>
    api.delete(`/v1/sugestoes/${id}`),
}
