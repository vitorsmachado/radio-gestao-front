import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { clientesApi } from '../../api/clientes'
import { itensEntradaApi } from '../../api/itensEntrada'
import { osApi } from '../../api/os'
import ClienteAutocomplete from '../../components/ClienteAutocomplete'
import CatalogoSelector from '../../components/CatalogoSelector'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges'
import type { ClienteDTO } from '../../types/cliente'
import type { CatalogoModeloDTO } from '../../types/catalogo'
import {
  FAIXA_EQUIPAMENTO_LABEL,
  TIPO_OS_LABEL,
  type FaixaEquipamento,
  type ItemEntradaCreateRequest,
  type OrdemServicoDTO,
  type TipoItem,
  type TipoOS,
} from '../../types/os'
import ClienteRapidoModal from '../clientes/ClienteRapidoModal'

interface FormValues {
  solicitante: string
  dataAbertura: string
  observacoes: string
}

type TipoContato = 'COMERCIAL' | 'TECNICO' | 'FINANCEIRO' | 'GERENCIAL'

interface ItemRascunho {
  tempId: string
  tipoItem: TipoItem
  descricao: string
  marca: string
  modelo: string
  faixa: FaixaEquipamento | ''
  numeroSerie: string
  patrimonio: string
  codigoCliente: string
  defeitoRelatado: string
  rastreamento: 'NS' | 'QUANTIDADE'
  quantidade: number
  catalogo: CatalogoModeloDTO | null
}

const TIPOS: TipoOS[] = ['ORCAMENTO_MANUTENCAO']

const TIPO_OS_DESCRICAO: Record<TipoOS, string> = {
  ORCAMENTO_MANUTENCAO: 'Recebe o(s) item(ns) do cliente, avalia, monta orçamento e acompanha até a entrega.',
}

const TIPO_ITEM_LABEL: Record<TipoItem, string> = {
  EQUIPAMENTO: 'Equipamento',
  ACESSORIO: 'Acessório',
  PECA: 'Peça',
  SERVICO: 'Serviço',
}

