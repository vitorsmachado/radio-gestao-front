import { useEffect, useState } from 'react'
import { itensEntradaApi } from '../../api/itensEntrada'
import { itensEntradaAvaliacaoApi } from '../../api/os'
import PecaCompativelSelector from '../../components/PecaCompativelSelector'
import SugestaoTextArea from '../../components/SugestaoTextArea'
import type { GarantiaPecaDTO, ItemEntradaDTO, ResultadoAvaliacao } from '../../types/os'
import { RESULTADO_AVALIACAO_LABEL } from '../../types/os'
import type { PecaDTO } from '../../types/peca'

const RESULTADOS: ResultadoAvaliacao[] = ['AJUSTE', 'ORCAMENTO', 'SEM_DEFEITO', 'SEM_CONSERTO']

export interface AvaliacaoTecnicaValores {
  resultado: ResultadoAvaliacao
  detalheAjuste: string
  defeitoEncontrado: string
  causaDefeito: string
  solucaoRecomendada: string
  observacoesTecnicas: string
  garantiaPecaIds: string[]
}

export function valoresIniciais(item: ItemEntradaDTO): AvaliacaoTecnicaValores {
  return {
    resultado: item.resultadoAvaliacao ?? 'ORCAMENTO',
    detalheAjuste: item.detalheAjuste ?? '',
    defeitoEncontrado: item.defeitoEncontrado ?? item.avaliacaoTecnica ?? '',
    causaDefeito: item.causaDefeito ?? '',
    solucaoRecomendada: item.solucaoRecomendada ?? '',
    observacoesTecnicas: item.observacoesTecnicas ?? '',
    garantiaPecaIds: [],
  }
}

