import { useState } from 'react'
import { clientesApi } from '../../api/clientes'
import Modal from '../../components/Modal'

export type AcaoStatus = 'ativar' | 'bloquear' | 'inativar'

interface Props {
  clienteId: string
  acao: AcaoStatus
  onClose: () => void
  onSalvo: () => void
}

const TITULOS: Record<AcaoStatus, string> = {
  ativar: 'Ativar cliente',
  bloquear: 'Bloquear cliente',
  inativar: 'Inativar cliente',
}

const BOTOES: Record<AcaoStatus, { label: string; className: string }> = {
  ativar: { label: 'Ativar', className: 'btn-green' },
  bloquear: { label: 'Bloquear', className: 'btn-danger' },
  inativar: { label: 'Inativar', className: 'btn-amber' },
}

const ACAO_API: Record<AcaoStatus, (id: string, motivo?: string) => Promise<unknown>> = {
  ativar: clientesApi.ativar,
  bloquear: clientesApi.bloquear,
  inativar: clientesApi.inativar,
}

export default function AlterarStatusModal({ clienteId, acao, onClose, onSalvo }: Props) {
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const confirmar = async () => {
    setErro(null)
    setEnviando(true)
    try {
      await ACAO_API[acao](clienteId, motivo.trim() || undefined)
      onSalvo()
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível alterar o status do cliente.'
      setErro(msg)
    } finally {
      setEnviando(false)
    }
  }

  const botao = BOTOES[acao]

  return (
    <Modal title={TITULOS[acao]} subtitle="Motivo é opcional." onClose={onClose}>
      {erro && <div className="error-banner">{erro}</div>}

      <div className="form-field" style={{ marginBottom: 12 }}>
        <label className="form-label">Motivo</label>
        <textarea
          className="form-input" rows={3} autoFocus
          value={motivo} onChange={e => setMotivo(e.target.value)}
        />
      </div>

      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className={`btn ${botao.className}`} disabled={enviando} onClick={confirmar}>
          {enviando ? '// enviando...' : botao.label}
        </button>
      </div>
    </Modal>
  )
}
