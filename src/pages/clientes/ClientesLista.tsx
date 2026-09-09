import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientesApi } from '../../api/clientes'
import type { ClienteDTO, PageResponse } from '../../types/cliente'

const TIPO_LABEL: Record<string, string> = {
  PESSOA_FISICA: 'Pessoa Física',
  PESSOA_JURIDICA: 'Pessoa Jurídica',
}

const STATUS_BADGE: Record<string, string> = {
  ATIVO: 'b-green',
  INATIVO: 'b-gray',
  BLOQUEADO: 'b-red',
}

function formatarDocumento(doc: string): string {
  if (doc.length === 11) {
    return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }
  if (doc.length === 14) {
    return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }
  return doc
}

export default function ClientesLista() {
  const navigate = useNavigate()
  const [pagina, setPagina] = useState<PageResponse<ClienteDTO> | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [page, setPage] = useState(0)

  useEffect(() => {
    setCarregando(true)
    setErro(null)
    clientesApi
      .listar(page, busca.trim() || undefined)
      .then(setPagina)
      .catch(() => setErro('Não foi possível carregar os clientes.'))
      .finally(() => setCarregando(false))
  }, [page, busca])

  const onBuscar = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(0)
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Clientes</div>
          <div className="page-sub">// {pagina?.totalElements ?? 0} cadastrados</div>
        </div>
        <button className="btn btn-amber" onClick={() => navigate('/clientes/novo')}>
          + Novo cliente
        </button>
      </div>

      <form onSubmit={onBuscar} style={{ marginBottom: 16, maxWidth: 320 }}>
        <input
          className="form-input"
          placeholder="Buscar por nome..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </form>

      {erro && <div className="error-banner">{erro}</div>}

      {carregando && <div className="loading">Carregando</div>}

      {!carregando && !erro && pagina && pagina.content.length === 0 && (
        <div className="empty">Nenhum cliente encontrado.</div>
      )}

      {!carregando && !erro && pagina && pagina.content.length > 0 && (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Nome/Razão Social</th>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pagina.content.map(cliente => (
                <tr
                  key={cliente.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/clientes/${cliente.id}`)}
                >
                  <td>{cliente.nomeRazaoSocial}</td>
                  <td>{formatarDocumento(cliente.documento)}</td>
                  <td>{TIPO_LABEL[cliente.tipo] ?? cliente.tipo}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[cliente.status] ?? 'b-gray'}`}>
                      {cliente.status}
                    </span>
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
              <button
                className="btn btn-sm"
                disabled={pagina.number === 0}
                onClick={() => setPage(p => p - 1)}
              >
                ← Anterior
              </button>
              <button
                className="btn btn-sm"
                disabled={pagina.number + 1 >= pagina.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Próxima →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
