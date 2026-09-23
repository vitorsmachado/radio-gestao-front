import { useEffect, useRef, useState } from 'react'
import { sugestoesApi } from '../api/sugestoes'
import type { CampoSugestao, SugestaoTextoDTO } from '../types/sugestao'

interface Props {
  campo: CampoSugestao
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
  placeholder?: string
}

/** Textarea com sugestões de valores já digitados antes nesse campo (por qualquer avaliação) — clicável pra preencher, com opção de excluir a sugestão. */
export default function SugestaoTextArea({ campo, label, value, onChange, rows = 3, placeholder }: Props) {
  const [sugestoes, setSugestoes] = useState<SugestaoTextoDTO[]>([])
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (!aberto) return
    const timer = setTimeout(() => {
      sugestoesApi.buscar(campo, value.trim() || undefined).then(setSugestoes).catch(() => setSugestoes([]))
    }, 250)
    return () => clearTimeout(timer)
  }, [campo, value, aberto])

  const excluirSugestao = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    e.preventDefault()
    try {
      await sugestoesApi.excluir(id)
      setSugestoes(prev => prev.filter(s => s.id !== id))
    } catch {
      // sugestão continua na lista se a exclusão falhar
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <label className="form-label">{label}</label>
      <textarea
        className="form-input" rows={rows} placeholder={placeholder}
        value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setAberto(true)}
      />
      {aberto && sugestoes.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 20,
          background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 6,
          maxHeight: 200, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {sugestoes.map(s => (
            <div
              key={s.id}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', cursor: 'pointer', borderBottom: '0.5px solid var(--border)', gap: 8,
              }}
              onMouseDown={() => { onChange(s.valor); setAberto(false) }}
            >
              <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.valor}
              </span>
              <button
                type="button"
                onMouseDown={e => excluirSugestao(e, s.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 13, flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
