import { useState } from 'react'
import { itensEntradaApi } from '../../api/itensEntrada'
import { itensEntradaAvaliacaoApi } from '../../api/os'
import type { ItemEntradaDTO } from '../../types/os'
import AvaliacaoTecnicaFields, { valoresIniciais, type AvaliacaoTecnicaValores } from './AvaliacaoTecnicaFields'

export default function AvaliacaoItemCard({
  item, onAtualizado, onRemovido, onDesmembrado,
}: {
  item: ItemEntradaDTO
  onAtualizado: (i: ItemEntradaDTO) => void
  onRemovido?: (itemId: string) => void
  onDesmembrado?: (itens: ItemEntradaDTO[]) => void
}) {
  const [expandido, setExpandido] = useState(false)
  const [valores, setValores] = useState<AvaliacaoTecnicaValores>(() => valoresIniciais(item))
  const [salvando, setSalvando] = useState(false)
  const [removendo, setRemovendo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [qtdDesmembrar, setQtdDesmembrar] = useState(1)
  const [desmembrando, setDesmembrando] = useState(false)

  const atualizarValores = (patch: Partial<AvaliacaoTecnicaValores>) => setValores(prev => ({ ...prev, ...patch }))

  const toggleExpandir = async () => {
    if (!expandido && item.status === 'PENDENTE_AVALIACAO') {
      try {
        onAtualizado(await itensEntradaAvaliacaoApi.iniciarAvaliacao(item.id))
      } catch {
        // não crítico — deixa expandir mesmo se a chamada falhar
      }
    }
    setExpandido(e => !e)
  }

  const salvar = async () => {
    setSalvando(true)
    setErro(null)
    try {
      const atualizado = await itensEntradaAvaliacaoApi.salvarAvaliacaoTecnica(item.id, {
        resultado: valores.resultado,
        detalheAjuste: valores.resultado === 'AJUSTE' ? (valores.detalheAjuste.trim() || undefined) : undefined,
        defeitoEncontrado: valores.defeitoEncontrado.trim() || undefined,
        causaDefeito: valores.causaDefeito.trim() || undefined,
        solucaoRecomendada: valores.solucaoRecomendada.trim() || undefined,
        observacoesTecnicas: valores.observacoesTecnicas.trim() || undefined,
        garantiaPecaIds: valores.garantiaPecaIds.length > 0 ? valores.garantiaPecaIds : undefined,
      })
      onAtualizado(atualizado)
      setExpandido(false)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErro(msg ?? 'Não foi possível salvar a avaliação.')
    } finally {
      setSalvando(false)
    }
  }

  const remover = async () => {
    if (!window.confirm(`Remover "${item.descricao}" da OS? O cliente decidiu não deixar o item.`)) return
    setRemovendo(true)
    setErro(null)
    try {
      await itensEntradaApi.remover(item.id)
      onRemovido?.(item.id)
    } catch {
      setErro('Não foi possível remover o item.')
      setRemovendo(false)
    }
  }

  const desmembrar = async () => {
    setDesmembrando(true)
    setErro(null)
    try {
      const itens = await itensEntradaApi.desmembrar(item.id, qtdDesmembrar)
      onDesmembrado?.(itens)
      setQtdDesmembrar(1)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErro(msg ?? 'Não foi possível desmembrar o item.')
    } finally {
      setDesmembrando(false)
    }
  }

  return (
    <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, cursor: 'pointer' }}
        onClick={toggleExpandir}
      >
        <div>
          <div style={{ fontWeight: 600 }}>
            {item.descricao}{item.quantidade > 1 ? ` (${item.quantidade}x)` : ''}
          </div>
          <div className="page-sub">Defeito relatado: {item.defeitoRelatado || '—'}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className={`badge ${item.status === 'EM_AVALIACAO' ? 'b-purple' : 'b-gray'}`}>
            {item.status === 'EM_AVALIACAO' ? 'Em avaliação' : 'Aguardando avaliação'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{expandido ? '▲' : '▼'}</span>
        </div>
      </div>

      {expandido && (
        <div style={{ padding: 14, borderTop: '0.5px solid var(--border)' }}>
          {erro && <div className="error-banner">{erro}</div>}

          {item.quantidade > 1 && (
            <div className="section-card" style={{ marginBottom: 12 }}>
              <div className="form-label" style={{ marginBottom: 6 }}>Desmembrar</div>
              <div className="page-sub" style={{ marginBottom: 8 }}>
                Separa uma quantidade num item novo e independente — útil quando nem todas as {item.quantidade} unidades
                têm o mesmo defeito, ou vão pra equipamentos diferentes.
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="number" className="form-input" style={{ width: 80 }}
                  min={1} max={item.quantidade - 1} value={qtdDesmembrar}
                  onChange={e => setQtdDesmembrar(Number(e.target.value) || 1)}
                />
                <button type="button" className="btn btn-sm" disabled={desmembrando} onClick={desmembrar}>
                  {desmembrando ? '// separando...' : 'Desmembrar'}
                </button>
              </div>
            </div>
          )}

          <AvaliacaoTecnicaFields item={item} valores={valores} onAtualizar={atualizarValores} onAtualizadoItem={onAtualizado} />

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {(item.status === 'PENDENTE_AVALIACAO' || item.status === 'EM_AVALIACAO') && onRemovido ? (
              <button type="button" className="btn btn-danger" disabled={removendo} onClick={remover}>
                Remover item
              </button>
            ) : <span />}
            <button type="button" className="btn btn-amber" disabled={salvando} onClick={salvar}>
              {salvando ? '// salvando...' : 'Salvar avaliação'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
