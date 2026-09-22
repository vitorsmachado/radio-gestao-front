import { useEffect, useRef, useState } from 'react'
import { catalogoApi } from '../api/catalogo'
import type { CatalogoModeloDTO } from '../types/catalogo'
import type { TipoItem } from '../types/os'

interface Props {
  tipoItem: TipoItem
  selecionado: CatalogoModeloDTO | null
  onSelecionar: (item: CatalogoModeloDTO | null) => void
}

function formatarValor(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Busca modelo no catálogo com debounce — sugere marca/modelo e traz o valor de referência (preço de um novo). */
export default function CatalogoSelector({ tipoItem, selecionado, onSelecionar }: Props) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<CatalogoModeloDTO[]>([])
  const [aberto, setAberto] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const termo = busca.trim()
    if (termo.length < 2) { setResultados([]); return }
    setBuscando(true)
    const timer = setTimeout(() => {
      catalogoApi
        .listar({ busca: termo, tipoItem, status: 'ATIVO', page: 0 })
        .then(p => setResultados(p.content))
        .catch(() => setResultados([]))
        .finally(() => setBuscando(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [busca, tipoItem])

  if (selecionado) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
        background: 'var(--bg3)', border: '0.5px solid var(--amber)', borderRadius: 6, fontSize: 12,
      }}>
        <span style={{ color: 'var(--amber)', fontFamily: 'var(--mono)', flexShrink: 0 }}>catálogo</span>
        <span style={{ fontWeight: 600 }}>{selecionado.marca} · {selecionado.modelo}</span>
        {selecionado.valorReferencia != null && (
          <span style={{ color: 'var(--text3)' }}>— ref. {formatarValor(selecionado.valorReferencia)}</span>
        )}
        <button
          type="button" onClick={() => onSelecionar(null)}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 14, padding: '0 2px' }}
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        className="form-input"
        placeholder="Buscar modelo no catálogo (opcional)..."
        value={busca}
        onChange={e => { setBusca(e.target.value); setAberto(true) }}
        onFocus={() => setAberto(true)}
      />
      {aberto && busca.trim().length >= 2 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 20,
          background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 6,
          maxHeight: 240, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {buscando && <div className="form-hint" style={{ padding: 10 }}>// buscando...</div>}
          {!buscando && resultados.length === 0 && (
            <div className="form-hint" style={{ padding: 10 }}>Nenhum modelo encontrado no catálogo.</div>
          )}
          {!buscando && resultados.map(r => (
            <div
              key={r.id}
              style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '0.5px solid var(--border)' }}
              onMouseDown={() => { onSelecionar(r); setBusca(''); setAberto(false) }}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{r.marca} · {r.modelo}</div>
              <div className="page-sub" style={{ marginTop: 2 }}>
                {r.descricao ? `${r.descricao} · ` : ''}
                {r.valorReferencia != null ? `ref. ${formatarValor(r.valorReferencia)}` : 'sem valor de referência'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
