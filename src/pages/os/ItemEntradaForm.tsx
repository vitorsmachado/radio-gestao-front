import { useState } from 'react'
import Modal from '../../components/Modal'
import ItemRascunhoFields from './ItemRascunhoFields'
import { itemRascunhoVazio, paraCreateRequest } from './itemRascunho'
import type { ItemEntradaCreateRequest } from '../../types/os'

interface Props {
  osId: string
  clienteId: string
  onClose: () => void
  onSalvar: (dados: ItemEntradaCreateRequest) => void
  processando: boolean
}

export default function ItemEntradaForm({ osId, clienteId, onClose, onSalvar, processando }: Props) {
  const [item, setItem] = useState(itemRascunhoVazio())
  const [tentouSalvar, setTentouSalvar] = useState(false)
  const [resolvendo, setResolvendo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const atualizar = (patch: Partial<typeof item>) => setItem(prev => ({ ...prev, ...patch }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item.descricao.trim()) {
      setTentouSalvar(true)
      return
    }
    setResolvendo(true)
    setErro(null)
    try {
      onSalvar(await paraCreateRequest(osId, clienteId, item))
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErro(msg ?? 'Não foi possível registrar o equipamento no estoque.')
    } finally {
      setResolvendo(false)
    }
  }

  return (
    <Modal title="Registrar item de entrada" onClose={onClose}>
      {erro && <div className="error-banner">{erro}</div>}

      <form onSubmit={onSubmit}>
        <ItemRascunhoFields item={item} descricaoInvalida={tentouSalvar && !item.descricao.trim()} onAtualizar={atualizar} />

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-amber" disabled={processando || resolvendo}>
            {processando || resolvendo ? '// salvando...' : 'Registrar item'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
