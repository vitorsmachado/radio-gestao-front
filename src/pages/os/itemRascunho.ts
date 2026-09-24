import { acessoriosApi } from '../../api/acessorios'
import { equipamentosApi } from '../../api/equipamentos'
import type { CatalogoModeloDTO } from '../../types/catalogo'
import type { FaixaEquipamento, ItemEntradaCreateRequest, TipoItem } from '../../types/os'

export interface ItemRascunho {
  tempId: string
  tipoItem: TipoItem
  descricao: string
  marca: string
  modelo: string
  faixa: FaixaEquipamento | ''
  numeroSerie: string
  patrimonio: string
  codigoCliente: string
  defeitoRelatado: string
  rastreamento: 'NS' | 'QUANTIDADE'
  quantidade: number
  catalogo: CatalogoModeloDTO | null
}

export function gerarTempId(): string {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function itemRascunhoVazio(): ItemRascunho {
  return {
    tempId: gerarTempId(),
    tipoItem: 'EQUIPAMENTO',
    descricao: '',
    marca: '',
    modelo: '',
    faixa: '',
    numeroSerie: '',
    patrimonio: '',
    codigoCliente: '',
    defeitoRelatado: '',
    rastreamento: 'NS',
    quantidade: 1,
    catalogo: null,
  }
}

/**
 * Se o item for um equipamento com N/S, ou um acessório rastreado por N/S
 * (com um modelo do catálogo que já traga o tipo de acessório), resolve
 * (busca ou cadastra) o registro rastreável correspondente no estoque,
 * ligado ao cliente da OS — é o que permite reconhecer o mesmo
 * equipamento/acessório numa visita futura, pra garantia. Lança erro se o
 * N/S já pertencer a outro cliente (confira o número de série antes de
 * continuar). Acessório sem tipo resolvível (marca/modelo digitados à mão,
 * sem escolher o catálogo) fica sem vínculo — não bloqueia o cadastro.
 */
async function resolverItemEstoqueId(clienteId: string, item: ItemRascunho): Promise<string | undefined> {
  if (!item.numeroSerie.trim()) return undefined

  if (item.tipoItem === 'EQUIPAMENTO') {
    if (!item.faixa) return undefined
    const equipamento = await equipamentosApi.resolverPorNS({
      numeroSerie: item.numeroSerie.trim(),
      clienteId,
      faixa: item.faixa,
      descricao: item.descricao.trim() || undefined,
      catalogoModeloId: item.catalogo?.id,
      marca: item.marca.trim() || undefined,
      modelo: item.modelo.trim() || undefined,
    })
    return equipamento.id
  }

  if (item.tipoItem === 'ACESSORIO' && item.rastreamento === 'NS' && item.catalogo?.tipoAcessorio) {
    const acessorio = await acessoriosApi.resolverPorNS({
      numeroSerie: item.numeroSerie.trim(),
      clienteId,
      tipoAcessorio: item.catalogo.tipoAcessorio,
      descricao: item.descricao.trim() || undefined,
      catalogoModeloId: item.catalogo?.id,
      marca: item.marca.trim() || undefined,
      modelo: item.modelo.trim() || undefined,
    })
    return acessorio.id
  }

  return undefined
}

export async function paraCreateRequest(osId: string, clienteId: string, item: ItemRascunho): Promise<ItemEntradaCreateRequest> {
  const porQuantidade = item.tipoItem === 'ACESSORIO' && item.rastreamento === 'QUANTIDADE'
  const itemEstoqueId = await resolverItemEstoqueId(clienteId, item)
  return {
    osId,
    itemEstoqueId,
    tipoItem: item.tipoItem,
    descricao: item.descricao.trim(),
    marca: item.marca.trim() || undefined,
    modelo: item.modelo.trim() || undefined,
    faixa: item.tipoItem === 'EQUIPAMENTO' && item.faixa ? item.faixa : undefined,
    numeroSerie: porQuantidade ? undefined : (item.numeroSerie.trim() || undefined),
    patrimonio: porQuantidade ? undefined : (item.patrimonio.trim() || undefined),
    codigoCliente: item.codigoCliente.trim() || undefined,
    quantidade: porQuantidade ? (Number(item.quantidade) || 1) : 1,
    defeitoRelatado: item.defeitoRelatado.trim() || undefined,
    catalogoModeloId: item.catalogo?.id,
  }
}

export function formatarValorReferencia(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
