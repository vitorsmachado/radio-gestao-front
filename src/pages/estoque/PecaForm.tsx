import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { catalogoApi } from '../../api/catalogo'
import { pecasApi } from '../../api/pecas'
import Modal from '../../components/Modal'
import ModeloCompativelPicker from '../../components/ModeloCompativelPicker'
import type { CatalogoModeloDTO } from '../../types/catalogo'
import type { PecaDTO } from '../../types/peca'

interface FormValues {
  codigo: string
  descricao: string
  marca: string
  modelo: string
  quantidadeDisponivel: number
  quantidadeMinima: number
  observacoes: string
  localizacaoFisica: string
}

interface Props {
  peca?: PecaDTO
  onClose: () => void
  onSalvo: () => void
}

export default function PecaForm({ peca, onClose, onSalvo }: Props) {
  const editando = !!peca
  const [marcas, setMarcas] = useState<string[]>([])
  const [modelosCompativeis, setModelosCompativeis] = useState<CatalogoModeloDTO[]>(peca?.modelosCompativeis ?? [])
  const [erro, setErro] = useState<string | null>(null)

  const [catalogoSelecionado, setCatalogoSelecionado] = useState<CatalogoModeloDTO | null>(null)
  const [buscaCatalogo, setBuscaCatalogo] = useState('')
  const [sugestoesCatalogo, setSugestoesCatalogo] = useState<CatalogoModeloDTO[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      codigo: peca?.codigo ?? '',
      descricao: peca?.descricao ?? '',
      quantidadeDisponivel: 0,
      quantidadeMinima: peca?.quantidadeMinima,
      observacoes: peca?.observacoes ?? '',
      localizacaoFisica: peca?.localizacaoFisica ?? '',
    },
  })

  useEffect(() => {
    catalogoApi.listarMarcas().then(setMarcas).catch(() => setMarcas([]))
  }, [])

  useEffect(() => {
    if (editando || catalogoSelecionado || buscaCatalogo.trim().length < 2) {
      setSugestoesCatalogo([])
      return
    }
    const t = setTimeout(() => {
      catalogoApi
        .listar({ busca: buscaCatalogo.trim() })
        .then(res => setSugestoesCatalogo(res.content))
        .catch(() => setSugestoesCatalogo([]))
    }, 300)
    return () => clearTimeout(t)
  }, [editando, catalogoSelecionado, buscaCatalogo])

  const selecionarDoCatalogo = (item: CatalogoModeloDTO) => {
    setCatalogoSelecionado(item)
    setValue('marca', item.marca)
    setValue('modelo', item.modelo)
    setBuscaCatalogo('')
    setSugestoesCatalogo([])
  }

  const limparCatalogoSelecionado = () => {
    setCatalogoSelecionado(null)
    setValue('marca', '')
    setValue('modelo', '')
  }

  const reconciliarModelosCompativeis = async () => {
    if (!peca) return
    const originalIds = new Set(peca.modelosCompativeis.map(m => m.id))
    const atuaisIds = new Set(modelosCompativeis.map(m => m.id))
    const paraAdicionar = modelosCompativeis.filter(m => !originalIds.has(m.id))
    const paraRemover = peca.modelosCompativeis.filter(m => !atuaisIds.has(m.id))
    await Promise.all([
      ...paraAdicionar.map(m => pecasApi.vincularModeloCompativel(peca.id, m.id)),
      ...paraRemover.map(m => pecasApi.desvincularModeloCompativel(peca.id, m.id)),
    ])
  }

  const onSubmit = handleSubmit(async d => {
    setErro(null)
    try {
      if (editando) {
        await pecasApi.atualizar(peca!.id, {
          codigo: d.codigo.trim() || undefined,
          descricao: d.descricao.trim(),
          quantidadeMinima: d.quantidadeMinima !== undefined && String(d.quantidadeMinima) !== '' ? Number(d.quantidadeMinima) : undefined,
          observacoes: d.observacoes.trim() || undefined,
          localizacaoFisica: d.localizacaoFisica.trim() || undefined,
        })
        await reconciliarModelosCompativeis()
      } else {
        await pecasApi.criar({
          descricao: d.descricao.trim(),
          quantidadeDisponivel: Number(d.quantidadeDisponivel) || 0,
          quantidadeMinima: d.quantidadeMinima ? Number(d.quantidadeMinima) : undefined,
          catalogoModeloId: catalogoSelecionado?.id,
          marca: d.marca.trim() || undefined,
          modelo: d.modelo.trim() || undefined,
          modelosCompativeisIds: modelosCompativeis.map(m => m.id),
        })
      }
      onSalvo()
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível salvar a peça.'
      setErro(msg)
    }
  })

  return (
    <Modal
      title={editando ? `Editar peça — ${peca!.codigo}` : 'Nova peça'}
      subtitle={editando ? undefined : 'Marca e modelo identificam o item no catálogo.'}
      onClose={onClose}
    >
      {erro && <div className="error-banner">{erro}</div>}

      <form onSubmit={onSubmit}>
        {editando && (
          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Código</label>
            <input className="form-input" {...register('codigo')} />
          </div>
        )}

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

        {!editando && (
          <>
            <div className="form-field" style={{ marginBottom: 12, position: 'relative' }}>
              <label className="form-label">Buscar no catálogo</label>
              {catalogoSelecionado ? (
                <div className="form-input" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{catalogoSelecionado.marca} {catalogoSelecionado.modelo}</span>
                  <span style={{ cursor: 'pointer', color: 'var(--text3)' }} onClick={limparCatalogoSelecionado}>✕</span>
                </div>
              ) : (
                <input
                  className="form-input"
                  placeholder="Buscar por marca, modelo ou descrição já cadastrados..."
                  value={buscaCatalogo}
                  onChange={e => setBuscaCatalogo(e.target.value)}
                />
              )}
              {!catalogoSelecionado && sugestoesCatalogo.length > 0 && (
                <div className="section-card" style={{ position: 'absolute', zIndex: 10, width: '100%', marginTop: 4, padding: 6 }}>
                  {sugestoesCatalogo.map(item => (
                    <div
                      key={item.id}
                      style={{ padding: '6px 4px', cursor: 'pointer', fontSize: 13 }}
                      onClick={() => selecionarDoCatalogo(item)}
                    >
                      {item.marca} {item.modelo}
                      <span style={{ color: 'var(--text3)' }}> · {item.tipoItem}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
              <div className="form-field">
                <label className="form-label">Marca</label>
                <input className="form-input" list="marcas-sugeridas" disabled={!!catalogoSelecionado} {...register('marca')} />
                <datalist id="marcas-sugeridas">
                  {marcas.map(m => <option key={m} value={m} />)}
                </datalist>
              </div>
              <div className="form-field">
                <label className="form-label">Modelo</label>
                <input className="form-input" disabled={!!catalogoSelecionado} {...register('modelo')} />
              </div>
            </div>
          </>
        )}

        <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
          {!editando && (
            <div className="form-field">
              <label className="form-label">Quantidade inicial</label>
              <input type="number" min={0} className="form-input" {...register('quantidadeDisponivel')} />
            </div>
          )}
          <div className="form-field">
            <label className="form-label">Quantidade mínima (alerta)</label>
            <input type="number" min={0} className="form-input" {...register('quantidadeMinima')} />
          </div>
        </div>

        {editando && (
          <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
            <div className="form-field">
              <label className="form-label">Localização física</label>
              <input className="form-input" placeholder="Prateleira B3" {...register('localizacaoFisica')} />
            </div>
            <div className="form-field">
              <label className="form-label">Observações</label>
              <input className="form-input" {...register('observacoes')} />
            </div>
          </div>
        )}

        <div className="section-hd"><h3>Modelos de equipamento compatíveis</h3></div>
        <ModeloCompativelPicker selecionados={modelosCompativeis} onChange={setModelosCompativeis} />

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{editando ? 'Fechar' : 'Cancelar'}</button>
          <button type="submit" className="btn btn-amber" disabled={isSubmitting}>
            {isSubmitting ? '// salvando...' : 'Salvar peça'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
