import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { configuracoesApi } from '../../api/configuracoes'
import { itensEntradaApi } from '../../api/itensEntrada'
import { orcamentosApi } from '../../api/orcamentos'
import Modal from '../../components/Modal'
import PecaCompativelSelector from '../../components/PecaCompativelSelector'
import {
  STATUS_APROVACAO_BADGE,
  STATUS_APROVACAO_LABEL,
  STATUS_ORCAMENTO_BADGE,
  STATUS_ORCAMENTO_LABEL,
  type AgrupamentoOrcamento,
  type AtualizarOrcamentoRequest,
  type OrcamentoDTO,
} from '../../types/orcamento'
import { RESULTADO_AVALIACAO_LABEL, type ItemEntradaDTO, type TipoItemConserto } from '../../types/os'
import type { PecaDTO } from '../../types/peca'

const TIPO_CONSERTO_LABEL: Record<TipoItemConserto, string> = {
  PECA: 'Peça',
  MAO_DE_OBRA: 'Mão de obra',
  DESLOCAMENTO: 'Deslocamento',
}

function formatarMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(data?: string): string {
  if (!data) return '—'
  return new Date(data).toLocaleDateString('pt-BR')
}

interface ConsolidadoLinha {
  chave: string
  tipo: TipoItemConserto
  descricao: string
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

function consolidar(itens: ItemEntradaDTO[]): ConsolidadoLinha[] {
  const porChave = new Map<string, ConsolidadoLinha>()
  for (const item of itens) {
    for (const c of item.itensConserto) {
      const chave = `${c.tipo}|${c.descricao ?? ''}|${c.valorUnitario}`
      const atual = porChave.get(chave)
      const quantidade = (atual?.quantidade ?? 0) + c.quantidade
      porChave.set(chave, {
        chave,
        tipo: c.tipo,
        descricao: c.descricao ?? '—',
        quantidade,
        valorUnitario: c.valorUnitario,
        valorTotal: c.valorUnitario * quantidade,
      })
    }
  }
  return Array.from(porChave.values())
}

export default function OrcamentoDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [orc, setOrc] = useState<OrcamentoDTO | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [processando, setProcessando] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)
  const [editando, setEditando] = useState(false)
  const [agrupamento, setAgrupamento] = useState<AgrupamentoOrcamento>('EQUIPAMENTO')
  const [modalMotivo, setModalMotivo] = useState<{ tipo: 'cancelar' } | { tipo: 'nao-autorizar'; itemId: string } | null>(null)
  const [valorMaoDeObraPadrao, setValorMaoDeObraPadrao] = useState(0)

  useEffect(() => {
    configuracoesApi.buscar().then(c => setValorMaoDeObraPadrao(c.valorMaoDeObraPadrao)).catch(() => {})
  }, [])

  const carregar = () => {
    if (!id) return
    setCarregando(true)
    setErro(null)
    orcamentosApi
      .buscarPorId(id)
      .then(setOrc)
      .catch(() => setErro('Não foi possível carregar o orçamento.'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [id])

  const consolidado = useMemo(() => (orc ? consolidar(orc.itens) : []), [orc])

  const totalMaoDeObra = useMemo(() => {
    const linhas = (orc?.itens ?? []).flatMap(item => item.itensConserto).filter(ic => ic.tipo === 'MAO_DE_OBRA')
    return {
      quantidade: linhas.reduce((s, ic) => s + ic.quantidade, 0),
      valor: linhas.reduce((s, ic) => s + ic.valorTotal, 0),
    }
  }, [orc])

  const salvarCondicoes = async (dados: AtualizarOrcamentoRequest) => {
    if (!id) return
    setProcessando(true)
    try {
      const atualizado = await orcamentosApi.atualizar(id, dados)
      setOrc(atualizado)
      setEditando(false)
    } catch {
      setErro('Não foi possível salvar as condições.')
    } finally {
      setProcessando(false)
    }
  }

  const enviar = async () => {
    if (!id) return
    setProcessando(true)
    try {
      setOrc(await orcamentosApi.enviar(id))
    } catch {
      setErro('Não foi possível enviar o orçamento.')
    } finally {
      setProcessando(false)
    }
  }

  const cancelar = async (motivo: string) => {
    if (!id) return
    setProcessando(true)
    try {
      setOrc(await orcamentosApi.cancelar(id, motivo))
      setModalMotivo(null)
    } catch {
      setErro('Não foi possível cancelar o orçamento.')
    } finally {
      setProcessando(false)
    }
  }

  const autorizarItem = async (itemId: string) => {
    setProcessando(true)
    setErro(null)
    try {
      await itensEntradaApi.autorizar(itemId)
      carregar()
    } catch {
      setErro('Não foi possível autorizar o item.')
    } finally {
      setProcessando(false)
    }
  }

  const naoAutorizarItem = async (motivo: string) => {
    if (!modalMotivo || modalMotivo.tipo !== 'nao-autorizar') return
    setProcessando(true)
    setErro(null)
    try {
      await itensEntradaApi.naoAutorizar(modalMotivo.itemId, motivo)
      setModalMotivo(null)
      carregar()
    } catch {
      setErro('Não foi possível rejeitar o item.')
    } finally {
      setProcessando(false)
    }
  }

  const baixarPdf = async () => {
    if (!id) return
    setGerandoPdf(true)
    try {
      const blob = await orcamentosApi.baixarPdf(id, agrupamento)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch {
      setErro('Não foi possível gerar o PDF.')
    } finally {
      setGerandoPdf(false)
    }
  }

  if (carregando) return <div className="loading">Carregando</div>
  if (erro && !orc) return <div className="error-banner">{erro}</div>
  if (!orc) return null

  return (
    <div className="fade-in">
      <div className="breadcrumb">
        <span className="crumb" onClick={() => navigate('/orcamentos')}>Orçamentos</span>
        <span className="sep">/</span>
        <span className="crumb" onClick={() => navigate(`/os/${orc.osId}`)}>OS</span>
        <span className="sep">/</span>
        <span className="current">{orc.numero}</span>
      </div>

      <div className="page-header">
        <div>
          <div className="page-title">Orçamento {orc.numero}</div>
          <div className="page-sub">// emitido em {formatarData(orc.dataEmissao)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className={`badge ${STATUS_ORCAMENTO_BADGE[orc.status]}`}>{STATUS_ORCAMENTO_LABEL[orc.status]}</span>
          <span className={`badge ${STATUS_APROVACAO_BADGE[orc.statusAprovacao]}`}>{STATUS_APROVACAO_LABEL[orc.statusAprovacao]}</span>
          {orc.expirado && <span className="badge b-red">Expirado</span>}
          <button className="btn btn-sm" disabled={gerandoPdf} onClick={baixarPdf}>
            {gerandoPdf ? '// gerando...' : 'Baixar PDF'}
          </button>
        </div>
      </div>

      {erro && <div className="error-banner">{erro}</div>}

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {orc.status === 'RASCUNHO' && (
          <button className="btn btn-sm btn-amber" disabled={processando} onClick={enviar}>Enviar ao cliente</button>
        )}
        <button className="btn btn-sm" onClick={() => navigate(`/os/${orc.osId}`)}>Ver OS</button>
        {orc.status !== 'CANCELADO' && (
          <button className="btn btn-sm btn-danger" onClick={() => setModalMotivo({ tipo: 'cancelar' })}>Cancelar</button>
        )}
      </div>

      <div className="section-card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontWeight: 600 }}>Condições</div>
          {orc.status === 'RASCUNHO' && !editando && (
            <button className="btn btn-sm btn-ghost" onClick={() => setEditando(true)}>Editar</button>
          )}
        </div>
        {!editando ? (
          <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><span className="form-label" style={{ display: 'inline' }}>Validade: </span>{formatarData(orc.validade)}</div>
            <div><span className="form-label" style={{ display: 'inline' }}>Condições de pagamento: </span>{orc.condicoesPagamento || '—'}</div>
            <div><span className="form-label" style={{ display: 'inline' }}>Desconto: </span>{formatarMoeda(orc.desconto)}</div>
          </div>
        ) : (
          <CondicoesForm
            inicial={{ validade: orc.validade, condicoesPagamento: orc.condicoesPagamento, desconto: orc.desconto }}
            processando={processando}
            onCancelar={() => setEditando(false)}
            onSalvar={salvarCondicoes}
          />
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontWeight: 600 }}>Itens</div>
        <div className="form-field" style={{ width: 220 }}>
          <select
            className="form-select"
            value={agrupamento}
            onChange={e => setAgrupamento(e.target.value as AgrupamentoOrcamento)}
          >
            <option value="EQUIPAMENTO">Por equipamento</option>
            <option value="ITENS">Por quantidade de itens</option>
          </select>
        </div>
      </div>

      {orc.itens.length === 0 && <div className="empty">Nenhum item agrupado neste orçamento.</div>}

      {agrupamento === 'EQUIPAMENTO' && orc.itens.map(item => (
        <ItemOrcamentoCard
          key={item.id}
          item={item}
          podeEditarPecas={orc.status === 'RASCUNHO'}
          valorMaoDeObraPadrao={valorMaoDeObraPadrao}
          processando={processando}
          onMudou={carregar}
          onAutorizar={() => autorizarItem(item.id)}
          onNaoAutorizar={() => setModalMotivo({ tipo: 'nao-autorizar', itemId: item.id })}
        />
      ))}

      {agrupamento === 'ITENS' && consolidado.length > 0 && (
        <table className="table" style={{ marginBottom: 16 }}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Qtd.</th>
              <th>Valor unit.</th>
              <th>Valor total</th>
            </tr>
          </thead>
          <tbody>
            {consolidado.map(c => (
              <tr key={c.chave}>
                <td>{TIPO_CONSERTO_LABEL[c.tipo]}</td>
                <td>{c.descricao}</td>
                <td>{c.quantidade}</td>
                <td>{formatarMoeda(c.valorUnitario)}</td>
                <td>{formatarMoeda(c.valorTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {agrupamento === 'ITENS' && consolidado.length === 0 && (
        <div className="empty">Nenhum item de conserto neste orçamento.</div>
      )}

      <div className="section-card" style={{ marginTop: 8 }}>
        {totalMaoDeObra.quantidade > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text3)', marginBottom: 6 }}>
            <span>Mão de obra ({totalMaoDeObra.quantidade})</span>
            <span>{formatarMoeda(totalMaoDeObra.valor)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 600 }}>
          <span>Valor total</span>
          <span>{formatarMoeda(orc.valorTotal)}</span>
        </div>
      </div>

      {modalMotivo && (
        <MotivoModal
          titulo={modalMotivo.tipo === 'cancelar' ? 'Cancelar orçamento' : 'Não autorizar item'}
          onClose={() => setModalMotivo(null)}
          onSalvar={modalMotivo.tipo === 'cancelar' ? cancelar : naoAutorizarItem}
          processando={processando}
        />
      )}
    </div>
  )
}

function ItemOrcamentoCard({
  item, podeEditarPecas, valorMaoDeObraPadrao, processando, onMudou, onAutorizar, onNaoAutorizar,
}: {
  item: ItemEntradaDTO
  podeEditarPecas: boolean
  valorMaoDeObraPadrao: number
  processando: boolean
  onMudou: () => void
  onAutorizar: () => void
  onNaoAutorizar: () => void
}) {
  const [pecaPendente, setPecaPendente] = useState<PecaDTO | null>(null)
  const [qtdPendente, setQtdPendente] = useState('1')
  const [valorPendente, setValorPendente] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [editandoValorId, setEditandoValorId] = useState<string | null>(null)
  const [valorEditado, setValorEditado] = useState('')
  const [adicionandoMaoDeObra, setAdicionandoMaoDeObra] = useState(false)
  const [qtdMaoDeObra, setQtdMaoDeObra] = useState('1')
  const [valorMaoDeObra, setValorMaoDeObra] = useState('')
  const [adicionandoAcessorio, setAdicionandoAcessorio] = useState(false)
  const [qtdAcessorio, setQtdAcessorio] = useState('1')
  const [valorAcessorio, setValorAcessorio] = useState('')

  const selecionarPeca = (peca: PecaDTO) => {
    setPecaPendente(peca)
    setValorPendente(peca.valorUnitario ? String(peca.valorUnitario) : '')
  }

  const adicionarPeca = async () => {
    if (!pecaPendente) return
    setSalvando(true)
    setErro(null)
    try {
      await itensEntradaApi.adicionarItemConserto(item.id, {
        tipo: 'PECA',
        itemEstoqueId: pecaPendente.id,
        descricao: pecaPendente.descricao,
        quantidade: Number(qtdPendente) || 1,
        valorUnitario: Number(valorPendente) || 0,
      })
      setPecaPendente(null)
      setQtdPendente('1')
      setValorPendente('')
      onMudou()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErro(msg ?? 'Não foi possível adicionar a peça.')
    } finally {
      setSalvando(false)
    }
  }

  const abrirMaoDeObra = () => {
    setQtdMaoDeObra('1')
    setValorMaoDeObra(valorMaoDeObraPadrao > 0 ? String(valorMaoDeObraPadrao) : '')
    setAdicionandoMaoDeObra(true)
  }

  const adicionarMaoDeObra = async () => {
    setSalvando(true)
    setErro(null)
    try {
      await itensEntradaApi.adicionarItemConserto(item.id, {
        tipo: 'MAO_DE_OBRA',
        descricao: 'Mão de obra',
        quantidade: Number(qtdMaoDeObra) || 1,
        valorUnitario: Number(valorMaoDeObra) || 0,
      })
      setAdicionandoMaoDeObra(false)
      onMudou()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErro(msg ?? 'Não foi possível adicionar a mão de obra.')
    } finally {
      setSalvando(false)
    }
  }

  const abrirAcessorio = () => {
    setQtdAcessorio('1')
    setValorAcessorio(item.catalogoValorReferencia ? String(item.catalogoValorReferencia) : '')
    setAdicionandoAcessorio(true)
  }

  const adicionarAcessorio = async () => {
    setSalvando(true)
    setErro(null)
    try {
      await itensEntradaApi.adicionarItemConserto(item.id, {
        tipo: 'PECA',
        descricao: `${item.descricao} (novo)`,
        quantidade: Number(qtdAcessorio) || 1,
        valorUnitario: Number(valorAcessorio) || 0,
      })
      setAdicionandoAcessorio(false)
      onMudou()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErro(msg ?? 'Não foi possível adicionar o acessório.')
    } finally {
      setSalvando(false)
    }
  }

  const removerItemConserto = async (itemConsertoId: string) => {
    setSalvando(true)
    setErro(null)
    try {
      await itensEntradaApi.removerItemConserto(item.id, itemConsertoId)
      onMudou()
    } catch {
      setErro('Não foi possível remover o item.')
    } finally {
      setSalvando(false)
    }
  }

  const abrirEdicaoValor = (itemConsertoId: string, valorAtual: number) => {
    setEditandoValorId(itemConsertoId)
    setValorEditado(valorAtual > 0 ? String(valorAtual) : '')
  }

  const salvarValor = async (itemConsertoId: string) => {
    setSalvando(true)
    setErro(null)
    try {
      await itensEntradaApi.atualizarValorItemConserto(item.id, itemConsertoId, Number(valorEditado) || 0)
      setEditandoValorId(null)
      onMudou()
    } catch {
      setErro('Não foi possível salvar o valor.')
    } finally {
      setSalvando(false)
    }
  }

  const podeAprovar = item.status === 'PENDENTE_AUTORIZACAO' || item.status === 'NAO_AUTORIZADO'

  const itensConsertoOrdenados = [...item.itensConserto].sort((a, b) =>
    (a.tipo === 'MAO_DE_OBRA' ? 1 : 0) - (b.tipo === 'MAO_DE_OBRA' ? 1 : 0)
  )
  const maoDeObraDoItem = item.itensConserto.filter(ic => ic.tipo === 'MAO_DE_OBRA')
  const totalMaoDeObraItem = {
    quantidade: maoDeObraDoItem.reduce((s, ic) => s + ic.quantidade, 0),
    valor: maoDeObraDoItem.reduce((s, ic) => s + ic.valorTotal, 0),
  }

  return (
    <div className="section-card" style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 600 }}>{item.descricao}</div>
          <div className="page-sub">
            {[item.marca, item.modelo].filter(Boolean).join(' / ') || '—'}
            {item.numeroSerie ? ` · S/N ${item.numeroSerie}` : ''}
          </div>
        </div>
        {item.resultadoAvaliacao && (
          <span className="badge b-blue">{RESULTADO_AVALIACAO_LABEL[item.resultadoAvaliacao]}</span>
        )}
      </div>

      {item.defeitoEncontrado && (
        <div style={{ fontSize: 13, marginBottom: 4 }}>
          <span className="form-label" style={{ display: 'inline' }}>Defeito encontrado: </span>{item.defeitoEncontrado}
        </div>
      )}

      {erro && <div className="error-banner">{erro}</div>}

      {item.itensConserto.length > 0 && (
        <table className="table" style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Qtd.</th>
              <th>Valor unit.</th>
              <th>Valor total</th>
              {podeEditarPecas && <th></th>}
            </tr>
          </thead>
          <tbody>
            {itensConsertoOrdenados.map(ic => (
              <tr key={ic.id}>
                <td>{TIPO_CONSERTO_LABEL[ic.tipo]}</td>
                <td>{ic.descricao || '—'}</td>
                <td>{ic.quantidade}</td>
                <td>
                  {podeEditarPecas && editandoValorId === ic.id ? (
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input
                        type="number" min={0} step="0.01" autoFocus
                        className="form-input" style={{ width: 90, padding: '2px 6px' }}
                        value={valorEditado} onChange={e => setValorEditado(e.target.value)}
                      />
                      <button type="button" className="btn btn-sm btn-amber" disabled={salvando} onClick={() => salvarValor(ic.id)}>OK</button>
                    </div>
                  ) : podeEditarPecas ? (
                    <span
                      style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                      title="Clique para definir o valor"
                      onClick={() => abrirEdicaoValor(ic.id, ic.valorUnitario)}
                    >
                      {ic.valorUnitario > 0 ? formatarMoeda(ic.valorUnitario) : '— definir valor'}
                    </span>
                  ) : (
                    formatarMoeda(ic.valorUnitario)
                  )}
                </td>
                <td>{formatarMoeda(ic.valorTotal)}</td>
                {podeEditarPecas && (
                  <td>
                    <button
                      type="button" className="btn btn-sm btn-ghost" disabled={salvando}
                      onClick={() => removerItemConserto(ic.id)}
                    >✕</button>
                  </td>
                )}
              </tr>
            ))}
            {maoDeObraDoItem.length > 0 && (
              <tr>
                <td colSpan={2} style={{ textAlign: 'right', color: 'var(--text3)' }}>Mão de obra</td>
                <td style={{ color: 'var(--text3)' }}>{totalMaoDeObraItem.quantidade}</td>
                <td></td>
                <td style={{ color: 'var(--text3)' }}>{formatarMoeda(totalMaoDeObraItem.valor)}</td>
                {podeEditarPecas && <td></td>}
              </tr>
            )}
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>Total do item</td>
              <td style={{ fontWeight: 600 }}>{formatarMoeda(item.valorTotalConserto)}</td>
              {podeEditarPecas && <td></td>}
            </tr>
          </tbody>
        </table>
      )}

      {item.resultadoAvaliacao === 'SEM_CONSERTO' && item.catalogoValorReferencia != null && (
        <div style={{ fontSize: 12, color: 'var(--amber)', fontStyle: 'italic', marginTop: 6 }}>
          Sem conserto — valor de referência de um item novo: {formatarMoeda(item.catalogoValorReferencia)}
        </div>
      )}

      {podeEditarPecas && (
        <div style={{ marginTop: 10 }}>
          {item.tipoItem === 'ACESSORIO' ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <button type="button" className={`btn btn-sm${adicionandoAcessorio ? ' btn-amber' : ''}`} onClick={() => (adicionandoAcessorio ? setAdicionandoAcessorio(false) : abrirAcessorio())}>
                + Acessório novo
              </button>
              {adicionandoAcessorio && (
                <>
                  <div className="form-field" style={{ width: 90 }}>
                    <label className="form-label">Qtd.</label>
                    <input type="number" min={1} className="form-input" value={qtdAcessorio} onChange={e => setQtdAcessorio(e.target.value)} />
                  </div>
                  <div className="form-field" style={{ width: 140 }}>
                    <label className="form-label">Valor (R$)</label>
                    <input type="number" min={0} step="0.01" className="form-input" value={valorAcessorio} onChange={e => setValorAcessorio(e.target.value)} />
                  </div>
                  <button type="button" className="btn btn-sm btn-amber" disabled={salvando} onClick={adicionarAcessorio}>
                    {salvando ? '// salvando...' : 'OK'}
                  </button>
                </>
              )}
            </div>
          ) : (
            <>
              <PecaCompativelSelector catalogoModeloId={item.catalogoModeloId} onSelecionar={selecionarPeca} />

              {pecaPendente && (
                <div className="section-card" style={{ marginTop: 8, background: 'var(--bg3)' }}>
                  <div style={{ fontSize: 13, marginBottom: 8 }}>{pecaPendente.descricao}</div>
                  <div className="form-row form-row-2" style={{ marginBottom: 8 }}>
                    <div className="form-field">
                      <label className="form-label">Quantidade</label>
                      <input type="number" min={1} className="form-input" value={qtdPendente} onChange={e => setQtdPendente(e.target.value)} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Valor unitário (R$)</label>
                      <input type="number" min={0} step="0.01" className="form-input" value={valorPendente} onChange={e => setValorPendente(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => setPecaPendente(null)}>Cancelar</button>
                    <button type="button" className="btn btn-sm btn-amber" disabled={salvando} onClick={adicionarPeca}>
                      {salvando ? '// salvando...' : 'Adicionar'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', marginTop: 8, flexWrap: 'wrap' }}>
            <button type="button" className={`btn btn-sm${adicionandoMaoDeObra ? ' btn-amber' : ''}`} onClick={() => (adicionandoMaoDeObra ? setAdicionandoMaoDeObra(false) : abrirMaoDeObra())}>
              + Adicionar mão de obra
            </button>
            {adicionandoMaoDeObra && (
              <>
                <div className="form-field" style={{ width: 90 }}>
                  <label className="form-label">Qtd.</label>
                  <input type="number" min={1} className="form-input" value={qtdMaoDeObra} onChange={e => setQtdMaoDeObra(e.target.value)} />
                </div>
                <div className="form-field" style={{ width: 140 }}>
                  <label className="form-label">Valor (R$)</label>
                  <input type="number" min={0} step="0.01" className="form-input" value={valorMaoDeObra} onChange={e => setValorMaoDeObra(e.target.value)} />
                </div>
                <button type="button" className="btn btn-sm btn-amber" disabled={salvando} onClick={adicionarMaoDeObra}>
                  {salvando ? '// salvando...' : 'OK'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {podeAprovar && (
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button className="btn btn-sm btn-green" disabled={processando} onClick={onAutorizar}>
            {item.status === 'NAO_AUTORIZADO' ? 'Reautorizar' : 'Autorizar'}
          </button>
          {item.status === 'PENDENTE_AUTORIZACAO' && (
            <button className="btn btn-sm btn-danger" disabled={processando} onClick={onNaoAutorizar}>Não autorizar</button>
          )}
        </div>
      )}
    </div>
  )
}

function CondicoesForm({
  inicial, processando, onCancelar, onSalvar,
}: {
  inicial: AtualizarOrcamentoRequest
  processando: boolean
  onCancelar: () => void
  onSalvar: (dados: AtualizarOrcamentoRequest) => void
}) {
  const { register, handleSubmit } = useForm<{ validade: string; condicoesPagamento: string; desconto: number }>({
    defaultValues: {
      validade: inicial.validade ? inicial.validade.slice(0, 10) : '',
      condicoesPagamento: inicial.condicoesPagamento ?? '',
      desconto: inicial.desconto ?? 0,
    },
  })

  const onSubmit = handleSubmit(d =>
    onSalvar({
      validade: d.validade || undefined,
      condicoesPagamento: d.condicoesPagamento || undefined,
      desconto: Number(d.desconto),
    })
  )

  return (
    <form onSubmit={onSubmit}>
      <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
        <div className="form-field">
          <label className="form-label">Validade</label>
          <input type="date" className="form-input" {...register('validade')} />
        </div>
        <div className="form-field">
          <label className="form-label">Desconto (R$)</label>
          <input type="number" min={0} step="0.01" className="form-input" {...register('desconto')} />
        </div>
      </div>
      <div className="form-field" style={{ marginBottom: 12 }}>
        <label className="form-label">Condições de pagamento</label>
        <textarea className="form-input" rows={2} {...register('condicoesPagamento')} />
      </div>
      <div className="modal-footer" style={{ justifyContent: 'flex-start' }}>
        <button type="submit" className="btn btn-sm btn-amber" disabled={processando}>Salvar</button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  )
}

function MotivoModal({
  titulo, onClose, onSalvar, processando,
}: {
  titulo: string
  onClose: () => void
  onSalvar: (motivo: string) => void
  processando: boolean
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<{ motivo: string }>()

  return (
    <Modal title={titulo} onClose={onClose}>
      <form onSubmit={handleSubmit(d => onSalvar(d.motivo))}>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Motivo</label>
          <textarea
            className={`form-input${errors.motivo ? ' error' : ''}`}
            rows={3}
            {...register('motivo', { required: 'Motivo obrigatório' })}
          />
          {errors.motivo && <span className="form-error">{errors.motivo.message}</span>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Voltar</button>
          <button type="submit" className="btn btn-danger" disabled={processando}>Confirmar</button>
        </div>
      </form>
    </Modal>
  )
}
