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

export function paraCreateRequest(osId: string, item: ItemRascunho): ItemEntradaCreateRequest {
  const porQuantidade = item.tipoItem === 'ACESSORIO' && item.rastreamento === 'QUANTIDADE'
  return {
    osId,
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
