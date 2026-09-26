import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { itensEntradaApi } from '../../api/itensEntrada'
import { itensEntradaAvaliacaoApi } from '../../api/os'
import Modal from '../../components/Modal'
import PecaCompativelSelector from '../../components/PecaCompativelSelector'
import AvaliacaoTecnicaFields, { valoresIniciais, type AvaliacaoTecnicaValores } from './AvaliacaoTecnicaFields'
import {
  FAIXA_EQUIPAMENTO_LABEL,
  type AvaliarItemRequest,
  type ItemConsertoCreateRequest,
  type ItemEntradaDTO,
  type StatusItemEntrada,
  type TipoItem,
  type TipoItemConserto,
} from '../../types/os'
import type { PecaDTO } from '../../types/peca'

const STATUS_LABEL: Record<StatusItemEntrada, string> = {
  PENDENTE_AVALIACAO: 'Pendente de avaliação',
  EM_AVALIACAO: 'Em avaliação',
  AVALIADO: 'Avaliado',
  PENDENTE_AUTORIZACAO: 'Pendente de autorização',
  AUTORIZADO: 'Autorizado',
  NAO_AUTORIZADO: 'Não autorizado',
  PENDENTE_MANUTENCAO: 'Pendente de manutenção',
  AGUARDANDO_PECA: 'Aguardando peça',
  EM_MANUTENCAO: 'Em manutenção',
  MANUTENCAO_CONCLUIDA: 'Manutenção concluída',
  AGUARDANDO_ENTREGA: 'Aguardando entrega',
  ENTREGUE: 'Entregue',
}

const STATUS_BADGE: Record<StatusItemEntrada, string> = {
  PENDENTE_AVALIACAO: 'b-gray',
  EM_AVALIACAO: 'b-purple',
  AVALIADO: 'b-blue',
  PENDENTE_AUTORIZACAO: 'b-amber',
  AUTORIZADO: 'b-green',
  NAO_AUTORIZADO: 'b-red',
  PENDENTE_MANUTENCAO: 'b-amber',
  AGUARDANDO_PECA: 'b-purple',
  EM_MANUTENCAO: 'b-blue',
  MANUTENCAO_CONCLUIDA: 'b-green',
  AGUARDANDO_ENTREGA: 'b-amber',
  ENTREGUE: 'b-green',
}

const TIPO_CONSERTO_LABEL: Record<TipoItemConserto, string> = {
  PECA: 'Peça',
  MAO_DE_OBRA: 'Mão de obra',
  DESLOCAMENTO: 'Deslocamento',
}

