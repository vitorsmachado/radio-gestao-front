import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { osApi } from '../../api/os'

export default function OsLista() {
  const navigate = useNavigate()
  const [numero, setNumero] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [buscando, setBuscando] = useState(false)

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!numero.trim()) return
    setBuscando(true)
    setErro(null)
    try {
      const os = await osApi.buscarPorNumero(numero.trim())
      navigate(`/os/${os.id}`)
    } catch {
      setErro('OS não encontrada com esse número.')
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Ordens de Serviço</div>
          <div className="page-sub">// busque por número, ou acesse pela tela do cliente</div>
        </div>
      </div>

      <form onSubmit={buscar} style={{ maxWidth: 320, display: 'flex', gap: 8 }}>
        <input
          className="form-input"
          placeholder="Ex: OS-2026-0001"
          value={numero}
          onChange={e => setNumero(e.target.value)}
        />
        <button className="btn btn-amber" disabled={buscando} type="submit">
          Buscar
        </button>
      </form>

      {erro && <div className="error-banner" style={{ marginTop: 12, maxWidth: 320 }}>{erro}</div>}

      <div className="form-hint" style={{ marginTop: 16 }}>
        Para ver todas as OS de um cliente específico, abra o cadastro do cliente em <span
          className="crumb" style={{ cursor: 'pointer' }} onClick={() => navigate('/clientes')}
        >Clientes</span>.
      </div>
    </div>
  )
}
