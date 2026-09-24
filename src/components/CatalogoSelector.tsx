import { useEffect, useRef, useState } from 'react'
import { catalogoApi } from '../api/catalogo'
import type { CatalogoModeloCreateRequest, CatalogoModeloDTO } from '../types/catalogo'
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
  const [buscou, setBuscou] = useState(false)
  const [mostrarCadastro, setMostrarCadastro] = useState(false)
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
    if (termo.length < 2) { setResultados([]); setBuscou(false); return }
    setBuscando(true)
    const timer = setTimeout(() => {
      catalogoApi
        .listar({ busca: termo, tipoItem, status: 'ATIVO', page: 0 })
        .then(p => setResultados(p.content))
        .catch(() => setResultados([]))
        .finally(() => { setBuscando(false); setBuscou(true) })
    }, 300)
    return () => clearTimeout(timer)
  }, [busca, tipoItem])

  const selecionar = (item: CatalogoModeloDTO) => {
    onSelecionar(item)
    setBusca('')
    setAberto(false)
  }

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
          {!buscando && resultados.map(r => (
            <div
              key={r.id}
              style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '0.5px solid var(--border)' }}
              onMouseDown={() => selecionar(r)}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{r.marca} · {r.modelo}</div>
              <div className="page-sub" style={{ marginTop: 2 }}>
                {r.descricao ? `${r.descricao} · ` : ''}
                {r.valorReferencia != null ? `ref. ${formatarValor(r.valorReferencia)}` : 'sem valor de referência'}
              </div>
            </div>
          ))}
          {!buscando && buscou && resultados.length === 0 && (
            <div style={{ padding: 12 }}>
              <div className="form-hint" style={{ marginBottom: 8 }}>Nenhum modelo encontrado no catálogo.</div>
              <button
                type="button" className="btn btn-sm btn-amber"
                onMouseDown={() => { setMostrarCadastro(true); setAberto(false) }}
              >
                + Cadastrar modelo
              </button>
            </div>
          )}
        </div>
      )}

      {mostrarCadastro && (
        <CadastrarModeloModal
          tipoItem={tipoItem}
          marcaModeloInicial={busca}
          onClose={() => setMostrarCadastro(false)}
          onCriado={item => { setMostrarCadastro(false); selecionar(item) }}
        />
      )}
    </div>
  )
}

function CadastrarModeloModal({
  tipoItem, marcaModeloInicial, onClose, onCriado,
}: {
  tipoItem: TipoItem
  marcaModeloInicial: string
  onClose: () => void
  onCriado: (item: CatalogoModeloDTO) => void
}) {
  const [marca, setMarca] = useState(marcaModeloInicial)
  const [modelo, setModelo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [valorReferencia, setValorReferencia] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const submit = async () => {
    if (!marca.trim() || !modelo.trim()) { setErro('Marca e modelo são obrigatórios.'); return }
    setSalvando(true)
    setErro(null)
    try {
      const payload: CatalogoModeloCreateRequest = {
        tipoItem,
        marca: marca.trim(),
        modelo: modelo.trim(),
        descricao: descricao.trim() || undefined,
        valorReferencia: valorReferencia ? Number(valorReferencia) : undefined,
      }
      const item = await catalogoApi.criar(payload)
      onCriado(item)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErro(msg ?? 'Não foi possível cadastrar o modelo.')
      setSalvando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 420 }}>
        <div className="modal-title">Cadastrar modelo</div>
        <div className="modal-sub">Não encontrado no catálogo — cadastro rápido</div>
        {erro && <div className="error-banner" style={{ marginBottom: 12 }}>{erro}</div>}
        <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
          <div className="form-field">
            <label className="form-label">Marca</label>
            <input className="form-input" value={marca} onChange={e => setMarca(e.target.value)} autoFocus />
          </div>
          <div className="form-field">
            <label className="form-label">Modelo</label>
            <input className="form-input" value={modelo} onChange={e => setModelo(e.target.value)} />
          </div>
        </div>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Descrição (opcional)</label>
          <input className="form-input" value={descricao} onChange={e => setDescricao(e.target.value)} />
        </div>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Valor de referência — R$ (opcional)</label>
          <input
            type="number" min={0} step="0.01" className="form-input"
            value={valorReferencia} onChange={e => setValorReferencia(e.target.value)}
          />
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn btn-amber" disabled={salvando} onClick={submit}>
            {salvando ? '// salvando...' : 'Cadastrar'}
          </button>
        </div>
      </div>
    </div>
  )
}
