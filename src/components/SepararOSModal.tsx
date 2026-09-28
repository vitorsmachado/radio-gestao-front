import { useState } from 'react'
import { osApi } from '../api/os'
import Modal from './Modal'
import type { ItemEntradaDTO, OrdemServicoDTO } from '../types/os'

/** 0 = fica na OS atual; N > 0 = vai pro grupo N (cada grupo vira uma OS nova). */
type Atribuicoes = Record<string, number>

export default function SepararOSModal({
  itens, preSelecionados, onClose, onSeparado,
}: {
  itens: ItemEntradaDTO[]
  preSelecionados?: string[]
  onClose: () => void
  onSeparado: (novasOS: OrdemServicoDTO[]) => void
}) {
  const [numGrupos, setNumGrupos] = useState(1)
  const [atribuicoes, setAtribuicoes] = useState<Atribuicoes>(() => {
    const iniciais: Atribuicoes = {}
    for (const id of preSelecionados ?? []) iniciais[id] = 1
    return iniciais
  })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const grupoDe = (itemId: string) => atribuicoes[itemId] ?? 0

  const separar = async () => {
    const grupos = Array.from({ length: numGrupos }, (_, i) => {
      const grupo = i + 1
      return { itemIds: itens.filter(item => grupoDe(item.id) === grupo).map(item => item.id) }
    }).filter(g => g.itemIds.length > 0)

    if (grupos.length === 0) { setErro('Marque ao menos um item pra separar em algum grupo.'); return }

    setSalvando(true)
    setErro(null)
    try {
      const novasOS = await osApi.separar(itens[0].osId, { grupos })
      onSeparado(novasOS)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível separar os itens.'
      setErro(msg)
      setSalvando(false)
    }
  }

  return (
    <Modal
      title="Separar itens"
      subtitle="Marque em qual grupo cada item entra — cada grupo vira uma OS nova. O que ficar em 'Nesta OS' não se move."
      onClose={onClose}
    >
      {erro && <div className="error-banner">{erro}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {itens.map(item => (
          <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 13 }}>
              {item.descricao}{item.numeroSerie ? ` · S/N ${item.numeroSerie}` : ''}
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn btn-sm ${grupoDe(item.id) === 0 ? 'btn-amber' : ''}`}
                onClick={() => setAtribuicoes(prev => ({ ...prev, [item.id]: 0 }))}
              >
                Nesta OS
              </button>
              {Array.from({ length: numGrupos }, (_, i) => i + 1).map(grupo => (
                <button
                  key={grupo}
                  type="button"
                  className={`btn btn-sm ${grupoDe(item.id) === grupo ? 'btn-amber' : ''}`}
                  onClick={() => setAtribuicoes(prev => ({ ...prev, [item.id]: grupo }))}
                >
                  Grupo {grupo}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-sm" style={{ marginBottom: 16 }} onClick={() => setNumGrupos(n => n + 1)}>
        + Novo grupo
      </button>

      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
        <button type="button" className="btn btn-amber" disabled={salvando} onClick={separar}>
          {salvando ? '// separando...' : 'Separar'}
        </button>
      </div>
    </Modal>
  )
}
