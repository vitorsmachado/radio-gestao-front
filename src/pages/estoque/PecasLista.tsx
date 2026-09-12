import { useEffect, useState } from 'react'
import { catalogoApi } from '../../api/catalogo'
import { pecasApi } from '../../api/pecas'
import PecaForm from './PecaForm'
import type { CatalogoModeloDTO } from '../../types/catalogo'
import type { CriticidadeEstoque, PecaDTO } from '../../types/peca'
import type { PageResponse } from '../../types/pagination'

export default function PecasLista() {
  const [pagina, setPagina] = useState<PageResponse<PecaDTO> | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const [criticidade, setCriticidade] = useState<CriticidadeEstoque | ''>('')

  const [buscaModelo, setBuscaModelo] = useState('')
  const [modeloFiltro, setModeloFiltro] = useState<CatalogoModeloDTO | null>(null)
  const [sugestoesModelo, setSugestoesModelo] = useState<CatalogoModeloDTO[]>([])

  const [modalNovo, setModalNovo] = useState(false)

  const carregar = () => {
    setCarregando(true)
    setErro(null)
    pecasApi
      .listar({
        page,
        criticidade: criticidade || undefined,
        modeloCompativelId: modeloFiltro?.id,
      })
      .then(setPagina)
      .catch(() => setErro('Não foi possível carregar as peças.'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [page, criticidade, modeloFiltro])

  useEffect(() => {
    if (buscaModelo.trim().length < 2) {
      setSugestoesModelo([])
      return
    }
    const t = setTimeout(() => {
      catalogoApi
        .listar({ busca: buscaModelo.trim(), tipoItem: 'EQUIPAMENTO' })
        .then(res => setSugestoesModelo(res.content))
        .catch(() => setSugestoesModelo([]))
    }, 300)
    return () => clearTimeout(t)
  }, [buscaModelo])

  const criticidadeBadge = (peca: PecaDTO) => {
    if (peca.emFalta) return <span className="badge b-red">Em falta</span>
    if (peca.estoqueBaixo) return <span className="badge b-amber">Estoque baixo</span>
    return <span className="badge b-green">OK</span>
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Peças</div>
          <div className="page-sub">// {pagina?.totalElements ?? 0} cadastradas</div>
        </div>
        <div className="no-print" style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => window.print()}>Imprimir</button>
          <button className="btn btn-amber" onClick={() => setModalNovo(true)}>+ Nova peça</button>
        </div>
      </div>

      <div className="no-print" style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div className="form-field" style={{ width: 200 }}>
          <label className="form-label">Criticidade</label>
          <select
            className="form-select"
            value={criticidade}
            onChange={e => { setCriticidade(e.target.value as CriticidadeEstoque | ''); setPage(0) }}
          >
            <option value="">Todas</option>
            <option value="EM_FALTA">Em falta</option>
            <option value="ESTOQUE_BAIXO">Estoque baixo</option>
          </select>
        </div>

        <div className="form-field" style={{ width: 320, position: 'relative' }}>
          <label className="form-label">Compatível com equipamento</label>
          {modeloFiltro ? (
            <div className="form-input" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{modeloFiltro.marca} {modeloFiltro.modelo}</span>
              <span
                style={{ cursor: 'pointer', color: 'var(--text3)' }}
                onClick={() => { setModeloFiltro(null); setBuscaModelo(''); setPage(0) }}
              >✕</span>
            </div>
          ) : (
            <input
              className="form-input"
              placeholder="Buscar equipamento..."
              value={buscaModelo}
              onChange={e => setBuscaModelo(e.target.value)}
            />
          )}
          {!modeloFiltro && sugestoesModelo.length > 0 && (
            <div className="section-card" style={{ position: 'absolute', zIndex: 10, width: '100%', marginTop: 4, padding: 6 }}>
              {sugestoesModelo.map(m => (
                <div
                  key={m.id}
                  style={{ padding: '6px 4px', cursor: 'pointer', fontSize: 13 }}
                  onClick={() => { setModeloFiltro(m); setSugestoesModelo([]); setPage(0) }}
                >
                  {m.marca} {m.modelo}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {erro && <div className="error-banner">{erro}</div>}

      {carregando && <div className="loading">Carregando</div>}

      {!carregando && !erro && pagina && pagina.content.length === 0 && (
        <div className="empty">Nenhuma peça encontrada.</div>
      )}

      {!carregando && !erro && pagina && pagina.content.length > 0 && (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Saldo</th>
                <th>Mínimo</th>
                <th>Compatível com</th>
                <th>Situação</th>
              </tr>
            </thead>
            <tbody>
              {pagina.content.map(peca => (
                <tr key={peca.id}>
                  <td>{peca.codigo}</td>
                  <td>{peca.descricao}</td>
                  <td>{peca.quantidadeDisponivel}</td>
                  <td>{peca.quantidadeMinima ?? '—'}</td>
                  <td>
                    {peca.modelosCompativeis.length === 0
                      ? '—'
                      : peca.modelosCompativeis.map(m => `${m.marca} ${m.modelo}`).join(', ')}
                  </td>
                  <td>{criticidadeBadge(peca)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="footer-actions no-print">
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

      {modalNovo && (
        <PecaForm
          onClose={() => setModalNovo(false)}
          onSalvo={() => { setModalNovo(false); carregar() }}
        />
      )}
    </div>
  )
}
