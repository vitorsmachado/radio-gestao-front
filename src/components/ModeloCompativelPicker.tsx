import { useEffect, useState } from 'react'
import { catalogoApi } from '../api/catalogo'
import type { CatalogoModeloDTO } from '../types/catalogo'

interface Props {
  selecionados: CatalogoModeloDTO[]
  onChange: (novos: CatalogoModeloDTO[]) => void
}

export default function ModeloCompativelPicker({ selecionados, onChange }: Props) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<CatalogoModeloDTO[]>([])

  useEffect(() => {
    if (busca.trim().length < 2) {
      setResultados([])
      return
    }
    const t = setTimeout(() => {
      catalogoApi
        .listar({ busca: busca.trim(), tipoItem: 'EQUIPAMENTO' })
        .then(res => setResultados(res.content))
        .catch(() => setResultados([]))
    }, 300)
    return () => clearTimeout(t)
  }, [busca])

  const jaSelecionado = (id: string) => selecionados.some(m => m.id === id)

  const adicionar = (modelo: CatalogoModeloDTO) => {
    if (!jaSelecionado(modelo.id)) onChange([...selecionados, modelo])
    setBusca('')
    setResultados([])
  }

  const remover = (id: string) => onChange(selecionados.filter(m => m.id !== id))

  return (
    <div>
      <input
        className="form-input"
        placeholder="Buscar equipamento por marca/modelo..."
        value={busca}
        onChange={e => setBusca(e.target.value)}
      />

      {resultados.length > 0 && (
        <div className="section-card" style={{ marginTop: 6, padding: 8 }}>
          {resultados.map(m => (
            <div
              key={m.id}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 4px', cursor: jaSelecionado(m.id) ? 'default' : 'pointer',
                opacity: jaSelecionado(m.id) ? 0.4 : 1, fontSize: 13,
              }}
              onClick={() => !jaSelecionado(m.id) && adicionar(m)}
            >
              <span>{m.marca} {m.modelo}</span>
              {!jaSelecionado(m.id) && <span className="page-sub">+ adicionar</span>}
            </div>
          ))}
        </div>
      )}

      {selecionados.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
          {selecionados.map(m => (
            <span key={m.id} className="badge b-blue" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {m.marca} {m.modelo}
              <span style={{ cursor: 'pointer' }} onClick={() => remover(m.id)}>✕</span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
