import { useEffect, useRef, useState } from 'react'
import { pecasApi } from '../api/pecas'
import type { PecaCreateRequest, PecaDTO } from '../types/peca'

interface Props {
  /** Modelo de catálogo do equipamento sendo avaliado — se presente, filtra por compatibilidade; senão busca por texto. */
  catalogoModeloId?: string
  onSelecionar: (peca: PecaDTO) => void
}

/** Busca peça compatível com o equipamento (ou por texto, se o item não tiver modelo de catálogo) — com opção de cadastrar quando não encontra. */
export default function PecaCompativelSelector({ catalogoModeloId, onSelecionar }: Props) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<PecaDTO[]>([])
  const [buscando, setBuscando] = useState(false)
  const [buscou, setBuscou] = useState(false)
  const [aberto, setAberto] = useState(false)
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
    if (catalogoModeloId) {
      setBuscando(true)
      pecasApi.listar({ modeloCompativelId: catalogoModeloId, page: 0 })
        .then(p => setResultados(p.content))
        .catch(() => setResultados([]))
        .finally(() => { setBuscando(false); setBuscou(true) })
      return
    }
    const termo = busca.trim()
    if (termo.length < 2) { setResultados([]); setBuscou(false); return }
    setBuscando(true)
    const timer = setTimeout(() => {
      pecasApi.listar({ busca: termo, page: 0 })
        .then(p => setResultados(p.content))
        .catch(() => setResultados([]))
        .finally(() => { setBuscando(false); setBuscou(true) })
    }, 300)
    return () => clearTimeout(timer)
  }, [busca, catalogoModeloId])

  const selecionar = (peca: PecaDTO) => {
    onSelecionar(peca)
    setBusca('')
    setAberto(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {!catalogoModeloId && (
        <input
          className="form-input"
          placeholder="Buscar peça por nome ou código..."
          value={busca}
          onChange={e => { setBusca(e.target.value); setAberto(true) }}
          onFocus={() => setAberto(true)}
        />
      )}
      {catalogoModeloId && (
        <button type="button" className="btn btn-sm" onClick={() => setAberto(a => !a)}>
          + Peça compatível com o modelo
        </button>
      )}

      {aberto && (catalogoModeloId || busca.trim().length >= 2) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 20,
          background: 'var(--bg2)', border: '0.5px solid var(--border2)', borderRadius: 6,
          maxHeight: 260, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {buscando && <div className="form-hint" style={{ padding: 10 }}>// buscando...</div>}
          {!buscando && resultados.map(peca => (
            <div
              key={peca.id}
              style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '0.5px solid var(--border)' }}
              onMouseDown={() => selecionar(peca)}
            >
              <div style={{ fontWeight: 600, fontSize: 13 }}>{peca.descricao}</div>
              <div className="page-sub" style={{ marginTop: 2 }}>
                {peca.codigo} · saldo {peca.quantidadeDisponivel}
                {peca.emFalta ? ' · sem estoque' : ''}
              </div>
            </div>
          ))}
          {!buscando && buscou && resultados.length === 0 && (
            <div style={{ padding: 12 }}>
              <div className="form-hint" style={{ marginBottom: 8 }}>Nenhuma peça encontrada.</div>
              <button
                type="button" className="btn btn-sm btn-amber"
                onMouseDown={() => { setMostrarCadastro(true); setAberto(false) }}
              >
                + Cadastrar peça
              </button>
            </div>
          )}
        </div>
      )}

      {mostrarCadastro && (
        <CadastrarPecaModal
          descricaoInicial={busca}
          catalogoModeloId={catalogoModeloId}
          onClose={() => setMostrarCadastro(false)}
          onCriada={peca => { setMostrarCadastro(false); selecionar(peca) }}
        />
      )}
    </div>
  )
}

function CadastrarPecaModal({
  descricaoInicial, catalogoModeloId, onClose, onCriada,
}: {
  descricaoInicial: string
  catalogoModeloId?: string
  onClose: () => void
  onCriada: (peca: PecaDTO) => void
}) {
  const [descricao, setDescricao] = useState(descricaoInicial)
  const [quantidadeDisponivel, setQuantidadeDisponivel] = useState('0')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const submit = async () => {
    if (!descricao.trim()) { setErro('Descrição obrigatória.'); return }
    setSalvando(true)
    setErro(null)
    try {
      const payload: PecaCreateRequest = {
        descricao: descricao.trim(),
        quantidadeDisponivel: Number(quantidadeDisponivel) || 0,
        catalogoModeloId,
        modelosCompativeisIds: catalogoModeloId ? [catalogoModeloId] : undefined,
      }
      const peca = await pecasApi.criar(payload)
      onCriada(peca)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message
      setErro(msg ?? 'Não foi possível cadastrar a peça.')
      setSalvando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 420 }}>
        <div className="modal-title">Cadastrar peça</div>
        <div className="modal-sub">Não encontrada no estoque — cadastro rápido</div>
        {erro && <div className="error-banner" style={{ marginBottom: 12 }}>{erro}</div>}
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Descrição</label>
          <input className="form-input" value={descricao} onChange={e => setDescricao(e.target.value)} autoFocus />
        </div>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Quantidade em estoque (opcional)</label>
          <input
            type="number" min={0} className="form-input"
            value={quantidadeDisponivel} onChange={e => setQuantidadeDisponivel(e.target.value)}
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
