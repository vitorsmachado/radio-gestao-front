import { useEffect, useState } from 'react'
import { catalogoApi } from '../../api/catalogo'
import CatalogoForm from './CatalogoForm'
import type { CatalogoModeloDTO, StatusCatalogo } from '../../types/catalogo'
import type { PageResponse } from '../../types/pagination'
import type { TipoItem } from '../../types/os'

const TIPO_LABEL: Record<TipoItem, string> = {
  EQUIPAMENTO: 'Equipamento',
  ACESSORIO: 'Acessório',
  PECA: 'Peça',
  SERVICO: 'Serviço',
}

const STATUS_BADGE: Record<StatusCatalogo, string> = {
  ATIVO: 'b-green',
  INATIVO: 'b-gray',
  OBSOLETO: 'b-red',
}

function formatarValor(valor?: number): string {
  if (valor == null) return '—'
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CatalogoLista() {
  const [pagina, setPagina] = useState<PageResponse<CatalogoModeloDTO> | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const [busca, setBusca] = useState('')
  const [tipoItem, setTipoItem] = useState<TipoItem | ''>('')
  const [status, setStatus] = useState<StatusCatalogo | ''>('')

  const [modalItem, setModalItem] = useState<CatalogoModeloDTO | null>(null)
  const [modalNovo, setModalNovo] = useState(false)

  const carregar = () => {
    setCarregando(true)
    setErro(null)
    catalogoApi
      .listar({
        page,
        busca: busca.trim() || undefined,
        tipoItem: tipoItem || undefined,
        status: status || undefined,
      })
      .then(setPagina)
      .catch(() => setErro('Não foi possível carregar o catálogo.'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [page, busca, tipoItem, status])

  const onBuscar = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
  }

  const excluir = async (item: CatalogoModeloDTO) => {
    if (!window.confirm(`Excluir ${item.marca} ${item.modelo} do catálogo?`)) return
    try {
      await catalogoApi.deletar(item.id)
      carregar()
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível excluir o item.'
      alert(msg)
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Catálogo</div>
          <div className="page-sub">// {pagina?.totalElements ?? 0} cadastrados</div>
        </div>
        <button className="btn btn-amber" onClick={() => setModalNovo(true)}>
          + Novo item
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <form onSubmit={onBuscar} style={{ maxWidth: 320, flex: 1, minWidth: 200 }}>
          <label className="form-label">Buscar</label>
          <input
            className="form-input"
            placeholder="Marca, modelo ou descrição..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </form>

        <div className="form-field" style={{ width: 180 }}>
          <label className="form-label">Tipo</label>
          <select
            className="form-select"
            value={tipoItem}
            onChange={e => { setTipoItem(e.target.value as TipoItem | ''); setPage(0) }}
          >
            <option value="">Todos</option>
            <option value="EQUIPAMENTO">Equipamento</option>
            <option value="ACESSORIO">Acessório</option>
            <option value="PECA">Peça</option>
          </select>
        </div>

        <div className="form-field" style={{ width: 160 }}>
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={status}
            onChange={e => { setStatus(e.target.value as StatusCatalogo | ''); setPage(0) }}
          >
            <option value="">Todos</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
            <option value="OBSOLETO">Obsoleto</option>
          </select>
        </div>
      </div>

      {erro && <div className="error-banner">{erro}</div>}

      {carregando && <div className="loading">Carregando</div>}

      {!carregando && !erro && pagina && pagina.content.length === 0 && (
        <div className="empty">Nenhum item encontrado.</div>
      )}

      {!carregando && !erro && pagina && pagina.content.length > 0 && (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Descrição</th>
                <th>Valor ref.</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pagina.content.map(item => (
                <tr key={item.id}>
                  <td>{TIPO_LABEL[item.tipoItem]}</td>
                  <td>{item.marca}</td>
                  <td>{item.modelo}</td>
                  <td>{item.descricao || '—'}</td>
                  <td>{formatarValor(item.valorReferencia)}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[item.status]}`}>{item.status}</span>
                  </td>
                  <td style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => setModalItem(item)}>Editar</button>
                    <button className="btn btn-sm btn-danger" onClick={() => excluir(item)}>Excluir</button>
                  </td>
                </tr>
              ))}
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

      {modalNovo && (
        <CatalogoForm
          onClose={() => setModalNovo(false)}
          onSalvo={() => { setModalNovo(false); carregar() }}
        />
      )}

      {modalItem && (
        <CatalogoForm
          modelo={modalItem}
          onClose={() => setModalItem(null)}
          onSalvo={() => { setModalItem(null); carregar() }}
        />
      )}
    </div>
  )
}
