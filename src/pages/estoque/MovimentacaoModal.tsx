import { useState } from 'react'
import { pecasApi } from '../../api/pecas'
import Modal from '../../components/Modal'
import type { PecaDTO } from '../../types/peca'

export type TipoMovimentacao = 'entrada' | 'saida' | 'ajuste'

interface Props {
  peca: PecaDTO
  tipo: TipoMovimentacao
  onClose: () => void
  onSalvo: () => void
}

const TITULOS: Record<TipoMovimentacao, string> = {
  entrada: 'Entrada de estoque',
  saida: 'Saída de estoque',
  ajuste: 'Ajustar saldo',
}

const BOTOES: Record<TipoMovimentacao, { label: string; className: string }> = {
  entrada: { label: '+ Entrada', className: 'btn-green' },
  saida: { label: '- Saída', className: 'btn-danger' },
  ajuste: { label: 'Ajustar', className: 'btn-amber' },
}

export default function MovimentacaoModal({ peca, tipo, onClose, onSalvo }: Props) {
  const [quantidade, setQuantidade] = useState('')
  const [motivo, setMotivo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const confirmar = async () => {
    setErro(null)
    const qtd = Number(quantidade)
    if (quantidade === '' || qtd < 0 || (tipo !== 'ajuste' && qtd <= 0)) {
      setErro('Informe uma quantidade válida.')
      return
    }
    setEnviando(true)
    try {
      const motivoFinal = motivo.trim() || undefined
      if (tipo === 'entrada') await pecasApi.darEntrada(peca.id, qtd, motivoFinal)
      else if (tipo === 'saida') await pecasApi.darSaida(peca.id, qtd, motivoFinal)
      else await pecasApi.ajustar(peca.id, qtd, motivoFinal)
      onSalvo()
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível movimentar o estoque.'
      setErro(msg)
    } finally {
      setEnviando(false)
    }
  }

  const botao = BOTOES[tipo]

  return (
    <Modal
      title={`${TITULOS[tipo]} — ${peca.codigo}`}
      subtitle={`${peca.descricao} · saldo atual: ${peca.quantidadeDisponivel}`}
      onClose={onClose}
    >
      {erro && <div className="error-banner">{erro}</div>}

      <div className="form-field" style={{ marginBottom: 12 }}>
        <label className="form-label">{tipo === 'ajuste' ? 'Novo saldo' : 'Quantidade'}</label>
        <input
          type="number" min={0} className="form-input" autoFocus
          value={quantidade} onChange={e => setQuantidade(e.target.value)}
        />
      </div>

      <div className="form-field" style={{ marginBottom: 12 }}>
        <label className="form-label">Motivo (opcional)</label>
        <input
          className="form-input"
          placeholder="Ex: reposição do fornecedor, usado em conserto, contagem de inventário..."
          value={motivo} onChange={e => setMotivo(e.target.value)}
        />
      </div>

      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className={`btn ${botao.className}`} disabled={enviando} onClick={confirmar}>
          {enviando ? '// enviando...' : botao.label}
        </button>
      </div>
    </Modal>
  )
}