export default function AvaliacaoTecnicaFields({
  item, valores, onAtualizar, onAtualizadoItem,
}: {
  item: ItemEntradaDTO
  valores: AvaliacaoTecnicaValores
  onAtualizar: (patch: Partial<AvaliacaoTecnicaValores>) => void
  onAtualizadoItem: (i: ItemEntradaDTO) => void
}) {
  const [coberturas, setCoberturas] = useState<GarantiaPecaDTO[]>([])
  const [pecaPendente, setPecaPendente] = useState<PecaDTO | null>(null)
  const [qtdPendente, setQtdPendente] = useState('1')
  const [adicionandoPeca, setAdicionandoPeca] = useState(false)
  const [erroPeca, setErroPeca] = useState<string | null>(null)

  const precisaConserto = valores.resultado === 'AJUSTE' || valores.resultado === 'ORCAMENTO'
  const mostrarSeletorPeca = precisaConserto && item.tipoItem !== 'ACESSORIO'

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
    setErroPeca(null)
    try {
      const atualizado = await itensEntradaApi.adicionarItemConserto(item.id, {
        tipo: 'PECA',
        itemEstoqueId: pecaPendente.id,
        descricao: pecaPendente.descricao,
        quantidade: Number(qtdPendente) || 1,
        valorUnitario: pecaPendente.valorUnitario ?? 0,
      })
      onAtualizadoItem(atualizado)
      setPecaPendente(null)
      setQtdPendente('1')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErroPeca(msg ?? 'Não foi possível adicionar a peça.')
    } finally {
      setAdicionandoPeca(false)
    }
  }

  const removerPeca = async (itemConsertoId: string) => {
    setErroPeca(null)
    try {
      onAtualizadoItem(await itensEntradaApi.removerItemConserto(item.id, itemConsertoId))
    } catch {
      setErroPeca('Não foi possível remover a peça.')
    }
  }

  /** Marcar garantia já adiciona a peça no conserto (sem isso o orçamento fica sem nada pra mostrar); desmarcar remove de novo. */
  const alternarGarantia = async (cobertura: GarantiaPecaDTO) => {
    const selecionada = valores.garantiaPecaIds.includes(cobertura.id)
    setErroPeca(null)
    if (selecionada) {
      const conserto = item.itensConserto.find(ic => ic.itemEstoqueId === cobertura.pecaEstoqueId)
      if (conserto) {
        try {
          onAtualizadoItem(await itensEntradaApi.removerItemConserto(item.id, conserto.id))
        } catch {
          setErroPeca('Não foi possível remover a peça da garantia.')
        }
      }
      onAtualizar({ garantiaPecaIds: valores.garantiaPecaIds.filter(id => id !== cobertura.id) })
      return
    }
    try {
      const atualizado = await itensEntradaApi.adicionarItemConserto(item.id, {
        tipo: 'PECA',
        itemEstoqueId: cobertura.pecaEstoqueId,
        descricao: cobertura.descricaoPeca,
        quantidade: 1,
        valorUnitario: 0,
      })
      onAtualizadoItem(atualizado)
      onAtualizar({ garantiaPecaIds: [...valores.garantiaPecaIds, cobertura.id] })
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErroPeca(msg ?? 'Não foi possível marcar a peça como garantia.')
    }
  }

  return (
    <>
      <div className="form-field" style={{ marginBottom: 12 }}>
        <label className="form-label">Resultado</label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {RESULTADOS.map(r => (
            <button
              key={r} type="button"
              className={`btn btn-sm${valores.resultado === r ? ' btn-amber' : ''}`}
              onClick={() => onAtualizar({ resultado: r })}
            >
              {RESULTADO_AVALIACAO_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {coberturas.length > 0 && (
        <div className="form-field" style={{ marginBottom: 14 }}>
          <label className="form-label">Esse defeito é de uma peça em garantia?</label>
          <div className="form-hint" style={{ marginBottom: 6 }}>
            Marcar já adiciona a peça no conserto — pode marcar mais de uma, se for o caso.
          </div>
          {erroPeca && <div className="error-banner">{erroPeca}</div>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
            <button
              type="button"
              className={`btn btn-sm${valores.garantiaPecaIds.length === 0 ? ' btn-amber' : ''}`}
              onClick={() => coberturas.filter(c => valores.garantiaPecaIds.includes(c.id)).forEach(alternarGarantia)}
              disabled={valores.garantiaPecaIds.length === 0}
            >
              Não — é um problema diferente
            </button>
            {coberturas.map(c => {
              const selecionada = valores.garantiaPecaIds.includes(c.id)
              return (
                <button
                  key={c.id} type="button"
                  className={`btn btn-sm${selecionada ? ' btn-amber' : ''}`}
                  onClick={() => alternarGarantia(c)}
                >
                  {c.descricaoPeca ?? 'Peça'} — garantia até {new Date(c.dataFim).toLocaleDateString('pt-BR')}
                </button>
              )
            })}
          </div>
          {valores.garantiaPecaIds.length > 0 && (
            <div className="form-hint" style={{ marginTop: 4 }}>
              Marcado como garantia — no orçamento fica indicado que é coberta.
              Se todas as peças do conserto forem garantia, vai direto pra aguardando entrega ao salvar.
            </div>
          )}
        </div>
      )}

      {valores.resultado === 'AJUSTE' && (
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Qual o ajuste</label>
          <input className="form-input" value={valores.detalheAjuste} onChange={e => onAtualizar({ detalheAjuste: e.target.value })} />
        </div>
      )}

      {mostrarSeletorPeca && (
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Peças</label>
          <div className="form-hint" style={{ marginBottom: 6 }}>
            Só escolha a peça — o valor é definido depois, no orçamento.
          </div>
          {erroPeca && <div className="error-banner">{erroPeca}</div>}
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
        <SugestaoTextArea campo="DEFEITO_ENCONTRADO" label="Defeito encontrado" value={valores.defeitoEncontrado} onChange={v => onAtualizar({ defeitoEncontrado: v })} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <SugestaoTextArea campo="CAUSA_DEFEITO" label="Causa do defeito" value={valores.causaDefeito} onChange={v => onAtualizar({ causaDefeito: v })} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <SugestaoTextArea campo="SOLUCAO_RECOMENDADA" label="Solução recomendada" value={valores.solucaoRecomendada} onChange={v => onAtualizar({ solucaoRecomendada: v })} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <SugestaoTextArea campo="OBSERVACOES_TECNICAS" label="Observações técnicas" value={valores.observacoesTecnicas} onChange={v => onAtualizar({ observacoesTecnicas: v })} />
      </div>
    </>
  )
}
