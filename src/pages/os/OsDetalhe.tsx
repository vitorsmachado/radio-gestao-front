import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { osApi } from '../../api/os'
import { itensEntradaApi } from '../../api/itensEntrada'
import Modal from '../../components/Modal'
import ItemEntradaCard from './ItemEntradaCard'
import ItemEntradaForm from './ItemEntradaForm'
import type { ItemEntradaCreateRequest, ItemEntradaDTO, OrdemServicoDTO, StatusOS } from '../../types/os'

const STATUS_OS_LABEL: Record<StatusOS, string> = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
}

const STATUS_OS_BADGE: Record<StatusOS, string> = {
  ABERTA: 'b-blue',
  EM_ANDAMENTO: 'b-amber',
  CONCLUIDA: 'b-green',
  CANCELADA: 'b-red',
}

export default function OsDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [os, setOs] = useState<OrdemServicoDTO | null>(null)
  const [itens, setItens] = useState<ItemEntradaDTO[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [modalItem, setModalItem] = useState(false)
  const [modalEntrega, setModalEntrega] = useState(false)
  const [modalCancelar, setModalCancelar] = useState(false)
  const [processando, setProcessando] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  const carregar = () => {
    if (!id) return
    setCarregando(true)
    setErro(null)
    Promise.all([osApi.buscarPorId(id), itensEntradaApi.listarPorOS(id)])
      .then(([osData, itensData]) => {
        setOs(osData)
        setItens(itensData)
      })
      .catch(() => setErro('Não foi possível carregar a OS.'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [id])

  const atualizarItem = (item: ItemEntradaDTO) => {
    setItens(prev => prev.map(i => (i.id === item.id ? item : i)))
  }

  const novoItem = async (dados: ItemEntradaCreateRequest) => {
    setProcessando(true)
    try {
      const item = await itensEntradaApi.criar(dados)
      setItens(prev => [...prev, item])
      setModalItem(false)
    } catch {
      setErro('Não foi possível registrar o item.')
    } finally {
      setProcessando(false)
    }
  }

  const iniciarAndamento = async () => {
    if (!id) return
    const atualizado = await osApi.iniciarAndamento(id)
    setOs(atualizado)
  }

  const baixarPdf = async () => {
    if (!id) return
    setGerandoPdf(true)
    try {
      const blob = await osApi.baixarPdf(id)
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank')
    } catch {
      setErro('Não foi possível gerar o PDF.')
    } finally {
      setGerandoPdf(false)
    }
  }

  if (carregando) return <div className="loading">Carregando</div>
  if (erro && !os) return <div className="error-banner">{erro}</div>
  if (!os) return null

  const encerrada = os.status === 'CONCLUIDA' || os.status === 'CANCELADA'

  return (
    <div className="fade-in">
      <div className="breadcrumb">
        <span className="crumb" onClick={() => navigate(`/clientes/${os.clienteId}`)}>Cliente</span>
        <span className="sep">/</span>
        <span className="current">OS {os.numero}</span>
      </div>

      <div className="page-header">
        <div>
          <div className="page-title">OS {os.numero}</div>
          <div className="page-sub">
            // aberta em {new Date(os.dataAbertura).toLocaleString('pt-BR')}
            {os.solicitante ? ` · solicitante: ${os.solicitante}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={`badge ${STATUS_OS_BADGE[os.status]}`}>{STATUS_OS_LABEL[os.status]}</span>
          <button className="btn btn-sm" disabled={gerandoPdf} onClick={baixarPdf}>
            {gerandoPdf ? '// gerando...' : 'Baixar PDF'}
          </button>
        </div>
      </div>

      {erro && <div className="error-banner">{erro}</div>}

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {os.status === 'ABERTA' && (
          <button className="btn btn-sm btn-amber" onClick={iniciarAndamento}>Iniciar andamento</button>
        )}
        {!encerrada && (
          <button className="btn btn-sm btn-green" onClick={() => setModalEntrega(true)}>Confirmar entrega</button>
        )}
        {!encerrada && (
          <button className="btn btn-sm btn-danger" onClick={() => setModalCancelar(true)}>Cancelar OS</button>
        )}
      </div>

      <div className="section-hd">
        <h3>Itens ({itens.length})</h3>
        <button className="btn btn-sm btn-amber" onClick={() => setModalItem(true)}>+ Adicionar item</button>
      </div>

      {itens.length === 0 && <div className="empty">Nenhum item registrado ainda.</div>}

      {itens.map(item => (
        <ItemEntradaCard key={item.id} item={item} onAtualizado={atualizarItem} />
      ))}

      {modalItem && (
        <ItemEntradaForm
          osId={os.id}
          onClose={() => setModalItem(false)}
          onSalvar={novoItem}
          processando={processando}
        />
      )}

      {modalEntrega && (
        <ConfirmarEntregaModal
          onClose={() => setModalEntrega(false)}
          onConfirmar={async nomeRecebedor => {
            const atualizado = await osApi.confirmarEntrega(os.id, nomeRecebedor)
            setOs(atualizado)
            setModalEntrega(false)
          }}
        />
      )}

      {modalCancelar && (
        <CancelarModal
          onClose={() => setModalCancelar(false)}
          onConfirmar={async motivo => {
            const atualizado = await osApi.cancelar(os.id, motivo)
            setOs(atualizado)
            setModalCancelar(false)
          }}
        />
      )}
    </div>
  )
}

function ConfirmarEntregaModal({ onClose, onConfirmar }: { onClose: () => void; onConfirmar: (nome: string) => Promise<void> }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ nomeRecebedor: string }>()
  return (
    <Modal title="Confirmar entrega da OS" subtitle="Registra quem retirou os itens e conclui a OS." onClose={onClose}>
      <form onSubmit={handleSubmit(d => onConfirmar(d.nomeRecebedor))}>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Nome de quem retirou</label>
          <input
            className={`form-input${errors.nomeRecebedor ? ' error' : ''}`}
            {...register('nomeRecebedor', { required: 'Nome obrigatório' })}
          />
          {errors.nomeRecebedor && <span className="form-error">{errors.nomeRecebedor.message}</span>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-green" disabled={isSubmitting}>Confirmar</button>
        </div>
      </form>
    </Modal>
  )
}

function CancelarModal({ onClose, onConfirmar }: { onClose: () => void; onConfirmar: (motivo: string) => Promise<void> }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ motivo: string }>()
  return (
    <Modal title="Cancelar OS" onClose={onClose}>
      <form onSubmit={handleSubmit(d => onConfirmar(d.motivo))}>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Motivo</label>
          <textarea
            className={`form-input${errors.motivo ? ' error' : ''}`}
            rows={3}
            {...register('motivo', { required: 'Motivo obrigatório' })}
          />
          {errors.motivo && <span className="form-error">{errors.motivo.message}</span>}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Voltar</button>
          <button type="submit" className="btn btn-danger" disabled={isSubmitting}>Cancelar OS</button>
        </div>
      </form>
    </Modal>
  )
}
