import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { catalogoApi } from '../../api/catalogo'
import { pecasApi } from '../../api/pecas'
import Modal from '../../components/Modal'
import ModeloCompativelPicker from '../../components/ModeloCompativelPicker'
import type { CatalogoModeloDTO } from '../../types/catalogo'

interface FormValues {
  descricao: string
  marca: string
  modelo: string
  quantidadeDisponivel: number
  quantidadeMinima: number
}

interface Props {
  onClose: () => void
  onSalvo: () => void
}

export default function PecaForm({ onClose, onSalvo }: Props) {
  const [marcas, setMarcas] = useState<string[]>([])
  const [modelosCompativeis, setModelosCompativeis] = useState<CatalogoModeloDTO[]>([])
  const [erro, setErro] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ defaultValues: { quantidadeDisponivel: 0 } })

  useEffect(() => {
    catalogoApi.listarMarcas().then(setMarcas).catch(() => setMarcas([]))
  }, [])

  const onSubmit = handleSubmit(async d => {
    setErro(null)
    try {
      await pecasApi.criar({
        descricao: d.descricao.trim(),
        quantidadeDisponivel: Number(d.quantidadeDisponivel) || 0,
        quantidadeMinima: d.quantidadeMinima ? Number(d.quantidadeMinima) : undefined,
        marca: d.marca.trim() || undefined,
        modelo: d.modelo.trim() || undefined,
        modelosCompativeisIds: modelosCompativeis.map(m => m.id),
      })
      onSalvo()
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível criar a peça.'
      setErro(msg)
    }
  })

  return (
    <Modal title="Nova peça" subtitle="Marca e modelo identificam o item no catálogo." onClose={onClose}>
      {erro && <div className="error-banner">{erro}</div>}

      <form onSubmit={onSubmit}>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Descrição</label>
          <input
            className={`form-input${errors.descricao ? ' error' : ''}`}
            placeholder="Bateria BP-227"
            autoFocus
            {...register('descricao', { required: 'Descrição obrigatória' })}
          />
          {errors.descricao && <span className="form-error">{errors.descricao.message}</span>}
        </div>

        <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
          <div className="form-field">
            <label className="form-label">Marca</label>
            <input className="form-input" list="marcas-sugeridas" {...register('marca')} />
            <datalist id="marcas-sugeridas">
              {marcas.map(m => <option key={m} value={m} />)}
            </datalist>
          </div>
          <div className="form-field">
            <label className="form-label">Modelo</label>
            <input className="form-input" {...register('modelo')} />
          </div>
        </div>

        <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
          <div className="form-field">
            <label className="form-label">Quantidade inicial</label>
            <input type="number" min={0} className="form-input" {...register('quantidadeDisponivel')} />
          </div>
          <div className="form-field">
            <label className="form-label">Quantidade mínima (alerta)</label>
            <input type="number" min={0} className="form-input" {...register('quantidadeMinima')} />
          </div>
        </div>

        <div className="section-hd"><h3>Modelos de equipamento compatíveis</h3></div>
        <ModeloCompativelPicker selecionados={modelosCompativeis} onChange={setModelosCompativeis} />

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-amber" disabled={isSubmitting}>
            {isSubmitting ? '// salvando...' : 'Salvar peça'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
