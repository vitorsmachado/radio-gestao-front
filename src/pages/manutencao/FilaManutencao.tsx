import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { itensEntradaApi } from '../../api/itensEntrada'
import { itensEntradaAvaliacaoApi, osApi } from '../../api/os'
import { useAuthContext } from '../../contexts/AuthContext'
import PecaCompativelSelector from '../../components/PecaCompativelSelector'
import type { FilaManutencaoOSDTO, ItemEntradaDTO, StatusItemEntrada } from '../../types/os'
import { TIPO_OS_LABEL } from '../../types/os'
import type { PecaDTO } from '../../types/peca'

const STATUS_ITEM_LABEL: Record<StatusItemEntrada, string> = {
  PENDENTE_AVALIACAO: 'Aguardando avaliação',
  EM_AVALIACAO: 'Em avaliação',
  AVALIADO: 'Avaliado',
  PENDENTE_AUTORIZACAO: 'Pendente de autorização',
  AUTORIZADO: 'Autorizado',
  NAO_AUTORIZADO: 'Não autorizado',
  PENDENTE_MANUTENCAO: 'Aguardando manutenção',
  AGUARDANDO_PECA: 'Aguardando peça',
  EM_MANUTENCAO: 'Em manutenção',
  MANUTENCAO_CONCLUIDA: 'Manutenção concluída',
  AGUARDANDO_ENTREGA: 'Aguardando entrega',
  ENTREGUE: 'Entregue',
}

