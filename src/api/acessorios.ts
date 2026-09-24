import api from './axios'
import type { AcessorioDTO, ResolverAcessorioPorNSRequest } from '../types/acessorio'

export const acessoriosApi = {
  resolverPorNS: (data: ResolverAcessorioPorNSRequest) =>
    api.post<AcessorioDTO>('/v1/estoque/acessorios/resolver-ns', data).then(r => r.data),
}
