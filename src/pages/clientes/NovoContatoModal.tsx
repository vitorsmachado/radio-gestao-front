import { useState } from 'react'
import { clientesApi } from '../../api/clientes'
import Modal from '../../components/Modal'
import type { ClienteDTO } from '../../types/cliente'

const TIPO_LABEL = {
  COMERCIAL: 'Comercial',
  TECNICO: 'Técnico',
  FINANCEIRO: 'Financeiro',
  GERENCIAL: 'Gerencial',
} as const

type TipoContato = keyof typeof TIPO_LABEL

interface Props {
  clienteId: string
  temContatoPrincipal: boolean
  onClose: () => void
  onSalvo: (cliente: ClienteDTO) => void
}

export default function NovoContatoModal({ clienteId, temContatoPrincipal, onClose, onSalvo }: Props) {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoContato>('COMERCIAL')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [cargo, setCargo] = useState('')
  const [principal, setPrincipal] = useState(!temContatoPrincipal)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  const salvar = async () => {
    if (!nome.trim()) { setErro('Preencha o nome.'); return }
    setSalvando(true)
    setErro(null)
    try {
      const cliente = await clientesApi.criarContato(clienteId, {
        nome: nome.trim(),
        tipo,
        telefone: telefone.trim() || undefined,
        email: email.trim() || undefined,
        cargo: cargo.trim() || undefined,
        principal,
      })
      onSalvo(cliente)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível adicionar o contato.'
      setErro(msg)
      setSalvando(false)
    }
  }

  return (
    <Modal title="Adicionar contato" onClose={onClose}>
      {erro && <div className="error-banner">{erro}</div>}

      <div className="form-field" style={{ marginBottom: 12 }}>
        <label className="form-label">Nome</label>
        <input className="form-input" autoFocus value={nome} onChange={e => setNome(e.target.value)} />
      </div>

      <div className="form-field" style={{ marginBottom: 12 }}>
        <label className="form-label">Tipo</label>
        <select className="form-select" value={tipo} onChange={e => setTipo(e.target.value as TipoContato)}>
          {Object.entries(TIPO_LABEL).map(([valor, label]) => (
            <option key={valor} value={valor}>{label}</option>
          ))}
        </select>
      </div>

      <div className="form-field" style={{ marginBottom: 12 }}>
        <label className="form-label">Cargo</label>
        <input className="form-input" value={cargo} onChange={e => setCargo(e.target.value)} />
      </div>

      <div className="form-field" style={{ marginBottom: 12 }}>
        <label className="form-label">Telefone</label>
        <input className="form-input" value={telefone} onChange={e => setTelefone(e.target.value)} />
      </div>

      <div className="form-field" style={{ marginBottom: 12 }}>
        <label className="form-label">Email</label>
        <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', marginBottom: 12 }}>
        <input type="checkbox" checked={principal} onChange={e => setPrincipal(e.target.checked)} />
        Marcar como contato principal
      </label>

      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-amber" disabled={salvando} onClick={salvar}>
          {salvando ? '// salvando...' : 'Salvar'}
        </button>
      </div>
    </Modal>
  )
}
