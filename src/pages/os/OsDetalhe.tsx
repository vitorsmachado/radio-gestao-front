import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { clientesApi } from '../../api/clientes'
import { osApi } from '../../api/os'
import { itensEntradaApi } from '../../api/itensEntrada'
import { orcamentosApi } from '../../api/orcamentos'
import ClienteAutocomplete from '../../components/ClienteAutocomplete'
import Modal from '../../components/Modal'
import SepararOSModal from '../../components/SepararOSModal'
import { fecharComConfirmacao } from '../../utils/fecharComConfirmacao'
import ClienteRapidoModal from '../clientes/ClienteRapidoModal'
import AvaliacaoItemCard from './AvaliacaoItemCard'
import ItemEntradaCard from './ItemEntradaCard'
import ItemEntradaForm from './ItemEntradaForm'
import type { ClienteDTO } from '../../types/cliente'
import type {
  AtualizarOrdemServicoRequest,
  ItemEntradaCreateRequest,
  ItemEntradaDTO,
  OrdemServicoDTO,
  StatusOS,
} from '../../types/os'
import { STATUS_ORCAMENTO_BADGE, STATUS_ORCAMENTO_LABEL, type OrcamentoDTO } from '../../types/orcamento'

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
  const location = useLocation()

  const [os, setOs] = useState<OrdemServicoDTO | null>(null)
  const [itens, setItens] = useState<ItemEntradaDTO[]>([])
  const [orcamentos, setOrcamentos] = useState<OrcamentoDTO[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [modalItem, setModalItem] = useState(false)
  const [modalEntrega, setModalEntrega] = useState(false)
  const [modalCancelar, setModalCancelar] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [modalSeparar, setModalSeparar] = useState<'todos' | 'aguardando-peca' | null>(null)
  const [modalOrcamentos, setModalOrcamentos] = useState(false)
  const [novasOSCriadas, setNovasOSCriadas] = useState<OrdemServicoDTO[]>(
    (location.state as { novasOSCriadas?: OrdemServicoDTO[] } | null)?.novasOSCriadas ?? [],
  )
  const [processando, setProcessando] = useState(false)
  const [gerandoPdf, setGerandoPdf] = useState(false)

  const carregar = () => {
    if (!id) return
    setCarregando(true)
    setErro(null)
    Promise.all([osApi.buscarPorId(id), itensEntradaApi.listarPorOS(id), orcamentosApi.listarPorOS(id)])
      .then(([osData, itensData, orcamentosData]) => {
        setOs(osData)
        setItens(itensData)
        setOrcamentos(orcamentosData)
      })
      .catch(() => setErro('Não foi possível carregar a OS.'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [id])

  const atualizarItem = (item: ItemEntradaDTO) => {
    setItens(prev => prev.map(i => (i.id === item.id ? item : i)))
    // Uma avaliação pode gerar (ou reabrir) um orçamento automaticamente — reconsulta pra o botão "Ver orçamento" aparecer sem precisar recarregar a página.
    if (os) orcamentosApi.listarPorOS(os.id).then(setOrcamentos).catch(() => {})
  }

  const removerItem = (itemId: string) => {
    setItens(prev => prev.filter(i => i.id !== itemId))
  }

  const itemDesmembrado = ([original, novo]: ItemEntradaDTO[]) => {
    setItens(prev => [...prev.map(i => (i.id === original.id ? original : i)), novo])
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

  const irParaOrcamento = () => {
    if (orcamentos.length === 1) {
      navigate(`/orcamentos/${orcamentos[0].id}`)
    } else {
      setModalOrcamentos(true)
    }
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
  const podeEditar = os.status !== 'CONCLUIDA'
  const itensNaoProntos = itens.filter(i => i.status !== 'AGUARDANDO_ENTREGA' && i.status !== 'ENTREGUE')
  const itensAguardandoPeca = itens.filter(i => i.status === 'AGUARDANDO_PECA')
  const podeConfirmarEntrega = !encerrada && itensNaoProntos.length === 0

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
            {os.numeroRelatorio ? ` · relatório: ${os.numeroRelatorio}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={`badge ${STATUS_OS_BADGE[os.status]}`}>{STATUS_OS_LABEL[os.status]}</span>
          {gerandoPdf && <div className="progress-bar" />}
          <button className="btn btn-sm" disabled={gerandoPdf} onClick={baixarPdf}>
            {gerandoPdf ? '// gerando...' : 'Baixar PDF'}
          </button>
        </div>
      </div>

      {erro && <div className="error-banner">{erro}</div>}

      {novasOSCriadas.length > 0 && (
        <div className="section-card" style={{ marginBottom: 20, borderColor: 'var(--green)' }}>
          Itens separados foram movidos pra{' '}
          {novasOSCriadas.map((novaOS, i) => (
            <span key={novaOS.id}>
              <span className="crumb" style={{ cursor: 'pointer' }} onClick={() => navigate(`/os/${novaOS.id}`)}>
                {novaOS.numero}
              </span>
              {i < novasOSCriadas.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {podeEditar && (
          <button className="btn btn-sm" onClick={() => setModalEditar(true)}>Editar</button>
        )}
        {podeConfirmarEntrega && (
          <button className="btn btn-sm btn-green" onClick={() => setModalEntrega(true)}>Confirmar entrega</button>
        )}
        {!encerrada && itens.length > 1 && (
          <button className="btn btn-sm" onClick={() => setModalSeparar('todos')}>Separar</button>
        )}
        {orcamentos.length > 0 && (
          <button className="btn btn-sm" onClick={irParaOrcamento}>
            {orcamentos.length === 1 ? 'Ver orçamento' : `Ver orçamentos (${orcamentos.length})`}
          </button>
        )}
        {!encerrada && (
          <button className="btn btn-sm btn-danger" onClick={() => setModalCancelar(true)}>Cancelar OS</button>
        )}
      </div>

      {!encerrada && itensNaoProntos.length > 0 && (
        <div className="section-card" style={{ marginBottom: 20, borderColor: 'var(--amber)' }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {itensNaoProntos.length} item(ns) ainda não {itensNaoProntos.length > 1 ? 'estão prontos' : 'está pronto'} pra entrega
          </div>
          <div className="page-sub" style={{ marginBottom: itensAguardandoPeca.length > 0 ? 8 : 0 }}>
            A entrega só pode ser confirmada quando todos os itens estiverem aguardando entrega ou entregues.
          </div>
          {itensAguardandoPeca.length > 0 && (
            <button className="btn btn-sm btn-amber" onClick={() => setModalSeparar('aguardando-peca')}>
              Separar itens aguardando peça ({itensAguardandoPeca.length})
            </button>
          )}
        </div>
      )}

      <div className="section-hd">
        <h3>Itens ({itens.length})</h3>
        <button className="btn btn-sm btn-amber" onClick={() => setModalItem(true)}>+ Adicionar item</button>
      </div>

      {itens.length === 0 && <div className="empty">Nenhum item registrado ainda.</div>}

      {itens.map(item => (
        item.status === 'PENDENTE_AVALIACAO' || item.status === 'EM_AVALIACAO'
          ? <AvaliacaoItemCard key={item.id} item={item} onAtualizado={atualizarItem} onRemovido={removerItem} onDesmembrado={itemDesmembrado} />
          : <ItemEntradaCard key={item.id} item={item} onAtualizado={atualizarItem} />
      ))}

      {modalItem && (
        <ItemEntradaForm
          osId={os.id}
          clienteId={os.clienteId}
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

      {modalEditar && (
        <EditarOSModal
          os={os}
          onClose={() => setModalEditar(false)}
          onSalvo={atualizado => { setOs(atualizado); setModalEditar(false) }}
        />
      )}

      {modalSeparar && (
        <SepararOSModal
          itens={itens.filter(i => i.status !== 'ENTREGUE')}
          preSelecionados={modalSeparar === 'aguardando-peca' ? itensAguardandoPeca.map(i => i.id) : []}
          onClose={() => setModalSeparar(null)}
          onSeparado={novasOS => {
            setNovasOSCriadas(novasOS)
            setModalSeparar(null)
            carregar()
          }}
        />
      )}

      {modalOrcamentos && (
        <Modal title="Orçamentos desta OS" onClose={() => setModalOrcamentos(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {orcamentos.map(orc => (
              <div
                key={orc.id}
                className="section-card"
                style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => navigate(`/orcamentos/${orc.id}`)}
              >
                <span>{orc.numero}</span>
                <span className={`badge ${STATUS_ORCAMENTO_BADGE[orc.status]}`}>{STATUS_ORCAMENTO_LABEL[orc.status]}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}

function paraDatetimeLocal(iso: string): string {
  return iso.slice(0, 16)
}

function EditarOSModal({
  os, onClose, onSalvo,
}: {
  os: OrdemServicoDTO
  onClose: () => void
  onSalvo: (os: OrdemServicoDTO) => void
}) {
  const [clienteId, setClienteId] = useState(os.clienteId)
  const [cliente, setCliente] = useState<ClienteDTO | null>(null)
  const [carregandoCliente, setCarregandoCliente] = useState(true)
  const [mostrarCadastroRapido, setMostrarCadastroRapido] = useState(false)
  const [buscaParaCadastro, setBuscaParaCadastro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const {
    register, handleSubmit, formState: { isDirty },
  } = useForm<{ solicitante: string; dataAbertura: string; observacoes: string; numeroRelatorio: string }>({
    defaultValues: {
      solicitante: os.solicitante ?? '',
      dataAbertura: paraDatetimeLocal(os.dataAbertura),
      observacoes: os.observacoes ?? '',
      numeroRelatorio: os.numeroRelatorio ?? '',
    },
  })

  useEffect(() => {
    setCarregandoCliente(true)
    clientesApi
      .buscarCompleto(clienteId)
      .then(setCliente)
      .catch(() => setCliente(null))
      .finally(() => setCarregandoCliente(false))
  }, [clienteId])

  const dirty = isDirty || clienteId !== os.clienteId
  const fechar = () => fecharComConfirmacao(dirty, onClose)

  const onSubmit = handleSubmit(async d => {
    setSalvando(true)
    setErro(null)
    try {
      const payload: AtualizarOrdemServicoRequest = {
        clienteId,
        postoId: os.postoId,
        tecnicoId: os.tecnicoId,
        solicitante: d.solicitante.trim() || undefined,
        dataAbertura: `${d.dataAbertura}:00`,
        observacoes: d.observacoes.trim() || undefined,
        numeroRelatorio: d.numeroRelatorio.trim() || undefined,
      }
      const atualizado = await osApi.atualizar(os.id, payload)
      onSalvo(atualizado)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível salvar a OS.'
      setErro(msg)
      setSalvando(false)
    }
  })

  return (
    <Modal title="Editar OS" onClose={fechar}>
      {erro && <div className="error-banner">{erro}</div>}

      <form onSubmit={onSubmit}>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Cliente</label>
          {carregandoCliente && <div className="form-hint">// carregando cliente...</div>}
          {!carregandoCliente && cliente && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13 }}>{cliente.nomeRazaoSocial}</div>
              <span className="crumb" style={{ cursor: 'pointer' }} onClick={() => setCliente(null)}>trocar</span>
            </div>
          )}
          {!carregandoCliente && !cliente && (
            <ClienteAutocomplete
              onSelecionar={c => { setClienteId(c.id); setCliente(c) }}
              onCadastrarNovo={busca => { setBuscaParaCadastro(busca); setMostrarCadastroRapido(true) }}
            />
          )}
        </div>

        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Solicitante</label>
          <input className="form-input" {...register('solicitante')} />
        </div>

        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Data de abertura</label>
          <input type="datetime-local" className="form-input" {...register('dataAbertura', { required: true })} />
        </div>

        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Número do relatório</label>
          <input className="form-input" placeholder="Relatório manual da retirada dos itens" {...register('numeroRelatorio')} />
        </div>

        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Observações</label>
          <textarea className="form-input" rows={3} {...register('observacoes')} />
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={fechar}>Cancelar</button>
          <button type="submit" className="btn btn-amber" disabled={salvando}>
            {salvando ? '// salvando...' : 'Salvar'}
          </button>
        </div>
      </form>

      {mostrarCadastroRapido && (
        <ClienteRapidoModal
          buscaInicial={buscaParaCadastro}
          onClose={() => setMostrarCadastroRapido(false)}
          onCriado={c => { setClienteId(c.id); setCliente(c); setMostrarCadastroRapido(false) }}
        />
      )}
    </Modal>
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

