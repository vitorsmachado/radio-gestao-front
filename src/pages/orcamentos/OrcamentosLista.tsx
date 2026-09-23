import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { orcamentosApi } from '../../api/orcamentos'
import {
  STATUS_APROVACAO_BADGE,
  STATUS_APROVACAO_LABEL,
  STATUS_ORCAMENTO_BADGE,
  STATUS_ORCAMENTO_LABEL,
  type OrcamentoResumoDTO,
  type StatusOrcamento,
} from '../../types/orcamento'
import type { PageResponse } from '../../types/pagination'

function formatarMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarDataHora(data?: string): string {
  if (!data) return ''
  return new Date(data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function OrcamentosLista() {
  const navigate = useNavigate()
  const [pagina, setPagina] = useState<PageResponse<OrcamentoResumoDTO> | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const [busca, setBusca] = useState('')
  const [buscaAplicada, setBuscaAplicada] = useState('')
  const [status, setStatus] = useState<StatusOrcamento | ''>('')

  useEffect(() => {
    setCarregando(true)
    setErro(null)
    orcamentosApi
      .listar({ page, busca: buscaAplicada.trim() || undefined, status: status || undefined })
      .then(setPagina)
      .catch(() => setErro('Não foi possível carregar os orçamentos.'))
      .finally(() => setCarregando(false))
  }, [page, buscaAplicada, status])

  const onBuscar = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
    setBuscaAplicada(busca)
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Orçamentos</div>
          <div className="page-sub">// {pagina?.totalElements ?? 0} no total</div>
        </div>
      </div>

      <form onSubmit={onBuscar} style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div className="form-field" style={{ flex: 1, minWidth: 220 }}>
          <label className="form-label">Buscar</label>
          <input
            className="form-input"
            placeholder="Número da OS, nome do cliente ou N/S do item..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </div>
        <div className="form-field" style={{ width: 200 }}>
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={status}
            onChange={e => { setStatus(e.target.value as StatusOrcamento | ''); setPage(0) }}
          >
            <option value="">Todos</option>
            <option value="RASCUNHO">Rascunho</option>
            <option value="ENVIADO">Enviado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
        </div>
        <button className="btn btn-amber" type="submit">Buscar</button>
      </form>

      {erro && <div className="error-banner">{erro}</div>}

      {carregando && <div className="loading">Carregando</div>}

      {!carregando && !erro && pagina && pagina.content.length === 0 && (
        <div className="empty">Nenhum orçamento encontrado.</div>
      )}

      {!carregando && !erro && pagina && pagina.content.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pagina.content.map(orc => (
              <div
                key={orc.id}
                className="section-card"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/orcamentos/${orc.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {orc.numero}
                      {orc.osNumero && <span style={{ color: 'var(--text3)', fontWeight: 400 }}> ↳ OS {orc.osNumero}</span>}
                    </div>
                    <div className="page-sub">{orc.clienteNome ?? '—'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>{orc.resumoItens}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>{formatarMoeda(orc.valorTotal)}</div>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 4, flexWrap: 'wrap' }}>
                      <span className={`badge ${STATUS_ORCAMENTO_BADGE[orc.status]}`}>{STATUS_ORCAMENTO_LABEL[orc.status]}</span>
                      <span className={`badge ${STATUS_APROVACAO_BADGE[orc.statusAprovacao]}`}>{STATUS_APROVACAO_LABEL[orc.statusAprovacao]}</span>
                      {orc.expirado && <span className="badge b-red">Expirado</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                      Emitido em: {formatarDataHora(orc.dataEmissao)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

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
    </div>
  )
}
