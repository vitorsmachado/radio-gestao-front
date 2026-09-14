import { useEffect, useState } from 'react'
import { pecasApi } from '../../api/pecas'
import Modal from '../../components/Modal'
import type { MovimentacaoEstoqueDTO, PecaDTO, TipoMovimentacaoEstoque } from '../../types/peca'
import type { PageResponse } from '../../types/pagination'

interface Props {
  peca: PecaDTO
  onClose: () => void
}

const TIPO_BADGE: Record<TipoMovimentacaoEstoque, string> = {
  ENTRADA: 'b-green',
  SAIDA: 'b-red',
  AJUSTE: 'b-blue',
}

const TIPO_LABEL: Record<TipoMovimentacaoEstoque, string> = {
  ENTRADA: 'Entrada',
  SAIDA: 'Saída',
  AJUSTE: 'Ajuste',
}

function formatarData(data?: string): string {
  if (!data) return '—'
  return new Date(data).toLocaleString('pt-BR')
}

export default function HistoricoMovimentacaoModal({ peca, onClose }: Props) {
  const [pagina, setPagina] = useState<PageResponse<MovimentacaoEstoqueDTO> | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  useEffect(() => {
    setCarregando(true)
    setErro(null)
    pecasApi
      .listarMovimentacoes(peca.id, page)
      .then(setPagina)
      .catch(() => setErro('Não foi possível carregar o histórico.'))
      .finally(() => setCarregando(false))
  }, [peca.id, page])

  return (
    <Modal
      title={`Histórico de movimentação — ${peca.codigo}`}
      subtitle={`${peca.descricao} · saldo atual: ${peca.quantidadeDisponivel}`}
      onClose={onClose}
    >
      {erro && <div className="error-banner">{erro}</div>}

      {carregando && <div className="loading">Carregando</div>}

      {!carregando && !erro && pagina && pagina.content.length === 0 && (
        <div className="empty">Nenhuma movimentação registrada ainda.</div>
      )}

      {!carregando && !erro && pagina && pagina.content.length > 0 && (
        <>
          <table className="table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Saldo anterior</th>
                <th>Saldo novo</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {pagina.content.map(mov => (
                <tr key={mov.id}>
                  <td>{formatarData(mov.dataCriacao)}</td>
                  <td><span className={`badge ${TIPO_BADGE[mov.tipoMovimentacao]}`}>{TIPO_LABEL[mov.tipoMovimentacao]}</span></td>
                  <td>{mov.saldoAnterior}</td>
                  <td>{mov.saldoNovo}</td>
                  <td>{mov.motivo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="footer-actions">
            <div className="footer-left">
              <span className="page-sub">
                Página {pagina.number + 1} de {Math.max(pagina.totalPages, 1)}
              </span>
            </div>
            <div className="footer-right">
              <button className="btn btn-sm" disabled={pagina.number === 0} onClick={() => setPage(p => p - 1)}>
                ← Anterior
              </button>
              <button className="btn btn-sm" disabled={pagina.number + 1 >= pagina.totalPages} onClick={() => setPage(p => p + 1)}>
                Próxima →
              </button>
            </div>
          </div>
        </>
      )}

      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Fechar</button>
      </div>
    </Modal>
  )
}
