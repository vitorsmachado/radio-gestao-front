import { useForm } from 'react-hook-form'
import Modal from '../../components/Modal'
import { FAIXA_EQUIPAMENTO_LABEL, type FaixaEquipamento, type ItemEntradaCreateRequest, type TipoItem } from '../../types/os'

interface FormValues {
  tipoItem: TipoItem
  descricao: string
  marca: string
  modelo: string
  faixa: FaixaEquipamento | ''
  numeroSerie: string
  codigoCliente: string
  defeitoRelatado: string
  rastreamento: 'NS' | 'QUANTIDADE'
  quantidade: number
}

interface Props {
  osId: string
  onClose: () => void
  onSalvar: (dados: ItemEntradaCreateRequest) => void
  processando: boolean
}

export default function ItemEntradaForm({ osId, onClose, onSalvar, processando }: Props) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: { tipoItem: 'EQUIPAMENTO', rastreamento: 'NS', quantidade: 1, faixa: '' },
  })

  const tipoItem = watch('tipoItem')
  const rastreamento = watch('rastreamento')
  const faixa = watch('faixa')
  const porQuantidade = tipoItem === 'ACESSORIO' && rastreamento === 'QUANTIDADE'

  const onSubmit = handleSubmit(d =>
    onSalvar({
      osId,
      tipoItem: d.tipoItem,
      descricao: d.descricao.trim(),
      marca: d.marca.trim() || undefined,
      modelo: d.modelo.trim() || undefined,
      faixa: d.tipoItem === 'EQUIPAMENTO' && d.faixa ? d.faixa : undefined,
      numeroSerie: porQuantidade ? undefined : (d.numeroSerie.trim() || undefined),
      codigoCliente: d.codigoCliente.trim() || undefined,
      quantidade: porQuantidade ? (Number(d.quantidade) || 1) : 1,
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

        {tipoItem === 'EQUIPAMENTO' && (
          <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
            <div className="form-field">
              <label className="form-label">Faixa</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {Object.entries(FAIXA_EQUIPAMENTO_LABEL).map(([valor, label]) => (
                  <button
                    key={valor} type="button"
                    className={`btn btn-sm${faixa === valor ? ' btn-amber' : ''}`}
                    onClick={() => setValue('faixa', valor as FaixaEquipamento)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label className="form-label">Número de série</label>
              <input className="form-input" {...register('numeroSerie')} />
            </div>
          </div>
        )}

        {tipoItem === 'ACESSORIO' && (
          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Rastreamento</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className={`btn btn-sm${rastreamento === 'NS' ? ' btn-amber' : ''}`}
                onClick={() => setValue('rastreamento', 'NS')}
              >
                N/S
              </button>
              <button
                type="button"
                className={`btn btn-sm${rastreamento === 'QUANTIDADE' ? ' btn-amber' : ''}`}
                onClick={() => setValue('rastreamento', 'QUANTIDADE')}
              >
                Qnt.
              </button>
            </div>
            <div className="form-hint" style={{ marginTop: 4 }}>
              Use "Qnt." para acessórios sem identificação individual — ex: antenas genéricas.
            </div>
          </div>
        )}

        {tipoItem === 'ACESSORIO' && (
          <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
            <div className="form-field">
              {porQuantidade ? (
                <>
                  <label className="form-label">Quantidade</label>
                  <input
                    type="number" min={1} className="form-input"
                    {...register('quantidade', { valueAsNumber: true, min: 1 })}
                  />
                </>
              ) : (
                <>
                  <label className="form-label">Número de série</label>
                  <input className="form-input" {...register('numeroSerie')} />
                </>
              )}
            </div>
            <div className="form-field">
              <label className="form-label">Código do cliente</label>
              <input className="form-input" placeholder="Identificação própria do cliente pro item" {...register('codigoCliente')} />
            </div>
          </div>
        )}

        {tipoItem === 'EQUIPAMENTO' && (
          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Código do cliente</label>
            <input className="form-input" placeholder="Identificação própria do cliente pro item" {...register('codigoCliente')} />
          </div>
        )}

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
