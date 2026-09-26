import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { clientesApi } from '../../api/clientes'
import { itensEntradaApi } from '../../api/itensEntrada'
import { osApi } from '../../api/os'
import ClienteAutocomplete from '../../components/ClienteAutocomplete'
import { useUnsavedChanges } from '../../hooks/useUnsavedChanges'
import type { ClienteDTO } from '../../types/cliente'
import {
  FAIXA_EQUIPAMENTO_LABEL,
  TIPO_OS_LABEL,
  type OrdemServicoDTO,
  type TipoItem,
  type TipoOS,
} from '../../types/os'
import ClienteRapidoModal from '../clientes/ClienteRapidoModal'
import ItemRascunhoFields from './ItemRascunhoFields'
import { gerarTempId, itemRascunhoVazio, paraCreateRequest, type ItemRascunho } from './itemRascunho'

interface FormValues {
  solicitante: string
  dataAbertura: string
  observacoes: string
  numeroRelatorio: string
}

type TipoContato = 'COMERCIAL' | 'TECNICO' | 'FINANCEIRO' | 'GERENCIAL'

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
    defaultValues: { solicitante: '', dataAbertura: agoraDatetimeLocal(), observacoes: '', numeroRelatorio: '' },
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
        numeroRelatorio: d.numeroRelatorio.trim() || undefined,
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
        await itensEntradaApi.criar(await paraCreateRequest(novaOS.id, clienteId, item))
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

          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Número do relatório</label>
            <input className="form-input" placeholder="Relatório manual da retirada dos itens" {...register('numeroRelatorio')} />
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
  const descricaoInvalida = mostrarErro && !item.descricao.trim()

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
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            type="button" className="btn btn-sm"
            onClick={e => { e.stopPropagation(); onDuplicar() }}
          >
            Duplicar
          </button>
          <button
            type="button" className="btn btn-sm"
            onClick={e => { e.stopPropagation(); limparItem() }}
          >
            Limpar
          </button>
          <button
            type="button" className="btn btn-sm"
            onClick={e => { e.stopPropagation(); onRemover() }}
          >
            Remover
          </button>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>{expandido ? '▲' : '▼'}</span>
        </div>
      </div>

      {expandido && (
        <div style={{ padding: 14, borderTop: '0.5px solid var(--border)' }}>
          <ItemRascunhoFields item={item} descricaoInvalida={descricaoInvalida} onAtualizar={onAtualizar} />
        </div>
      )}
    </div>
  )
}
