import { useEffect, useState } from 'react'
import { clientesApi } from '../api/clientes'
import type { ClienteDTO } from '../types/cliente'

interface Props {
  onSelecionar: (cliente: ClienteDTO) => void
  onCadastrarNovo: (buscaAtual: string) => void
}

function formatarDocumento(doc?: string): string {
  if (!doc) return ''
  if (doc.length === 11) return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (doc.length === 14) return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return doc
}

/** Busca cliente com debounce, reaproveitando o mesmo endpoint da listagem geral (GET /v1/clientes?busca=). */
export default function ClienteAutocomplete({ onSelecionar, onCadastrarNovo }: Props) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<ClienteDTO[]>([])
  const [buscando, setBuscando] = useState(false)
  const [buscou, setBuscou] = useState(false)
  const [aberto, setAberto] = useState(false)

  useEffect(() => {
    const termo = busca.trim()
    if (termo.length < 2) {
      setResultados([])
      setBuscou(false)
      return
    }
    setBuscando(true)
    const timer = setTimeout(() => {
      clientesApi
        .listar({ busca: termo, page: 0 })
        .then(pagina => setResultados(pagina.content))
        .catch(() => setResultados([]))
        .finally(() => {
          setBuscando(false)
          setBuscou(true)
        })
    }, 350)
    return () => clearTimeout(timer)
  }, [busca])

  return (
    <div style={{ position: 'relative' }}>
      <input
        className="form-input"
        placeholder="Nome, fantasia, CPF/CNPJ..."
        value={busca}
        onChange={e => { setBusca(e.target.value); setAberto(true) }}
        onFocus={() => setAberto(true)}
        onBlur={() => setTimeout(() => setAberto(false), 150)}
      />
      {aberto && busca.trim().length >= 2 && (
        <div
          style={{
            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 20,
            background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 6,
            maxHeight: 260, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {buscando && <div className="form-hint" style={{ padding: 10 }}>// buscando...</div>}

          {!buscando && resultados.map(cliente => (
            <div
              key={cliente.id}
              style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '0.5px solid var(--border)' }}
              onMouseDown={() => { onSelecionar(cliente); setBusca(''); setAberto(false) }}
            >
              <div style={{ fontSize: 13 }}>{cliente.nomeRazaoSocial}</div>
              <div className="page-sub" style={{ marginTop: 2 }}>
                {formatarDocumento(cliente.documento)}
                {cliente.nomeFantasia ? ` · ${cliente.nomeFantasia}` : ''}
              </div>
            </div>
          ))}

          {!buscando && buscou && resultados.length === 0 && (
            <div style={{ padding: 12 }}>
              <div className="form-hint" style={{ marginBottom: 8 }}>Nenhum cliente encontrado.</div>
              <button
                type="button" className="btn btn-sm btn-amber"
                onMouseDown={() => { onCadastrarNovo(busca.trim()); setAberto(false) }}
              >
                + Cadastrar cliente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
