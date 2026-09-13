import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { catalogoApi } from '../../api/catalogo'
import Modal from '../../components/Modal'
import type { CatalogoModeloDTO, StatusCatalogo, TipoAcessorio } from '../../types/catalogo'
import type { TipoItem } from '../../types/os'

const TIPO_ACESSORIO_LABEL: Record<TipoAcessorio, string> = {
  BATERIA: 'Bateria',
  ANTENA: 'Antena',
  BASE: 'Base',
  FONTE: 'Fonte',
  CAPA_COURO: 'Capa de couro',
  CLIP_CINTO: 'Clip de cinto',
  FONE_OUVIDO: 'Fone de ouvido',
  OUTRO: 'Outro',
}

interface FormValues {
  tipoItem: TipoItem
  tipoAcessorio: TipoAcessorio | ''
  marca: string
  modelo: string
  referencia: string
  descricao: string
  valorReferencia: string
  status: StatusCatalogo
}

interface Props {
  modelo?: CatalogoModeloDTO
  onClose: () => void
  onSalvo: () => void
}

export default function CatalogoForm({ modelo, onClose, onSalvo }: Props) {
  const [marcas, setMarcas] = useState<string[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const editando = !!modelo

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      tipoItem: modelo?.tipoItem ?? 'EQUIPAMENTO',
      tipoAcessorio: modelo?.tipoAcessorio ?? '',
      marca: modelo?.marca ?? '',
      modelo: modelo?.modelo ?? '',
      referencia: modelo?.referencia ?? '',
      descricao: modelo?.descricao ?? '',
      valorReferencia: modelo?.valorReferencia != null ? String(modelo.valorReferencia) : '',
      status: modelo?.status ?? 'ATIVO',
    },
  })

  const tipoItem = watch('tipoItem')

  useEffect(() => {
    catalogoApi.listarMarcas().then(setMarcas).catch(() => setMarcas([]))
  }, [])

  const onSubmit = handleSubmit(async d => {
    setErro(null)
    const valorReferencia = d.valorReferencia.trim() ? Number(d.valorReferencia) : undefined
    try {
      if (editando) {
        await catalogoApi.atualizar(modelo!.id, {
          tipoAcessorio: d.tipoItem === 'ACESSORIO' && d.tipoAcessorio ? d.tipoAcessorio : undefined,
          referencia: d.referencia.trim() || undefined,
          descricao: d.descricao.trim() || undefined,
          valorReferencia,
          status: d.status,
        })
      } else {
        await catalogoApi.criar({
          tipoItem: d.tipoItem,
          tipoAcessorio: d.tipoItem === 'ACESSORIO' && d.tipoAcessorio ? d.tipoAcessorio : undefined,
          marca: d.marca.trim(),
          modelo: d.modelo.trim(),
          referencia: d.referencia.trim() || undefined,
          descricao: d.descricao.trim() || undefined,
          valorReferencia,
        })
      }
      onSalvo()
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível salvar o item do catálogo.'
      setErro(msg)
    }
  })

  return (
    <Modal
      title={editando ? 'Editar item do catálogo' : 'Novo item do catálogo'}
      subtitle="Marca, modelo e tipo identificam o item em todo o sistema."
      onClose={onClose}
    >
      {erro && <div className="error-banner">{erro}</div>}

      <form onSubmit={onSubmit}>
        <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
          <div className="form-field">
            <label className="form-label">Tipo</label>
            <select className="form-select" disabled={editando} {...register('tipoItem')}>
              <option value="EQUIPAMENTO">Equipamento</option>
              <option value="ACESSORIO">Acessório</option>
              <option value="PECA">Peça</option>
            </select>
          </div>
          {tipoItem === 'ACESSORIO' && (
            <div className="form-field">
              <label className="form-label">Tipo de acessório</label>
              <select className="form-select" {...register('tipoAcessorio')}>
                <option value="">Selecione</option>
                {Object.entries(TIPO_ACESSORIO_LABEL).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
          <div className="form-field">
            <label className="form-label">Marca</label>
            <input
              className={`form-input${errors.marca ? ' error' : ''}`}
              list="marcas-sugeridas"
              disabled={editando}
              {...register('marca', { required: 'Marca obrigatória' })}
            />
            <datalist id="marcas-sugeridas">
              {marcas.map(m => <option key={m} value={m} />)}
            </datalist>
            {errors.marca && <span className="form-error">{errors.marca.message}</span>}
          </div>
          <div className="form-field">
            <label className="form-label">Modelo</label>
            <input
              className={`form-input${errors.modelo ? ' error' : ''}`}
              disabled={editando}
              {...register('modelo', { required: 'Modelo obrigatório' })}
            />
            {errors.modelo && <span className="form-error">{errors.modelo.message}</span>}
          </div>
        </div>

        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Descrição</label>
          <input className="form-input" {...register('descricao')} />
        </div>

        <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
          <div className="form-field">
            <label className="form-label">Referência</label>
            <input className="form-input" {...register('referencia')} />
          </div>
          <div className="form-field">
            <label className="form-label">Valor de referência</label>
            <input type="number" min={0} step="0.01" className="form-input" {...register('valorReferencia')} />
          </div>
        </div>

        {editando && (
          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Status</label>
            <select className="form-select" {...register('status')}>
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
              <option value="OBSOLETO">Obsoleto</option>
            </select>
          </div>
        )}

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-amber" disabled={isSubmitting}>
            {isSubmitting ? '// salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
