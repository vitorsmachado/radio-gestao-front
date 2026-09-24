import { useEffect, useState } from 'react'
import { itensEntradaApi } from '../../api/itensEntrada'
import { itensEntradaAvaliacaoApi } from '../../api/os'
import PecaCompativelSelector from '../../components/PecaCompativelSelector'
import SugestaoTextArea from '../../components/SugestaoTextArea'
import type { GarantiaPecaDTO, ItemEntradaDTO, ResultadoAvaliacao } from '../../types/os'
import { RESULTADO_AVALIACAO_LABEL } from '../../types/os'
import type { PecaDTO } from '../../types/peca'

const RESULTADOS: ResultadoAvaliacao[] = ['AJUSTE', 'ORCAMENTO', 'SEM_DEFEITO', 'SEM_CONSERTO']

export default function AvaliacaoItemCard({
  item, onAtualizado, onRemovido,
}: {
  item: ItemEntradaDTO
  onAtualizado: (i: ItemEntradaDTO) => void
  onRemovido?: (itemId: string) => void
}) {
  const [expandido, setExpandido] = useState(false)
  const [resultado, setResultado] = useState<ResultadoAvaliacao>(item.resultadoAvaliacao ?? 'ORCAMENTO')
  const [detalheAjuste, setDetalheAjuste] = useState(item.detalheAjuste ?? '')
  const [defeitoEncontrado, setDefeitoEncontrado] = useState(item.defeitoEncontrado ?? item.avaliacaoTecnica ?? '')
  const [causaDefeito, setCausaDefeito] = useState(item.causaDefeito ?? '')
  const [solucaoRecomendada, setSolucaoRecomendada] = useState(item.solucaoRecomendada ?? '')
  const [observacoesTecnicas, setObservacoesTecnicas] = useState(item.observacoesTecnicas ?? '')
  const [coberturas, setCoberturas] = useState<GarantiaPecaDTO[]>([])
  const [garantiaPecaId, setGarantiaPecaId] = useState('')
  const [pecaPendente, setPecaPendente] = useState<PecaDTO | null>(null)
  const [qtdPendente, setQtdPendente] = useState('1')
  const [adicionandoPeca, setAdicionandoPeca] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [removendo, setRemovendo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const precisaConserto = resultado === 'AJUSTE' || resultado === 'ORCAMENTO'
  const mostrarSeletorPeca = precisaConserto && !garantiaPecaId && item.tipoItem !== 'ACESSORIO'

  useEffect(() => {
    if (!precisaConserto || !item.itemEstoqueId) {
      setCoberturas([])
      return
    }
    itensEntradaAvaliacaoApi.listarGarantiaDisponivel(item.id)
      .then(setCoberturas)
      .catch(() => setCoberturas([]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [precisaConserto, item.id, item.itemEstoqueId])

  const adicionarPeca = async () => {
    if (!pecaPendente) return
    setAdicionandoPeca(true)
    setErro(null)
    try {
      const atualizado = await itensEntradaApi.adicionarItemConserto(item.id, {
        tipo: 'PECA',
        itemEstoqueId: pecaPendente.id,
        descricao: pecaPendente.descricao,
        quantidade: Number(qtdPendente) || 1,
        valorUnitario: 0,
      })
      onAtualizado(atualizado)
      setPecaPendente(null)
      setQtdPendente('1')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErro(msg ?? 'Não foi possível adicionar a peça.')
    } finally {
      setAdicionandoPeca(false)
    }
  }

  const removerPeca = async (itemConsertoId: string) => {
    setErro(null)
    try {
      onAtualizado(await itensEntradaApi.removerItemConserto(item.id, itemConsertoId))
    } catch {
      setErro('Não foi possível remover a peça.')
    }
  }

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
        resultado,
        detalheAjuste: resultado === 'AJUSTE' ? (detalheAjuste.trim() || undefined) : undefined,
        defeitoEncontrado: defeitoEncontrado.trim() || undefined,
        causaDefeito: causaDefeito.trim() || undefined,
        solucaoRecomendada: solucaoRecomendada.trim() || undefined,
        observacoesTecnicas: observacoesTecnicas.trim() || undefined,
        garantiaPecaId: garantiaPecaId || undefined,
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

  return (
    <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, cursor: 'pointer' }}
        onClick={toggleExpandir}
      >
        <div>
          <div style={{ fontWeight: 600 }}>{item.descricao}</div>
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

          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Resultado</label>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {RESULTADOS.map(r => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" checked={resultado === r} onChange={() => setResultado(r)} />
                  {RESULTADO_AVALIACAO_LABEL[r]}
                </label>
              ))}
            </div>
          </div>

          {coberturas.length > 0 && (
            <div className="form-field" style={{ marginBottom: 14 }}>
              <label className="form-label">Esse defeito é de uma peça em garantia?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="radio" checked={garantiaPecaId === ''} onChange={() => setGarantiaPecaId('')} />
                  Não — é um problema diferente
                </label>
                {coberturas.map(c => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="radio" checked={garantiaPecaId === c.id} onChange={() => setGarantiaPecaId(c.id)} />
                    {c.descricaoPeca ?? 'Peça'} — garantia até {new Date(c.dataFim).toLocaleDateString('pt-BR')}
                  </label>
                ))}
              </div>
              {garantiaPecaId && (
                <div className="form-hint" style={{ marginTop: 4 }}>
                  Coberto por garantia — sem custo, sem orçamento. Segue direto pra manutenção.
                </div>
              )}
            </div>
          )}

          {resultado === 'AJUSTE' && (
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label className="form-label">Qual o ajuste</label>
              <input className="form-input" value={detalheAjuste} onChange={e => setDetalheAjuste(e.target.value)} />
            </div>
          )}

          {mostrarSeletorPeca && (
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label className="form-label">Peças</label>
              <div className="form-hint" style={{ marginBottom: 6 }}>
                Só escolha a peça — o valor é definido depois, no orçamento.
              </div>
              <PecaCompativelSelector catalogoModeloId={item.catalogoModeloId} onSelecionar={setPecaPendente} />

              {pecaPendente && (
                <div className="section-card" style={{ marginTop: 8, background: 'var(--bg3)' }}>
                  <div style={{ fontSize: 13, marginBottom: 8 }}>{pecaPendente.descricao}</div>
                  <div className="form-field" style={{ marginBottom: 8, maxWidth: 120 }}>
                    <label className="form-label">Quantidade</label>
                    <input type="number" min={1} className="form-input" value={qtdPendente} onChange={e => setQtdPendente(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-sm" onClick={() => setPecaPendente(null)}>Cancelar</button>
                    <button type="button" className="btn btn-sm btn-amber" disabled={adicionandoPeca} onClick={adicionarPeca}>
                      {adicionandoPeca ? '// salvando...' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              )}

              {item.itensConserto.length > 0 && (
                <table className="table" style={{ marginTop: 8 }}>
                  <thead>
                    <tr>
                      <th>Peça</th>
                      <th>Qtd.</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.itensConserto.map(ic => (
                      <tr key={ic.id}>
                        <td>{ic.descricao || '—'}</td>
                        <td>{ic.quantidade}</td>
                        <td>
                          <button type="button" className="btn btn-sm" onClick={() => removerPeca(ic.id)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <SugestaoTextArea campo="DEFEITO_ENCONTRADO" label="Defeito encontrado" value={defeitoEncontrado} onChange={setDefeitoEncontrado} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <SugestaoTextArea campo="CAUSA_DEFEITO" label="Causa do defeito" value={causaDefeito} onChange={setCausaDefeito} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <SugestaoTextArea campo="SOLUCAO_RECOMENDADA" label="Solução recomendada" value={solucaoRecomendada} onChange={setSolucaoRecomendada} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <SugestaoTextArea campo="OBSERVACOES_TECNICAS" label="Observações técnicas" value={observacoesTecnicas} onChange={setObservacoesTecnicas} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            {item.status === 'PENDENTE_AVALIACAO' && onRemovido ? (
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
