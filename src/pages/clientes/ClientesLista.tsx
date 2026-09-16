import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientesApi } from '../../api/clientes'
import type { ClienteDTO, PageResponse, StatusCliente } from '../../types/cliente'

const TIPO_LABEL: Record<string, string> = {
  PESSOA_FISICA: 'Pessoa Física',
  PESSOA_JURIDICA: 'Pessoa Jurídica',
}

const STATUS_LABEL: Record<StatusCliente, string> = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  BLOQUEADO: 'Bloqueado',
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
  const [status, setStatus] = useState<StatusCliente | ''>('ATIVO')
  const [page, setPage] = useState(0)

  useEffect(() => {
    setCarregando(true)
    setErro(null)
    clientesApi
      .listar({ page, busca: busca.trim() || undefined, status: status || undefined })
      .then(setPagina)
      .catch(() => setErro('Não foi possível carregar os clientes.'))
      .finally(() => setCarregando(false))
  }, [page, busca, status])

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

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <form onSubmit={onBuscar} style={{ flex: 1, minWidth: 220 }}>
          <label className="form-label">Buscar</label>
          <input
            className="form-input"
            placeholder="Nome, fantasia, CPF/CNPJ, posto, contato, N/S ou código..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
          />
        </form>

        <div className="form-field" style={{ width: 160 }}>
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={status}
            onChange={e => { setStatus(e.target.value as StatusCliente | ''); setPage(0) }}
          >
            <option value="">Todos</option>
            <option value="ATIVO">Ativo</option>
            <option value="INATIVO">Inativo</option>
            <option value="BLOQUEADO">Bloqueado</option>
          </select>
        </div>
      </div>

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
                <th>Nº</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Razão Social/Nome</th>
                <th>Documento</th>
              </tr>
            </thead>
            <tbody>
              {pagina.content.map(cliente => (
                <tr
                  key={cliente.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/clientes/${cliente.id}`)}
                >
                  <td>{cliente.numeroIdentificacao}</td>
                  <td>{TIPO_LABEL[cliente.tipo] ?? cliente.tipo}</td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[cliente.status] ?? 'b-gray'}`}>
                      {STATUS_LABEL[cliente.status] ?? cliente.status}
                    </span>
                  </td>
                  <td>
                    {cliente.nomeRazaoSocial}
                    {cliente.nomeFantasia && (
                      <span style={{ color: 'var(--text3)' }}> ({cliente.nomeFantasia})</span>
                    )}
                  </td>
                  <td>{formatarDocumento(cliente.documento)}</td>
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
