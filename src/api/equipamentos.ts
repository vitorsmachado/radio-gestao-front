import api from './axios'
import type { EquipamentoDTO, ResolverEquipamentoPorNSRequest } from '../types/equipamento'

export const equipamentosApi = {
  resolverPorNS: (data: ResolverEquipamentoPorNSRequest) =>
    api.post<EquipamentoDTO>('/v1/estoque/equipamentos/resolver-ns', data).then(r => r.data),
}
