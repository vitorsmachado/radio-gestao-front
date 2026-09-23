import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { clientesApi } from '../../api/clientes'
import { itensEntradaApi } from '../../api/itensEntrada'
import { itensEntradaAvaliacaoApi, osApi } from '../../api/os'
import PecaCompativelSelector from '../../components/PecaCompativelSelector'
import SugestaoTextArea from '../../components/SugestaoTextArea'
import ItemEntradaCard from '../os/ItemEntradaCard'
import type { ClienteDTO } from '../../types/cliente'
import type { ItemEntradaDTO, OrdemServicoDTO, ResultadoAvaliacao } from '../../types/os'
import { RESULTADO_AVALIACAO_LABEL } from '../../types/os'
import type { PecaDTO } from '../../types/peca'

const RESULTADOS: ResultadoAvaliacao[] = ['AJUSTE', 'ORCAMENTO', 'SEM_DEFEITO', 'SEM_CONSERTO']

function formatarMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function AvaliacaoOS() {
  const { osId } = useParams<{ osId: string }>()
  const navigate = useNavigate()
  const [os, setOs] = useState<OrdemServicoDTO | null>(null)
  const [cliente, setCliente] = useState<ClienteDTO | null>(null)
  const [itens, setItens] = useState<ItemEntradaDTO[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = () => {
    if (!osId) return
    setCarregando(true)
    setErro(null)
    Promise.all([osApi.buscarPorId(osId), itensEntradaApi.listarPorOS(osId)])
      .then(([osData, itensData]) => {
        setOs(osData)
        setItens(itensData)
        return clientesApi.buscarPorId(osData.clienteId)
      })
      .then(setCliente)
      .catch(() => setErro('Não foi possível carregar a OS.'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [osId])

  const atualizarItem = (atualizado: ItemEntradaDTO) =>
    setItens(prev => prev.map(i => (i.id === atualizado.id ? atualizado : i)))

  if (carregando) return <div className="loading">Carregando</div>
  if (erro || !os) return <div className="error-banner">{erro ?? 'OS não encontrada.'}</div>

  return (
    <div className="fade-in">
      <div className="breadcrumb">
        <span className="crumb" onClick={() => navigate('/manutencao')}>Manutenções</span>
        <span className="sep">/</span>
        <span className="current">{os.numero}</span>
      </div>

      <div className="page-header">
        <div>
          <div className="page-title">{os.numero}</div>
          <div className="page-sub">{cliente?.nomeRazaoSocial ?? '—'}</div>
        </div>
      </div>

      {itens.map(item => (
        item.status === 'PENDENTE_AVALIACAO' || item.status === 'EM_AVALIACAO'
          ? <AvaliacaoItemCard key={item.id} item={item} onAtualizado={atualizarItem} />
          : <ItemEntradaCard key={item.id} item={item} onAtualizado={atualizarItem} />
      ))}
    </div>
  )
}

function AvaliacaoItemCard({ item, onAtualizado }: { item: ItemEntradaDTO; onAtualizado: (i: ItemEntradaDTO) => void }) {
  const [expandido, setExpandido] = useState(false)
  const [resultado, setResultado] = useState<ResultadoAvaliacao>(item.resultadoAvaliacao ?? 'ORCAMENTO')
  const [detalheAjuste, setDetalheAjuste] = useState(item.detalheAjuste ?? '')
  const [defeitoEncontrado, setDefeitoEncontrado] = useState(item.defeitoEncontrado ?? item.avaliacaoTecnica ?? '')
  const [causaDefeito, setCausaDefeito] = useState(item.causaDefeito ?? '')
  const [solucaoRecomendada, setSolucaoRecomendada] = useState(item.solucaoRecomendada ?? '')
  const [observacoesTecnicas, setObservacoesTecnicas] = useState(item.observacoesTecnicas ?? '')
  const [garantia, setGarantia] = useState(item.garantia)
  const [pecaPendente, setPecaPendente] = useState<PecaDTO | null>(null)
  const [qtdPendente, setQtdPendente] = useState('1')
  const [valorPendente, setValorPendente] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [adicionandoPeca, setAdicionandoPeca] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

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
        valorUnitario: Number(valorPendente) || 0,
      })
      onAtualizado(atualizado)
      setPecaPendente(null)
      setQtdPendente('1')
      setValorPendente('')
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErro(msg ?? 'Não foi possível adicionar a peça.')
    } finally {
      setAdicionandoPeca(false)
    }
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
        garantia,
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

  const precisaPecas = resultado === 'ORCAMENTO' || resultado === 'SEM_CONSERTO'

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

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={garantia} onChange={e => setGarantia(e.target.checked)} />
            Em garantia
          </label>

          {resultado === 'AJUSTE' && (
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label className="form-label">Qual o ajuste</label>
              <input className="form-input" value={detalheAjuste} onChange={e => setDetalheAjuste(e.target.value)} />
            </div>
          )}

          {precisaPecas && (
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label className="form-label">Peças</label>
              <PecaCompativelSelector catalogoModeloId={item.catalogoModeloId} onSelecionar={setPecaPendente} />

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
                      <th>Valor unit.</th>
                      <th>Valor total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.itensConserto.map(ic => (
                      <tr key={ic.id}>
                        <td>{ic.descricao || '—'}</td>
                        <td>{ic.quantidade}</td>
                        <td>{formatarMoeda(ic.valorUnitario)}</td>
                        <td>{formatarMoeda(ic.valorTotal)}</td>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-amber" disabled={salvando} onClick={salvar}>
              {salvando ? '// salvando...' : 'Salvar avaliação'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
