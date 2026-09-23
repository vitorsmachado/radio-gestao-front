import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { notificacoesApi } from '../../api/notificacoes'
import { TIPO_NOTIFICACAO_LABEL, type NotificacaoDTO } from '../../types/notificacao'
import type { PageResponse } from '../../types/pagination'

function formatarDataHora(data: string): string {
  return new Date(data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function NotificacoesLista() {
  const navigate = useNavigate()
  const [pagina, setPagina] = useState<PageResponse<NotificacaoDTO> | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [apenasNaoLidas, setApenasNaoLidas] = useState(true)

  useEffect(() => {
    setCarregando(true)
    setErro(null)
    notificacoesApi
      .listar({ page, lida: apenasNaoLidas ? false : undefined })
      .then(setPagina)
      .catch(() => setErro('Não foi possível carregar as notificações.'))
      .finally(() => setCarregando(false))
  }, [page, apenasNaoLidas])

  const abrir = async (notificacao: NotificacaoDTO) => {
    if (!notificacao.lida) {
      try {
        await notificacoesApi.marcarComoLida(notificacao.id)
      } catch {
        // não crítico — segue navegando mesmo se falhar
      }
    }
    if (notificacao.link) navigate(notificacao.link)
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Notificações</div>
          <div className="page-sub">// {pagina?.totalElements ?? 0} no total</div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={apenasNaoLidas}
            onChange={e => { setApenasNaoLidas(e.target.checked); setPage(0) }}
          />
          Só não lidas
        </label>
      </div>

      {erro && <div className="error-banner">{erro}</div>}

      {carregando && <div className="loading">Carregando</div>}

      {!carregando && !erro && pagina && pagina.content.length === 0 && (
        <div className="empty">Nenhuma notificação.</div>
      )}

      {!carregando && !erro && pagina && pagina.content.length > 0 && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pagina.content.map(n => (
              <div
                key={n.id}
                className="section-card"
                style={{ cursor: n.link ? 'pointer' : 'default', opacity: n.lida ? 0.6 : 1 }}
                onClick={() => abrir(n)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{n.titulo}</div>
                    {n.mensagem && <div className="page-sub" style={{ marginTop: 4 }}>{n.mensagem}</div>}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span className="badge b-amber">{TIPO_NOTIFICACAO_LABEL[n.tipo]}</span>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{formatarDataHora(n.dataCriacao)}</div>
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