function formatarMoeda(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

type Acao = 'avaliar' | 'atualizar-avaliacao' | 'nao-autorizar' | 'adicionar-conserto' | null

interface Props {
  item: ItemEntradaDTO
  onAtualizado: (item: ItemEntradaDTO) => void
}

export default function ItemEntradaCard({ item, onAtualizado }: Props) {
  const [acao, setAcao] = useState<Acao>(null)
  const [processando, setProcessando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const executar = async (fn: () => Promise<ItemEntradaDTO>) => {
    setProcessando(true)
    setErro(null)
    try {
      const atualizado = await fn()
      onAtualizado(atualizado)
      setAcao(null)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível concluir a ação.'
      setErro(msg)
    } finally {
      setProcessando(false)
    }
  }

  const podeAdicionarConserto = item.status !== 'ENTREGUE'
  const podeAtualizarAvaliacao = item.status !== 'ENTREGUE' && item.status !== 'PENDENTE_AVALIACAO'

  return (
    <div className="section-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontWeight: 600 }}>{item.descricao}</div>
          <div className="page-sub">
            {[item.marca, item.modelo].filter(Boolean).join(' / ') || '—'}
            {item.faixa ? ` · ${FAIXA_EQUIPAMENTO_LABEL[item.faixa]}` : ''}
            {item.numeroSerie ? ` · S/N ${item.numeroSerie}` : ''}
            {item.codigoCliente ? ` · Cód. cliente ${item.codigoCliente}` : ''}
            {item.quantidade > 1 ? ` · Qtd. ${item.quantidade}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {item.garantia && <span className="badge b-green">Garantia</span>}
          <span className={`badge ${STATUS_BADGE[item.status]}`}>{STATUS_LABEL[item.status]}</span>
        </div>
      </div>

      {erro && <div className="error-banner">{erro}</div>}

      <div style={{ fontSize: 13, marginBottom: 8 }}>
        <div><span className="form-label" style={{ display: 'inline' }}>Defeito relatado: </span>{item.defeitoRelatado || '—'}</div>
        {item.avaliacaoTecnica && (
          <div><span className="form-label" style={{ display: 'inline' }}>Avaliação técnica: </span>{item.avaliacaoTecnica}</div>
        )}
        {item.motivoNaoAutorizado && (
          <div><span className="form-label" style={{ display: 'inline' }}>Motivo não autorizado: </span>{item.motivoNaoAutorizado}</div>
        )}
      </div>

      {item.itensConserto.length > 0 && (
        <table className="table" style={{ marginBottom: 8 }}>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Descrição</th>
              <th>Qtd.</th>
              <th>Valor unit.</th>
              <th>Valor total</th>
            </tr>
          </thead>
          <tbody>
            {item.itensConserto.map(ic => (
              <tr key={ic.id}>
                <td>{TIPO_CONSERTO_LABEL[ic.tipo]}</td>
                <td>{ic.descricao || '—'}</td>
                <td>{ic.quantidade}</td>
                <td>{formatarMoeda(ic.valorUnitario)}</td>
                <td>{formatarMoeda(ic.valorTotal)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>Total</td>
              <td style={{ fontWeight: 600 }}>{formatarMoeda(item.valorTotalConserto)}</td>
            </tr>
          </tbody>
        </table>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {item.status === 'PENDENTE_AVALIACAO' && (
          <button className="btn btn-sm btn-amber" onClick={() => setAcao('avaliar')}>Avaliar</button>
        )}
        {podeAtualizarAvaliacao && (
          <button className="btn btn-sm" onClick={() => setAcao('atualizar-avaliacao')}>Atualizar avaliação</button>
        )}

        {item.status === 'AVALIADO' && !item.semDefeito && (
          <button className="btn btn-sm btn-amber" disabled={processando}
            onClick={() => executar(() => itensEntradaApi.enviarParaAutorizacao(item.id))}>
            Enviar para autorização
          </button>
        )}
        {item.status === 'AVALIADO' && item.semDefeito && (
          <button className="btn btn-sm btn-amber" disabled={processando}
            onClick={() => executar(() => itensEntradaApi.aguardarEntrega(item.id))}>
            Marcar aguardando entrega
          </button>
        )}

        {(item.status === 'PENDENTE_AUTORIZACAO' || item.status === 'NAO_AUTORIZADO') && (
          <button className="btn btn-sm btn-green" disabled={processando}
            onClick={() => executar(() => itensEntradaApi.autorizar(item.id))}>
            {item.status === 'NAO_AUTORIZADO' ? 'Reautorizar' : 'Autorizar'}
          </button>
        )}
        {['PENDENTE_AUTORIZACAO', 'AUTORIZADO', 'PENDENTE_MANUTENCAO', 'AGUARDANDO_PECA'].includes(item.status) && (
          <button className="btn btn-sm btn-danger" onClick={() => setAcao('nao-autorizar')}>Não autorizar</button>
        )}
        {item.status === 'NAO_AUTORIZADO' && (
          <button className="btn btn-sm btn-amber" disabled={processando}
            onClick={() => executar(() => itensEntradaApi.aguardarEntrega(item.id))}>
            Marcar aguardando entrega
          </button>
        )}

        {item.status === 'PENDENTE_MANUTENCAO' && (
          <button className="btn btn-sm btn-amber" disabled={processando}
            onClick={() => executar(() => itensEntradaApi.iniciarManutencao(item.id))}>
            Iniciar manutenção
          </button>
        )}
        {item.status === 'EM_MANUTENCAO' && (
          <>
            <button className="btn btn-sm btn-green" disabled={processando}
              onClick={() => executar(() => itensEntradaApi.concluirManutencao(item.id))}>
              Concluir manutenção
            </button>
            <button className="btn btn-sm" disabled={processando}
              onClick={() => executar(() => itensEntradaApi.marcarAguardandoPeca(item.id))}>
              Faltou peça
            </button>
          </>
        )}
        {item.status === 'MANUTENCAO_CONCLUIDA' && (
          <button className="btn btn-sm btn-amber" disabled={processando}
            onClick={() => executar(() => itensEntradaApi.aguardarEntrega(item.id))}>
            Marcar aguardando entrega
          </button>
        )}
        {item.status === 'AGUARDANDO_PECA' && (
          <>
            {!item.confirmadoAguardandoPecaEm ? (
              <button className="btn btn-sm" disabled={processando}
                onClick={() => executar(() => itensEntradaAvaliacaoApi.confirmarAguardandoPeca(item.id))}>
                Confirmar aguardando peça
              </button>
            ) : (
              <div className="form-hint" style={{ alignSelf: 'center' }}>
                Confirmado — no final da fila até a peça chegar.
              </div>
            )}
          </>
        )}
        {item.status === 'AGUARDANDO_ENTREGA' && (
          <button className="btn btn-sm btn-green" disabled={processando}
            onClick={() => executar(() => itensEntradaApi.entregar(item.id))}>
            Confirmar entrega do item
          </button>
        )}

        {podeAdicionarConserto && (
          <button className="btn btn-sm btn-ghost" onClick={() => setAcao('adicionar-conserto')}>
            + Item de conserto
          </button>
        )}
      </div>

      {acao === 'avaliar' && (
        <AvaliarModal
          inicial={{ avaliacaoTecnica: item.avaliacaoTecnica ?? '', semDefeito: item.semDefeito }}
          onClose={() => setAcao(null)}
          onSalvar={dados => executar(() => itensEntradaApi.avaliar(item.id, dados))}
          processando={processando}
        />
      )}

      {acao === 'atualizar-avaliacao' && (
        <AtualizarAvaliacaoModal
          item={item}
          onClose={() => setAcao(null)}
          onAtualizado={onAtualizado}
        />
      )}

      {acao === 'nao-autorizar' && (
        <MotivoModal
          titulo="Não autorizar conserto"
          onClose={() => setAcao(null)}
          onSalvar={motivo => executar(() => itensEntradaApi.naoAutorizar(item.id, motivo))}
          processando={processando}
        />
      )}

      {acao === 'adicionar-conserto' && (
        <ItemConsertoModal
          semCusto={item.garantia}
          tipoItem={item.tipoItem}
          catalogoModeloId={item.catalogoModeloId}
          catalogoValorReferencia={item.catalogoValorReferencia}
          descricaoItem={item.descricao}
          onClose={() => setAcao(null)}
          onSalvar={dados => executar(() => itensEntradaApi.adicionarItemConserto(item.id, dados))}
          processando={processando}
        />
      )}
    </div>
  )
}

function AvaliarModal({
  inicial, onClose, onSalvar, processando,
}: {
  inicial: AvaliarItemRequest
  onClose: () => void
  onSalvar: (dados: AvaliarItemRequest) => void
  processando: boolean
}) {
  const [avaliacaoTecnica, setAvaliacaoTecnica] = useState(inicial.avaliacaoTecnica)
  const [semDefeito, setSemDefeito] = useState(inicial.semDefeito)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    onSalvar({ avaliacaoTecnica, semDefeito })
  }

  return (
    <Modal title="Avaliar item" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Avaliação técnica</label>
          <textarea className="form-input" rows={4} value={avaliacaoTecnica} onChange={e => setAvaliacaoTecnica(e.target.value)} />
        </div>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Resultado</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className={`btn btn-sm${!semDefeito ? ' btn-amber' : ''}`} onClick={() => setSemDefeito(false)}>
              Com defeito
            </button>
            <button type="button" className={`btn btn-sm${semDefeito ? ' btn-amber' : ''}`} onClick={() => setSemDefeito(true)}>
              Sem defeito
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-amber" disabled={processando}>Salvar</button>
        </div>
      </form>
    </Modal>
  )
}

function MotivoModal({
  titulo, onClose, onSalvar, processando,
}: {
  titulo: string
  onClose: () => void
  onSalvar: (motivo: string) => void
  processando: boolean
}) {
  const { register, handleSubmit, formState: { errors } } = useForm<{ motivo: string }>()

  return (
    <Modal title={titulo} onClose={onClose}>
      <form onSubmit={handleSubmit(d => onSalvar(d.motivo))}>
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
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-danger" disabled={processando}>Confirmar</button>
        </div>
      </form>
    </Modal>
  )
}

function ItemConsertoModal({
  semCusto, tipoItem, catalogoModeloId, catalogoValorReferencia, descricaoItem, onClose, onSalvar, processando,
}: {
  semCusto?: boolean
  tipoItem: TipoItem
  catalogoModeloId?: string
  catalogoValorReferencia?: number
  descricaoItem: string
  onClose: () => void
  onSalvar: (dados: ItemConsertoCreateRequest) => void
  processando: boolean
}) {
  const [tipo, setTipo] = useState<TipoItemConserto>('PECA')
  const [pecaSelecionada, setPecaSelecionada] = useState<PecaDTO | null>(null)
  const [descricao, setDescricao] = useState('')
  const [quantidade, setQuantidade] = useState('1')
  const [valorUnitario, setValorUnitario] = useState(semCusto ? '0' : '')

  const isPecaEquipamento = tipo === 'PECA' && tipoItem === 'EQUIPAMENTO'
  const isAcessorioNovo = tipo === 'PECA' && tipoItem === 'ACESSORIO'

  const mudarTipo = (novoTipo: TipoItemConserto) => {
    setTipo(novoTipo)
    setPecaSelecionada(null)
    if (novoTipo === 'PECA' && tipoItem === 'ACESSORIO' && !semCusto) {
      setValorUnitario(catalogoValorReferencia ? String(catalogoValorReferencia) : '')
    }
  }

  const selecionarPeca = (peca: PecaDTO) => {
    setPecaSelecionada(peca)
    if (!semCusto) {
      setValorUnitario(peca.valorUnitario ? String(peca.valorUnitario) : '')
    }
  }

  const podeSubmeter = isPecaEquipamento
    ? pecaSelecionada != null
    : Number(quantidade) > 0 && (semCusto || valorUnitario !== '')

  const submit = () => {
    if (!podeSubmeter) return
    const base = {
      quantidade: Number(quantidade) || 1,
      valorUnitario: semCusto ? 0 : Number(valorUnitario) || 0,
    }
    if (isPecaEquipamento && pecaSelecionada) {
      onSalvar({ tipo: 'PECA', itemEstoqueId: pecaSelecionada.id, descricao: pecaSelecionada.descricao, ...base })
    } else if (isAcessorioNovo) {
      onSalvar({ tipo: 'PECA', descricao: `${descricaoItem} (novo)`, ...base })
    } else {
      onSalvar({ tipo, descricao: descricao || undefined, ...base })
    }
  }

  return (
    <Modal title="Adicionar item de conserto" onClose={onClose}>
      {semCusto && (
        <div className="form-hint" style={{ marginBottom: 12 }}>Garantia — sem custo.</div>
      )}
      <div className="form-field" style={{ marginBottom: 12 }}>
        <label className="form-label">Tipo</label>
        <select className="form-select" value={tipo} onChange={e => mudarTipo(e.target.value as TipoItemConserto)}>
          <option value="PECA">Peça</option>
          <option value="MAO_DE_OBRA">Mão de obra</option>
          <option value="DESLOCAMENTO">Deslocamento</option>
        </select>
      </div>

      {isPecaEquipamento && (
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Peça</label>
          <PecaCompativelSelector catalogoModeloId={catalogoModeloId} onSelecionar={selecionarPeca} />
          {pecaSelecionada && (
            <div className="form-hint" style={{ marginTop: 6 }}>Selecionada: {pecaSelecionada.descricao}</div>
          )}
        </div>
      )}

      {isAcessorioNovo && (
        <div className="form-hint" style={{ marginBottom: 12 }}>Acessório novo — {descricaoItem}.</div>
      )}

      {!isPecaEquipamento && !isAcessorioNovo && (
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Descrição</label>
          <input className="form-input" value={descricao} onChange={e => setDescricao(e.target.value)} />
        </div>
      )}

      <div className="form-row form-row-2">
        <div className="form-field">
          <label className="form-label">Quantidade</label>
          <input
            type="number" min={1} step={1} className="form-input"
            value={quantidade} onChange={e => setQuantidade(e.target.value)}
          />
        </div>
        {!semCusto && (
          <div className="form-field">
            <label className="form-label">Valor unitário (R$)</label>
            <input
              type="number" min={0} step="0.01" className="form-input"
              value={valorUnitario} onChange={e => setValorUnitario(e.target.value)}
            />
          </div>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-amber" disabled={processando || !podeSubmeter} onClick={submit}>
          Adicionar
        </button>
      </div>
    </Modal>
  )
}

function AtualizarAvaliacaoModal({
  item, onClose, onAtualizado,
}: {
  item: ItemEntradaDTO
  onClose: () => void
  onAtualizado: (item: ItemEntradaDTO) => void
}) {
  const [valores, setValores] = useState<AvaliacaoTecnicaValores>(() => valoresIniciais(item))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const atualizarValores = (patch: Partial<AvaliacaoTecnicaValores>) => setValores(prev => ({ ...prev, ...patch }))

  const salvar = async () => {
    setSalvando(true)
    setErro(null)
    try {
      const atualizado = await itensEntradaAvaliacaoApi.atualizarAvaliacaoCompleta(item.id, {
        resultado: valores.resultado,
        detalheAjuste: valores.resultado === 'AJUSTE' ? (valores.detalheAjuste.trim() || undefined) : undefined,
        defeitoEncontrado: valores.defeitoEncontrado.trim() || undefined,
        causaDefeito: valores.causaDefeito.trim() || undefined,
        solucaoRecomendada: valores.solucaoRecomendada.trim() || undefined,
        observacoesTecnicas: valores.observacoesTecnicas.trim() || undefined,
        garantiaPecaIds: valores.garantiaPecaIds.length > 0 ? valores.garantiaPecaIds : undefined,
      })
      onAtualizado(atualizado)
      onClose()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErro(msg ?? 'Não foi possível salvar a avaliação.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <Modal title="Atualizar avaliação" onClose={onClose}>
      {erro && <div className="error-banner">{erro}</div>}

      <AvaliacaoTecnicaFields item={item} valores={valores} onAtualizar={atualizarValores} onAtualizadoItem={onAtualizado} />

      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-amber" disabled={salvando} onClick={salvar}>
          {salvando ? '// salvando...' : 'Salvar'}
        </button>
      </div>
    </Modal>
  )
}
