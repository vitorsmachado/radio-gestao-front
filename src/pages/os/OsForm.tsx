import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { osApi } from '../../api/os'

interface FormValues {
  solicitante: string
}

export default function OsForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const clienteId = searchParams.get('clienteId')

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>()

  if (!clienteId) {
    return <div className="error-banner">Cliente não informado. Abra "Nova OS" a partir da tela do cliente.</div>
  }

  const onSubmit = handleSubmit(async d => {
    const os = await osApi.criar({ clienteId, solicitante: d.solicitante.trim() || undefined })
    navigate(`/os/${os.id}`, { replace: true })
  })

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Nova Ordem de Serviço</div>
          <div className="page-sub">// registra a entrada do(s) item(ns) do cliente</div>
        </div>
      </div>

      <form onSubmit={onSubmit} style={{ maxWidth: 480 }}>
        <div className="section-card">
          <div className="form-field">
            <label className="form-label">Solicitante (quem deixou o item)</label>
            <input className="form-input" autoFocus {...register('solicitante')} />
          </div>
        </div>

        <div className="footer-actions">
          <div className="footer-left">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
          </div>
          <div className="footer-right">
            <button type="submit" className="btn btn-amber" disabled={isSubmitting}>
              {isSubmitting ? '// abrindo...' : 'Abrir OS'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
