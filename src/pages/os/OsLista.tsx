import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { osApi } from '../../api/os'
import Modal from '../../components/Modal'
import type { OrdemServicoResumoDTO, StatusOS } from '../../types/os'
import type { PageResponse } from '../../types/pagination'

type Ordenacao = 'numero' | 'atualizacao' | 'abertura'

const ORDENACAO_PARAM: Record<Ordenacao, string> = {
  numero: 'numero,desc',
  atualizacao: 'dataAtualizacao,desc',
  abertura: 'dataAbertura,desc',
}

const STATUS_LABEL: Record<StatusOS, string> = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
}

const STATUS_BADGE: Record<StatusOS, string> = {
  ABERTA: 'b-blue',
  EM_ANDAMENTO: 'b-amber',
  CONCLUIDA: 'b-green',
  CANCELADA: 'b-red',
}

function formatarDocumento(doc?: string): string {
  if (!doc) return ''
  if (doc.length === 11) return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (doc.length === 14) return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return doc
}

function formatarDataHora(data?: string): string {
  if (!data) return ''
  return new Date(data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function OsLista() {
  const navigate = useNavigate()
  const [pagina, setPagina] = useState<PageResponse<OrdemServicoResumoDTO> | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const [busca, setBusca] = useState('')
  const [buscaAplicada, setBuscaAplicada] = useState('')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('numero')

  const [modoSelecao, setModoSelecao] = useState(false)
  const [selecionadas, setSelecionadas] = useState<string[]>([])
  const [modalUnir, setModalUnir] = useState(false)

  useEffect(() => {
    setCarregando(true)
    setErro(null)
    osApi
      .listar({
        page,
        busca: buscaAplicada.trim() || undefined,
        dataInicial: dataInicial || undefined,
        dataFinal: dataFinal || undefined,
        sort: ORDENACAO_PARAM[ordenacao],
      })
      .then(setPagina)
      .catch(() => setErro('Não foi possível carregar as ordens de serviço.'))
      .finally(() => setCarregando(false))
  }, [page, buscaAplicada, dataInicial, dataFinal, ordenacao])

  const onBuscar = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    setBuscaAplicada(busca)
  }

  const toggleModoSelecao = () => {
    setModoSelecao(m => !m)
    setSelecionadas([])
  }

  const alternarSelecao = (os: OrdemServicoResumoDTO) =>
    setSelecionadas(prev => (prev.includes(os.id) ? prev.filter(id => id !== os.id) : [...prev, os.id]))

  const clienteTravado = pagina?.content.find(os => selecionadas.includes(os.id))?.clienteId

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Ordens de Serviço</div>
          <div className="page-sub">// {pagina?.totalElements ?? 0} no total</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {selecionadas.length >= 2 && (
            <button className="btn btn-sm btn-amber" onClick={() => setModalUnir(true)}>
              Unir selecionadas ({selecionadas.length})
            </button>
          )}
          <button className="btn btn-sm" onClick={toggleModoSelecao}>
            {modoSelecao ? 'Cancelar seleção' : 'Selecionar'}
          </button>
          <button className="btn btn-amber" onClick={() => navigate('/os/novo')}>+ Nova OS</button>
        </div>
      </div>

      <form onSubmit={onBuscar} style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-field" style={{ flex: 1, minWidth: 220 }}>
          <label className="form-label">Buscar</label>
          <input
            className="form-input"
            placeholder="Número, N/S, código do cliente ou nome/CPF/CNPJ..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <div className="form-field" style={{ width: 160 }}>
          <label className="form-label">De</label>
          <input type="date" className="form-input" value={dataInicial} onChange={e => { setDataInicial(e.target.value); setPage(0) }} />
        </div>
        <div className="form-field" style={{ width: 160 }}>
          <label className="form-label">Até</label>
          <input type="date" className="form-input" value={dataFinal} onChange={e => { setDataFinal(e.target.value); setPage(0) }} />
        </div>
        <div className="form-field" style={{ width: 180 }}>
          <label className="form-label">Ordenar por</label>
          <select
            className="form-select"
            value={ordenacao}
            onChange={e => { setOrdenacao(e.target.value as Ordenacao); setPage(0) }}
          >
            <option value="numero">Número (mais recente)</option>
            <option value="atualizacao">Última atualização</option>
            <option value="abertura">Data de abertura</option>
          </select>
        </div>
        <button className="btn btn-amber" type="submit">Buscar</button>
      </form>

      {erro && <div className="error-banner">{erro}</div>}

      {carregando && <div className="loading">Carregando</div>}

      {!carregando && !erro && pagina && pagina.content.length === 0 && (
        <div className="empty">Nenhuma OS encontrada.</div>
      )}

      {!carregando && !erro && pagina && pagina.content.length > 0 && (
        <>
          <table className="table">
            <thead>
              <tr>
                {modoSelecao && <th></th>}
                <th>Número</th>
                <th>Cliente</th>
                <th>Solicitante</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pagina.content.map(os => {
                const podeUnir = os.status !== 'CONCLUIDA' && os.status !== 'CANCELADA'
                const bloqueadaPorCliente = !!clienteTravado && os.clienteId !== clienteTravado
                return (
                  <tr key={os.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/os/${os.id}`)}>
                    {modoSelecao && (
                      <td onClick={e => e.stopPropagation()}>
                        {podeUnir && (
                          <input
                            type="checkbox"
                            checked={selecionadas.includes(os.id)}
                            disabled={bloqueadaPorCliente}
                            title={bloqueadaPorCliente ? 'Unir só funciona entre OS do mesmo cliente' : undefined}
                            onChange={() => alternarSelecao(os)}
                          />
                        )}
                      </td>
                    )}
                    <td>{os.numero}</td>
                    <td>
                      {os.clienteNome ?? '—'}
                      {os.clienteDocumento && (
                        <span style={{ color: 'var(--text3)' }}> ({formatarDocumento(os.clienteDocumento)})</span>
                      )}
                    </td>
                    <td>{os.solicitante ?? '—'}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[os.status]}`}>{STATUS_LABEL[os.status]}</span>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                        Aberta em: {formatarDataHora(os.dataAbertura)}
                        {os.dataAtualizacao && os.dataAtualizacao !== os.dataAbertura && (
                          <><br />Atualizada em: {formatarDataHora(os.dataAtualizacao)}</>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="footer-actions">
            <div className="footer-left">
              <span className="page-sub">
                Página {pagina.number + 1} de {Math.max(pagina.totalPages, 1)}
              </span>
            </div>
            <div className="footer-right">
              <button className="btn btn-sm" disabled={pagina.number === 0} onClick={() => setPage(p => p - 1)}>
                ← Anterior
              </button>
              <button className="btn btn-sm" disabled={pagina.number + 1 >= pagina.totalPages} onClick={() => setPage(p => p + 1)}>
                Próxima →
              </button>
            </div>
          </div>
        </>
      )}

      {modalUnir && (
        <UnirOSModal
          quantidade={selecionadas.length}
          onClose={() => setModalUnir(false)}
          onConfirmar={async solicitante => {
            const novaOS = await osApi.unir({ osOrigemIds: selecionadas, solicitante })
            navigate(`/os/${novaOS.id}`)
          }}
        />
      )}
    </div>
  )
}

function UnirOSModal({
  quantidade, onClose, onConfirmar,
}: {
  quantidade: number
  onClose: () => void
  onConfirmar: (solicitante?: string) => Promise<void>
}) {
  const [solicitante, setSolicitante] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const confirmar = async () => {
    setSalvando(true)
    setErro(null)
    try {
      await onConfirmar(solicitante.trim() || undefined)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível unir as OS.'
      setErro(msg)
      setSalvando(false)
    }
  }

  return (
    <Modal
      title="Unir OS"
      subtitle={`Cria uma OS nova com os itens das ${quantidade} OS selecionadas. As origens ficam canceladas, apontando pra OS nova.`}
      onClose={onClose}
    >
      {erro && <div className="error-banner">{erro}</div>}

      <div className="form-field" style={{ marginBottom: 12 }}>
        <label className="form-label">Solicitante (opcional)</label>
        <input className="form-input" value={solicitante} onChange={e => setSolicitante(e.target.value)} />
      </div>

      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-amber" disabled={salvando} onClick={confirmar}>
          {salvando ? '// unindo...' : 'Unir'}
        </button>
      </div>
    </Modal>
  )
}
