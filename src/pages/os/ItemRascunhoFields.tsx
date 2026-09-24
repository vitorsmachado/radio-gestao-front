import CatalogoSelector from '../../components/CatalogoSelector'
import { FAIXA_EQUIPAMENTO_LABEL, type FaixaEquipamento, type TipoItem } from '../../types/os'
import type { CatalogoModeloDTO } from '../../types/catalogo'
import type { ItemRascunho } from './itemRascunho'

export default function ItemRascunhoFields({
  item, descricaoInvalida, onAtualizar,
}: {
  item: ItemRascunho
  descricaoInvalida?: boolean
  onAtualizar: (patch: Partial<ItemRascunho>) => void
}) {
  const porQuantidade = item.tipoItem === 'ACESSORIO' && item.rastreamento === 'QUANTIDADE'
  const usaCatalogo = item.tipoItem === 'EQUIPAMENTO' || item.tipoItem === 'ACESSORIO'

  const selecionarCatalogo = (c: CatalogoModeloDTO | null) => {
    if (!c) { onAtualizar({ catalogo: null }); return }
    const patch: Partial<ItemRascunho> = { catalogo: c, marca: c.marca, modelo: c.modelo }
    if (c.descricao) patch.descricao = c.descricao
    if (item.tipoItem === 'ACESSORIO') patch.rastreamento = c.controlePorSerie ? 'NS' : 'QUANTIDADE'
    onAtualizar(patch)
  }

  return (
    <>
      <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
        <div className="form-field">
          <label className="form-label">Tipo</label>
          <select
            className="form-select" value={item.tipoItem}
            onChange={e => onAtualizar({ tipoItem: e.target.value as TipoItem, catalogo: null })}
          >
            <option value="EQUIPAMENTO">Equipamento</option>
            <option value="ACESSORIO">Acessório</option>
          </select>
        </div>
        {usaCatalogo && (
          <div className="form-field">
            <label className="form-label">Modelo no catálogo</label>
            <CatalogoSelector tipoItem={item.tipoItem} selecionado={item.catalogo} onSelecionar={selecionarCatalogo} />
          </div>
        )}
      </div>

      <div className="form-field" style={{ marginBottom: 12 }}>
        <label className="form-label">Descrição</label>
        <input
          className={`form-input${descricaoInvalida ? ' error' : ''}`} placeholder="Rádio Motorola EP450"
          value={item.descricao} onChange={e => onAtualizar({ descricao: e.target.value })}
        />
        {descricaoInvalida && <span className="form-error">Descrição obrigatória</span>}
      </div>

      <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
        <div className="form-field">
          <label className="form-label">Marca</label>
          <input className="form-input" value={item.marca} onChange={e => onAtualizar({ marca: e.target.value })} />
        </div>
        <div className="form-field">
          <label className="form-label">Modelo</label>
          <input className="form-input" value={item.modelo} onChange={e => onAtualizar({ modelo: e.target.value })} />
        </div>
      </div>

      {item.tipoItem === 'EQUIPAMENTO' && (
        <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
          <div className="form-field">
            <label className="form-label">Faixa</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {Object.entries(FAIXA_EQUIPAMENTO_LABEL).map(([valor, label]) => (
                <button
                  key={valor} type="button"
                  className={`btn btn-sm${item.faixa === valor ? ' btn-amber' : ''}`}
                  onClick={() => onAtualizar({ faixa: valor as FaixaEquipamento })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label className="form-label">Número de série</label>
            <input className="form-input" value={item.numeroSerie} onChange={e => onAtualizar({ numeroSerie: e.target.value })} />
          </div>
        </div>
      )}

      {item.tipoItem === 'ACESSORIO' && (
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Rastreamento</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className={`btn btn-sm${item.rastreamento === 'NS' ? ' btn-amber' : ''}`}
              onClick={() => onAtualizar({ rastreamento: 'NS' })}
            >
              N/S
            </button>
            <button
              type="button"
              className={`btn btn-sm${item.rastreamento === 'QUANTIDADE' ? ' btn-amber' : ''}`}
              onClick={() => onAtualizar({ rastreamento: 'QUANTIDADE' })}
            >
              Qnt.
            </button>
          </div>
          <div className="form-hint" style={{ marginTop: 4 }}>
            Use "Qnt." para acessórios sem identificação individual — ex: antenas genéricas.
          </div>
        </div>
      )}

      {item.tipoItem === 'ACESSORIO' && (
        <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
          <div className="form-field">
            {porQuantidade ? (
              <>
                <label className="form-label">Quantidade</label>
                <input
                  type="number" min={1} className="form-input"
                  value={item.quantidade}
                  onChange={e => onAtualizar({ quantidade: Number(e.target.value) || 1 })}
                />
              </>
            ) : (
              <>
                <label className="form-label">Número de série</label>
                <input className="form-input" value={item.numeroSerie} onChange={e => onAtualizar({ numeroSerie: e.target.value })} />
              </>
            )}
          </div>
          <div className="form-field">
            <label className="form-label">Código do cliente</label>
            <input
              className="form-input" placeholder="Identificação própria do cliente pro item"
              value={item.codigoCliente} onChange={e => onAtualizar({ codigoCliente: e.target.value })}
            />
          </div>
        </div>
      )}

      {item.tipoItem === 'EQUIPAMENTO' && (
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Código do cliente</label>
          <input
            className="form-input" placeholder="Identificação própria do cliente pro item"
            value={item.codigoCliente} onChange={e => onAtualizar({ codigoCliente: e.target.value })}
          />
        </div>
      )}

      <div className="form-field">
        <label className="form-label">Defeito relatado pelo cliente</label>
        <textarea
          className="form-input" rows={3}
          value={item.defeitoRelatado} onChange={e => onAtualizar({ defeitoRelatado: e.target.value })}
        />
      </div>
    </>
  )
}