function agoraDatetimeLocal(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatarDocumento(doc?: string): string {
  if (!doc) return ''
  if (doc.length === 11) return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (doc.length === 14) return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return doc
}

function formatarValor(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function gerarTempId(): string {
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function itemRascunhoVazio(): ItemRascunho {
  return {
    tempId: gerarTempId(),
    tipoItem: 'EQUIPAMENTO',
    descricao: '',
    marca: '',
    modelo: '',
    faixa: '',
    numeroSerie: '',
    patrimonio: '',
    codigoCliente: '',
    defeitoRelatado: '',
    rastreamento: 'NS',
    quantidade: 1,
    catalogo: null,
  }
}

function paraCreateRequest(osId: string, item: ItemRascunho): ItemEntradaCreateRequest {
  const porQuantidade = item.tipoItem === 'ACESSORIO' && item.rastreamento === 'QUANTIDADE'
  return {
    osId,
    tipoItem: item.tipoItem,
    descricao: item.descricao.trim(),
    marca: item.marca.trim() || undefined,
    modelo: item.modelo.trim() || undefined,
    faixa: item.tipoItem === 'EQUIPAMENTO' && item.faixa ? item.faixa : undefined,
    numeroSerie: porQuantidade ? undefined : (item.numeroSerie.trim() || undefined),
    patrimonio: porQuantidade ? undefined : (item.patrimonio.trim() || undefined),
    codigoCliente: item.codigoCliente.trim() || undefined,
    quantidade: porQuantidade ? (Number(item.quantidade) || 1) : 1,
    defeitoRelatado: item.defeitoRelatado.trim() || undefined,
    catalogoModeloId: item.catalogo?.id,
  }
}

export default function OsForm() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [tipo, setTipo] = useState<TipoOS | null>(null)

  const [clienteId, setClienteId] = useState<string | null>(searchParams.get('clienteId'))
  const [cliente, setCliente] = useState<ClienteDTO | null>(null)
  const [carregandoCliente, setCarregandoCliente] = useState(!!clienteId)
  const [mostrarCadastroRapido, setMostrarCadastroRapido] = useState(false)
  const [buscaParaCadastro, setBuscaParaCadastro] = useState('')

  const [novoContatoAberto, setNovoContatoAberto] = useState(false)
  const [novoContatoNome, setNovoContatoNome] = useState('')
  const [novoContatoTipo, setNovoContatoTipo] = useState<TipoContato>('COMERCIAL')
  const [novoContatoTelefone, setNovoContatoTelefone] = useState('')
  const [novoContatoCargo, setNovoContatoCargo] = useState('')
  const [salvandoContato, setSalvandoContato] = useState(false)
  const [erroContato, setErroContato] = useState<string | null>(null)

  const [itensRascunho, setItensRascunho] = useState<ItemRascunho[]>([])
  const [expandido, setExpandido] = useState<string[]>([])
  const [tentouSalvar, setTentouSalvar] = useState(false)

  const [osCriada, setOsCriada] = useState<OrdemServicoDTO | null>(null)
  const [erroCriacao, setErroCriacao] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting, isDirty: formIsDirty },
  } = useForm<FormValues>({
    defaultValues: { solicitante: '', dataAbertura: agoraDatetimeLocal(), observacoes: '' },
  })

  const isDirty = formIsDirty || !!clienteId || itensRascunho.length > 0
  useUnsavedChanges(isDirty && !isSubmitting)

  useEffect(() => {
    if (!clienteId) {
      setCliente(null)
      return
    }
    setCarregandoCliente(true)
    clientesApi
      .buscarCompleto(clienteId)
      .then(setCliente)
      .catch(() => setCliente(null))
      .finally(() => setCarregandoCliente(false))
  }, [clienteId])

  const selecionarCliente = (c: ClienteDTO) => setClienteId(c.id)
  const trocarCliente = () => { setClienteId(null); setCliente(null) }

  const abrirCadastroRapido = (busca: string) => {
    setBuscaParaCadastro(busca)
    setMostrarCadastroRapido(true)
  }

  const salvarContato = async () => {
    if (!clienteId || !novoContatoNome.trim()) return
    setSalvandoContato(true)
    setErroContato(null)
    try {
      const clienteAtualizado = await clientesApi.criarContato(clienteId, {
        nome: novoContatoNome.trim(),
        tipo: novoContatoTipo,
        telefone: novoContatoTelefone.trim() || undefined,
        cargo: novoContatoCargo.trim() || undefined,
      })
      setCliente(clienteAtualizado)
      setValue('solicitante', novoContatoNome.trim())
      setNovoContatoAberto(false)
      setNovoContatoNome('')
      setNovoContatoTelefone('')
      setNovoContatoCargo('')
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível cadastrar o contato.'
      setErroContato(msg)
    } finally {
      setSalvandoContato(false)
    }
  }

  const adicionarItem = () => {
    const novo = itemRascunhoVazio()
    setItensRascunho(prev => [...prev, novo])
    setExpandido(prev => [...prev, novo.tempId])
  }

  const atualizarItem = (tempId: string, patch: Partial<ItemRascunho>) =>
    setItensRascunho(prev => prev.map(it => (it.tempId === tempId ? { ...it, ...patch } : it)))

  const removerItem = (tempId: string) => {
    setItensRascunho(prev => prev.filter(it => it.tempId !== tempId))
    setExpandido(prev => prev.filter(id => id !== tempId))
  }

  const duplicarItem = (tempId: string) => {
    const original = itensRascunho.find(it => it.tempId === tempId)
    if (!original) return
    const copia: ItemRascunho = {
      ...original,
      tempId: gerarTempId(),
      // Identificadores da unidade física não fazem sentido repetidos — o resto (tipo, marca,
      // modelo, catálogo, defeito relatado) é o que poupa trabalho ao duplicar.
      numeroSerie: '',
      patrimonio: '',
      codigoCliente: '',
    }
    setItensRascunho(prev => [...prev, copia])
    setExpandido(prev => [...prev, copia.tempId])
  }

  const toggleExpandido = (tempId: string) =>
    setExpandido(prev => (prev.includes(tempId) ? prev.filter(id => id !== tempId) : [...prev, tempId]))

  const criarOS = handleSubmit(async d => {
    if (!clienteId) return
    setErroCriacao(null)

    const itensSemDescricao = itensRascunho.filter(i => !i.descricao.trim())
    if (itensSemDescricao.length > 0) {
      setTentouSalvar(true)
      setExpandido(prev => [...new Set([...prev, ...itensSemDescricao.map(i => i.tempId)])])
      setErroCriacao('Preencha a descrição de todos os itens antes de criar a OS.')
      return
    }

    let novaOS: OrdemServicoDTO
    try {
      novaOS = await osApi.criar({
        clienteId,
        solicitante: d.solicitante.trim() || undefined,
        dataAbertura: d.dataAbertura ? `${d.dataAbertura}:00` : undefined,
        observacoes: d.observacoes.trim() || undefined,
      })
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível abrir a OS.'
      setErroCriacao(msg)
      return
    }

    try {
      for (const item of itensRascunho) {
        await itensEntradaApi.criar(paraCreateRequest(novaOS.id, item))
      }
      navigate(`/os/${novaOS.id}`)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível registrar um dos itens.'
      setOsCriada(novaOS)
      setErroCriacao(`OS ${novaOS.numero} foi aberta, mas: ${msg} — abra a OS para concluir a entrada dos itens.`)
    }
  })

  if (!tipo) {
    return (
      <div className="fade-in">
        <div className="page-header">
          <div>
            <div className="page-title">Nova Ordem de Serviço</div>
            <div className="page-sub">// selecione o tipo de OS</div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12, maxWidth: 480 }}>
          {TIPOS.map(t => (
            <div key={t} className="section-card" style={{ cursor: 'pointer' }} onClick={() => setTipo(t)}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{TIPO_OS_LABEL[t]}</div>
              <div className="page-sub">{TIPO_OS_DESCRICAO[t]}</div>
            </div>
          ))}
        </div>

        <div className="footer-actions">
          <div className="footer-left">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
          </div>
          <div className="footer-right" />
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Nova Ordem de Serviço</div>
          <div className="page-sub" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>// Tipo: {TIPO_OS_LABEL[tipo]}</span>
            <span className="crumb" style={{ cursor: 'pointer' }} onClick={() => setTipo(null)}>trocar</span>
          </div>
        </div>
      </div>

      {erroCriacao && (
        <div className="error-banner">
          {erroCriacao}
          {osCriada && (
            <>
              {' '}
              <span className="crumb" style={{ cursor: 'pointer' }} onClick={() => navigate(`/os/${osCriada.id}`)}>
                Ir para a OS {osCriada.numero} →
              </span>
            </>
          )}
        </div>
      )}

      <form onSubmit={criarOS} style={{ maxWidth: 640 }}>
        <div className="section-card">
          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Cliente</label>
            {!clienteId && (
              <ClienteAutocomplete onSelecionar={selecionarCliente} onCadastrarNovo={abrirCadastroRapido} />
            )}
            {clienteId && carregandoCliente && <div className="form-hint">// carregando cliente...</div>}
            {clienteId && !carregandoCliente && cliente && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13 }}>{cliente.nomeRazaoSocial}</div>
                  <div className="page-sub">{formatarDocumento(cliente.documento)}</div>
                </div>
                <span className="crumb" style={{ cursor: 'pointer' }} onClick={trocarCliente}>trocar</span>
              </div>
            )}
          </div>

          {clienteId && (
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label className="form-label">Solicitante (quem deixou o item)</label>
              <input className="form-input" {...register('solicitante')} />
              {cliente && cliente.contatos && cliente.contatos.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {cliente.contatos.map(c => (
                    <span
                      key={c.id} className="badge b-gray" style={{ cursor: 'pointer' }}
                      onClick={() => setValue('solicitante', c.nome)}
                    >
                      {c.nome}{c.cargo ? ` · ${c.cargo}` : ''}
                    </span>
                  ))}
                </div>
              )}
              {!novoContatoAberto && (
                <span
                  className="crumb" style={{ cursor: 'pointer', display: 'inline-block', marginTop: 6 }}
                  onClick={() => setNovoContatoAberto(true)}
                >
                  + novo contato
                </span>
              )}
              {novoContatoAberto && (
                <div className="section-card" style={{ marginTop: 8, background: 'var(--bg3)' }}>
                  {erroContato && <div className="error-banner">{erroContato}</div>}
                  <div className="form-row form-row-2" style={{ marginBottom: 8 }}>
                    <div className="form-field">
                      <label className="form-label">Nome</label>
                      <input className="form-input" value={novoContatoNome} onChange={e => setNovoContatoNome(e.target.value)} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Tipo</label>
                      <select className="form-select" value={novoContatoTipo} onChange={e => setNovoContatoTipo(e.target.value as TipoContato)}>
                        <option value="COMERCIAL">Comercial</option>
                        <option value="TECNICO">Técnico</option>
                        <option value="FINANCEIRO">Financeiro</option>
                        <option value="GERENCIAL">Gerencial</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-row form-row-2" style={{ marginBottom: 8 }}>
                    <div className="form-field">
                      <label className="form-label">Telefone</label>
                      <input className="form-input" value={novoContatoTelefone} onChange={e => setNovoContatoTelefone(e.target.value)} />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Cargo</label>
                      <input className="form-input" value={novoContatoCargo} onChange={e => setNovoContatoCargo(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => setNovoContatoAberto(false)}>Cancelar</button>
                    <button
                      type="button" className="btn btn-sm btn-amber" disabled={salvandoContato || !novoContatoNome.trim()}
                      onClick={salvarContato}
                    >
                      {salvandoContato ? '// salvando...' : 'Salvar contato'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Data e hora de abertura</label>
            <input type="datetime-local" className="form-input" {...register('dataAbertura')} />
          </div>

          <div className="form-field">
            <label className="form-label">Observações</label>
            <textarea className="form-input" rows={3} {...register('observacoes')} />
          </div>
        </div>

        <div className="section-hd">
          <h3>Itens de entrada ({itensRascunho.length})</h3>
        </div>

        {itensRascunho.length === 0 && <div className="empty">Nenhum item adicionado ainda.</div>}

        {itensRascunho.map(item => (
          <ItemRascunhoCard
            key={item.tempId}
            item={item}
            expandido={expandido.includes(item.tempId)}
            mostrarErro={tentouSalvar}
            onToggle={() => toggleExpandido(item.tempId)}
            onAtualizar={patch => atualizarItem(item.tempId, patch)}
            onRemover={() => removerItem(item.tempId)}
            onDuplicar={() => duplicarItem(item.tempId)}
          />
        ))}

        <button
          type="button" className="btn btn-sm btn-amber"
          style={{ marginBottom: 12 }}
          onClick={adicionarItem}
        >
          + Adicionar item
        </button>

        <div className="footer-actions">
          <div className="footer-left">
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancelar</button>
          </div>
          <div className="footer-right">
            <button type="submit" className="btn btn-amber" disabled={isSubmitting || !clienteId}>
              {isSubmitting ? '// abrindo...' : 'Criar OS'}
            </button>
          </div>
        </div>
      </form>

      {mostrarCadastroRapido && (
        <ClienteRapidoModal
          buscaInicial={buscaParaCadastro}
          onClose={() => setMostrarCadastroRapido(false)}
          onCriado={c => { setClienteId(c.id); setMostrarCadastroRapido(false) }}
        />
      )}
    </div>
  )
}

function ItemRascunhoCard({
  item, expandido, mostrarErro, onToggle, onAtualizar, onRemover, onDuplicar,
}: {
  item: ItemRascunho
  expandido: boolean
  mostrarErro: boolean
  onToggle: () => void
  onAtualizar: (patch: Partial<ItemRascunho>) => void
  onRemover: () => void
  onDuplicar: () => void
}) {
  const porQuantidade = item.tipoItem === 'ACESSORIO' && item.rastreamento === 'QUANTIDADE'
  const usaCatalogo = item.tipoItem === 'EQUIPAMENTO' || item.tipoItem === 'ACESSORIO'
  const descricaoInvalida = mostrarErro && !item.descricao.trim()

  const selecionarCatalogo = (c: CatalogoModeloDTO | null) => {
    if (!c) { onAtualizar({ catalogo: null }); return }
    const patch: Partial<ItemRascunho> = { catalogo: c, marca: c.marca, modelo: c.modelo }
    if (c.descricao) patch.descricao = c.descricao
    if (item.tipoItem === 'ACESSORIO') patch.rastreamento = c.controlePorSerie ? 'NS' : 'QUANTIDADE'
    onAtualizar(patch)
  }

  const limparItem = () => onAtualizar({
    tipoItem: 'EQUIPAMENTO',
    descricao: '',
    marca: '',
    modelo: '',
    faixa: '',
    numeroSerie: '',
    patrimonio: '',
    codigoCliente: '',
    defeitoRelatado: '',
    rastreamento: 'NS',
    quantidade: 1,
    catalogo: null,
  })

  return (
    <div className="section-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, cursor: 'pointer' }}
        onClick={onToggle}
      >
        <div>
          <div style={{ fontWeight: 600 }}>{item.descricao || '(sem descrição)'}</div>
          <div className="page-sub">
            {TIPO_ITEM_LABEL[item.tipoItem]}
            {[item.marca, item.modelo].filter(Boolean).length > 0 ? ` · ${[item.marca, item.modelo].filter(Boolean).join(' / ')}` : ''}
            {item.faixa ? ` · ${FAIXA_EQUIPAMENTO_LABEL[item.faixa]}` : ''}
            {item.numeroSerie ? ` · S/N ${item.numeroSerie}` : ''}
            {item.quantidade > 1 ? ` · Qtd. ${item.quantidade}` : ''}
            {item.catalogo?.valorReferencia != null ? ` · ref. ${formatarValor(item.catalogo.valorReferencia)}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="button" className="btn btn-sm btn-ghost"
            onClick={e => { e.stopPropagation(); onDuplicar() }}
          >
            Duplicar
          </button>
          <button
            type="button" className="btn btn-sm btn-ghost"
            onClick={e => { e.stopPropagation(); limparItem() }}
          >
            Limpar
          </button>
          <button
            type="button" className="btn btn-sm btn-ghost"
            onClick={e => { e.stopPropagation(); onRemover() }}
          >
            Remover
          </button>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{expandido ? '▲' : '▼'}</span>
        </div>
      </div>

      {expandido && (
        <div style={{ padding: 14, borderTop: '0.5px solid var(--border)' }}>
          <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
            <div className="form-field">
              <label className="form-label">Tipo</label>
              <select
                className="form-select" value={item.tipoItem}
                onChange={e => onAtualizar({ tipoItem: e.target.value as TipoItem, catalogo: null })}
              >
                <option value="EQUIPAMENTO">Equipamento</option>
                <option value="ACESSORIO">Acessório</option>
              </select>
            </div>
            {usaCatalogo && (
              <div className="form-field">
                <label className="form-label">Modelo no catálogo</label>
                <CatalogoSelector tipoItem={item.tipoItem} selecionado={item.catalogo} onSelecionar={selecionarCatalogo} />
              </div>
            )}
          </div>

          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Descrição</label>
            <input
              className={`form-input${descricaoInvalida ? ' error' : ''}`} placeholder="Rádio Motorola EP450"
              value={item.descricao} onChange={e => onAtualizar({ descricao: e.target.value })}
            />
            {descricaoInvalida && <span className="form-error">Descrição obrigatória</span>}
          </div>

          <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
            <div className="form-field">
              <label className="form-label">Marca</label>
              <input className="form-input" value={item.marca} onChange={e => onAtualizar({ marca: e.target.value })} />
            </div>
            <div className="form-field">
              <label className="form-label">Modelo</label>
              <input className="form-input" value={item.modelo} onChange={e => onAtualizar({ modelo: e.target.value })} />
            </div>
          </div>

          {item.tipoItem === 'EQUIPAMENTO' && (
            <div className="form-field" style={{ marginBottom: 12, maxWidth: 200 }}>
              <label className="form-label">Faixa</label>
              <select
                className="form-select" value={item.faixa}
                onChange={e => onAtualizar({ faixa: e.target.value as FaixaEquipamento | '' })}
              >
                <option value="">Selecione</option>
                {Object.entries(FAIXA_EQUIPAMENTO_LABEL).map(([valor, label]) => (
                  <option key={valor} value={valor}>{label}</option>
                ))}
              </select>
            </div>
          )}

          {item.tipoItem === 'ACESSORIO' && (
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label className="form-label">Rastreamento</label>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio" checked={item.rastreamento === 'NS'}
                    onChange={() => onAtualizar({ rastreamento: 'NS' })}
                  />
                  Rastreado (N/S ou patrimônio)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
                  <input
                    type="radio" checked={item.rastreamento === 'QUANTIDADE'}
                    onChange={() => onAtualizar({ rastreamento: 'QUANTIDADE' })}
                  />
                  Por quantidade
                </label>
              </div>
              <div className="form-hint" style={{ marginTop: 4 }}>
                Use "por quantidade" para acessórios sem identificação individual — ex: antenas genéricas.
              </div>
            </div>
          )}

          {porQuantidade ? (
            <div className="form-field" style={{ marginBottom: 12, maxWidth: 160 }}>
              <label className="form-label">Quantidade</label>
              <input
                type="number" min={1} className="form-input"
                value={item.quantidade}
                onChange={e => onAtualizar({ quantidade: Number(e.target.value) || 1 })}
              />
            </div>
          ) : (
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label className="form-label">Número de série</label>
              <input className="form-input" value={item.numeroSerie} onChange={e => onAtualizar({ numeroSerie: e.target.value })} />
            </div>
          )}

          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Código do cliente</label>
            <input
              className="form-input" placeholder="Identificação própria do cliente pro item"
              value={item.codigoCliente} onChange={e => onAtualizar({ codigoCliente: e.target.value })}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Defeito relatado pelo cliente</label>
            <textarea
              className="form-input" rows={3}
              value={item.defeitoRelatado} onChange={e => onAtualizar({ defeitoRelatado: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