const STATUS_ITEM_BADGE: Record<StatusItemEntrada, string> = {
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

const BLOCO_LABEL: Record<number, string> = {
  1: 'Em avaliação',
  2: 'Pronta para manutenção',
  3: 'Aguardando avaliação',
  4: 'Aguardando peça (confirmado)',
}

interface LinhaFila {
  os: FilaManutencaoOSDTO
  indiceNoBloco: number
  totalNoBloco: number
}

function agruparPorBloco(fila: FilaManutencaoOSDTO[]): LinhaFila[] {
  const contagem: Record<number, number> = {}
  fila.forEach(os => { contagem[os.bloco] = (contagem[os.bloco] ?? 0) + 1 })
  const indiceAtual: Record<number, number> = {}
  return fila.map(os => {
    const indice = indiceAtual[os.bloco] ?? 0
    indiceAtual[os.bloco] = indice + 1
    return { os, indiceNoBloco: indice, totalNoBloco: contagem[os.bloco] }
  })
}

export default function FilaManutencao() {
  const navigate = useNavigate()
  const { isAdmin } = useAuthContext()
  const [fila, setFila] = useState<FilaManutencaoOSDTO[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [osComPecaModal, setOsComPecaModal] = useState<FilaManutencaoOSDTO | null>(null)
  const [arrastando, setArrastando] = useState<{ osId: string; bloco: number } | null>(null)

  const carregar = () => {
    setCarregando(true)
    setErro(null)
    osApi.listarFilaManutencao()
      .then(setFila)
      .catch(() => setErro('Não foi possível carregar a fila de manutenção.'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [])

  const reordenar = async (osId: string, acao: 'SUBIR' | 'DESCER' | 'POSICAO', posicao?: number) => {
    try {
      setFila(await osApi.reordenarFila(osId, { acao, posicao }))
    } catch {
      setErro('Não foi possível reordenar a fila.')
    }
  }

  const onDrop = (destino: LinhaFila) => {
    if (!arrastando || arrastando.bloco !== destino.os.bloco || arrastando.osId === destino.os.osId) {
      setArrastando(null)
      return
    }
    reordenar(arrastando.osId, 'POSICAO', destino.indiceNoBloco)
    setArrastando(null)
  }

  const confirmarAguardandoPeca = async (os: FilaManutencaoOSDTO) => {
    const itensAguardando = os.itens.filter(i => i.status === 'AGUARDANDO_PECA' && !i.confirmadoAguardandoPecaEm)
    try {
      await Promise.all(itensAguardando.map(i => itensEntradaAvaliacaoApi.confirmarAguardandoPeca(i.id)))
      carregar()
    } catch {
      setErro('Não foi possível confirmar aguardando peça.')
    }
  }

  if (carregando) return <div className="loading">Carregando</div>

  const linhas = agruparPorBloco(fila)

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Manutenções</div>
          <div className="page-sub">// {fila.length} OS na fila</div>
        </div>
      </div>

      {erro && <div className="error-banner">{erro}</div>}

      {fila.length === 0 && <div className="empty">Nenhuma OS na fila de manutenção.</div>}

      {linhas.map((linha, i) => {
        const os = linha.os
        const todosAguardandoPeca = os.itens.length > 0 && os.itens.every(i2 => i2.status === 'AGUARDANDO_PECA')
        const novoBloco = i === 0 || linhas[i - 1].os.bloco !== os.bloco

        return (
          <div key={os.osId}>
            {novoBloco && (
              <div className="section-hd" style={{ marginTop: i === 0 ? 0 : 20 }}>
                <h3>{BLOCO_LABEL[os.bloco] ?? `Bloco ${os.bloco}`}</h3>
              </div>
            )}

            <div
              className="section-card"
              onDragOver={e => isAdmin && e.preventDefault()}
              onDrop={() => isAdmin && onDrop(linha)}
              style={{ opacity: arrastando?.osId === os.osId ? 0.5 : 1 }}
            >
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {isAdmin && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, paddingTop: 2 }}>
                    <button
                      type="button" className="btn btn-sm btn-ghost" style={{ padding: '2px 6px' }}
                      disabled={linha.indiceNoBloco === 0}
                      onClick={() => reordenar(os.osId, 'SUBIR')}
                    >
                      ▲
                    </button>
                    <span
                      draggable
                      onDragStart={() => setArrastando({ osId: os.osId, bloco: os.bloco })}
                      onDragEnd={() => setArrastando(null)}
                      title="Arrastar para reordenar"
                      style={{ cursor: 'grab', color: 'var(--text3)', fontSize: 14, padding: '2px 0' }}
                    >
                      ⠿
                    </span>
                    <button
                      type="button" className="btn btn-sm btn-ghost" style={{ padding: '2px 6px' }}
                      disabled={linha.indiceNoBloco === linha.totalNoBloco - 1}
                      onClick={() => reordenar(os.osId, 'DESCER')}
                    >
                      ▼
                    </button>
                  </div>
                )}

                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => navigate(`/os/${os.osId}`)}>
                  <div style={{ fontWeight: 600 }}>{os.osNumero}</div>
                  <div className="page-sub">
                    {os.clienteNome ?? '—'} · {TIPO_OS_LABEL.ORCAMENTO_MANUTENCAO}
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    {os.itens.map(item => (
                      <span key={item.id} className={`badge ${STATUS_ITEM_BADGE[item.status]}`}>
                        {item.descricao} · {STATUS_ITEM_LABEL[item.status]}
                      </span>
                    ))}
                  </div>

                  {todosAguardandoPeca && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 12 }} onClick={e => e.stopPropagation()}>
                      <button type="button" className="btn btn-sm" onClick={() => setOsComPecaModal(os)}>
                        + Adicionar peça necessária
                      </button>
                      <button type="button" className="btn btn-sm btn-amber" onClick={() => confirmarAguardandoPeca(os)}>
                        Confirmar aguardando peça
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {osComPecaModal && (
        <AdicionarPecaNecessariaModal
          os={osComPecaModal}
          onClose={() => setOsComPecaModal(null)}
          onAdicionada={() => { setOsComPecaModal(null); carregar() }}
        />
      )}
    </div>
  )
}

function AdicionarPecaNecessariaModal({
  os, onClose, onAdicionada,
}: {
  os: FilaManutencaoOSDTO
  onClose: () => void
  onAdicionada: () => void
}) {
  const itensAguardando = os.itens.filter(i => i.status === 'AGUARDANDO_PECA')
  const [itemSelecionado, setItemSelecionado] = useState<ItemEntradaDTO | null>(itensAguardando.length === 1 ? itensAguardando[0] : null)
  const [pecaSelecionada, setPecaSelecionada] = useState<PecaDTO | null>(null)
  const [quantidade, setQuantidade] = useState('1')
  const [valorUnitario, setValorUnitario] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const submit = async () => {
    if (!itemSelecionado || !pecaSelecionada) return
    setSalvando(true)
    setErro(null)
    try {
      await itensEntradaApi.adicionarItemConserto(itemSelecionado.id, {
        tipo: 'PECA',
        itemEstoqueId: pecaSelecionada.id,
        descricao: pecaSelecionada.descricao,
        quantidade: Number(quantidade) || 1,
        valorUnitario: Number(valorUnitario) || 0,
      })
      onAdicionada()
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErro(msg ?? 'Não foi possível adicionar a peça.')
      setSalvando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 480 }}>
        <div className="modal-title">Adicionar peça necessária</div>
        <div className="modal-sub">{os.osNumero} — mantém a posição na fila</div>
        {erro && <div className="error-banner" style={{ marginBottom: 12 }}>{erro}</div>}

        {itensAguardando.length > 1 && (
          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Item</label>
            <select
              className="form-select"
              value={itemSelecionado?.id ?? ''}
              onChange={e => setItemSelecionado(itensAguardando.find(i => i.id === e.target.value) ?? null)}
            >
              <option value="">Selecione...</option>
              {itensAguardando.map(i => <option key={i.id} value={i.id}>{i.descricao}</option>)}
            </select>
          </div>
        )}

        {itemSelecionado && (
          <>
            <div className="form-field" style={{ marginBottom: 12 }}>
              <label className="form-label">Peça</label>
              <PecaCompativelSelector catalogoModeloId={itemSelecionado.catalogoModeloId} onSelecionar={setPecaSelecionada} />
              {pecaSelecionada && (
                <div className="form-hint" style={{ marginTop: 6 }}>Selecionada: {pecaSelecionada.descricao}</div>
              )}
            </div>
            <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
              <div className="form-field">
                <label className="form-label">Quantidade</label>
                <input type="number" min={1} className="form-input" value={quantidade} onChange={e => setQuantidade(e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label">Valor unitário (R$)</label>
                <input type="number" min={0} step="0.01" className="form-input" value={valorUnitario} onChange={e => setValorUnitario(e.target.value)} />
              </div>
            </div>
          </>
        )}

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-amber" disabled={salvando || !itemSelecionado || !pecaSelecionada} onClick={submit}>
            {salvando ? '// salvando...' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  )
}
