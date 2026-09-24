import { useState } from 'react'
import Modal from '../../components/Modal'
import ItemRascunhoFields from './ItemRascunhoFields'
import { itemRascunhoVazio, paraCreateRequest } from './itemRascunho'
import type { ItemEntradaCreateRequest } from '../../types/os'

interface Props {
  osId: string
  onClose: () => void
  onSalvar: (dados: ItemEntradaCreateRequest) => void
  processando: boolean
}

export default function ItemEntradaForm({ osId, onClose, onSalvar, processando }: Props) {
  const [item, setItem] = useState(itemRascunhoVazio())
  const [tentouSalvar, setTentouSalvar] = useState(false)

  const atualizar = (patch: Partial<typeof item>) => setItem(prev => ({ ...prev, ...patch }))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!item.descricao.trim()) {
      setTentouSalvar(true)
      return
    }
    onSalvar(paraCreateRequest(osId, item))
  }

  return (
    <Modal title="Registrar item de entrada" onClose={onClose}>
      <form onSubmit={onSubmit}>
        <ItemRascunhoFields item={item} descricaoInvalida={tentouSalvar && !item.descricao.trim()} onAtualizar={atualizar} />

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-amber" disabled={processando}>
            {processando ? '// salvando...' : 'Registrar item'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
