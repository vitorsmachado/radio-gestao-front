import { useForm } from 'react-hook-form'
import Modal from '../../components/Modal'
import type { ItemEntradaCreateRequest, TipoItem } from '../../types/os'

interface FormValues {
  tipoItem: TipoItem
  descricao: string
  marca: string
  modelo: string
  numeroSerie: string
  patrimonio: string
  defeitoRelatado: string
}

interface Props {
  osId: string
  onClose: () => void
  onSalvar: (dados: ItemEntradaCreateRequest) => void
  processando: boolean
}

export default function ItemEntradaForm({ osId, onClose, onSalvar, processando }: Props) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    defaultValues: { tipoItem: 'EQUIPAMENTO' },
  })

  const onSubmit = handleSubmit(d =>
    onSalvar({
      osId,
      tipoItem: d.tipoItem,
      descricao: d.descricao.trim(),
      marca: d.marca.trim() || undefined,
      modelo: d.modelo.trim() || undefined,
      numeroSerie: d.numeroSerie.trim() || undefined,
      patrimonio: d.patrimonio.trim() || undefined,
      defeitoRelatado: d.defeitoRelatado.trim() || undefined,
    })
  )

  return (
    <Modal title="Registrar item de entrada" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
          <div className="form-field">
            <label className="form-label">Tipo</label>
            <select className="form-select" {...register('tipoItem')}>
              <option value="EQUIPAMENTO">Equipamento</option>
              <option value="ACESSORIO">Acessório</option>
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Descrição</label>
            <input
              className={`form-input${errors.descricao ? ' error' : ''}`}
              placeholder="Rádio Motorola EP450"
              {...register('descricao', { required: 'Descrição obrigatória' })}
            />
          </div>
        </div>

        <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
          <div className="form-field">
            <label className="form-label">Marca</label>
            <input className="form-input" {...register('marca')} />
          </div>
          <div className="form-field">
            <label className="form-label">Modelo</label>
            <input className="form-input" {...register('modelo')} />
          </div>
        </div>

        <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
          <div className="form-field">
            <label className="form-label">Número de série</label>
            <input className="form-input" {...register('numeroSerie')} />
          </div>
          <div className="form-field">
            <label className="form-label">Patrimônio</label>
            <input className="form-input" {...register('patrimonio')} />
          </div>
        </div>

        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Defeito relatado pelo cliente</label>
          <textarea className="form-input" rows={3} {...register('defeitoRelatado')} />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-amber" disabled={processando}>
            {processando ? '// salvando...' : 'Registrar item'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
