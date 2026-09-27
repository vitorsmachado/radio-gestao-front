import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { configuracoesApi } from '../../api/configuracoes'

interface FormValues {
  valorMaoDeObraPadrao: string
  prazoGarantiaPecaDias: string
  prazoGarantiaEquipamentoDias: string
  prazoGarantiaAcessorioDias: string
}

export default function Configuracoes() {
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const { register, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      valorMaoDeObraPadrao: '0',
      prazoGarantiaPecaDias: '90',
      prazoGarantiaEquipamentoDias: '90',
      prazoGarantiaAcessorioDias: '90',
    },
  })

  useEffect(() => {
    configuracoesApi.buscar()
      .then(c => reset({
        valorMaoDeObraPadrao: String(c.valorMaoDeObraPadrao),
        prazoGarantiaPecaDias: String(c.prazoGarantiaPecaDias),
        prazoGarantiaEquipamentoDias: String(c.prazoGarantiaEquipamentoDias),
        prazoGarantiaAcessorioDias: String(c.prazoGarantiaAcessorioDias),
      }))
      .catch(() => setErro('Não foi possível carregar as configurações.'))
      .finally(() => setCarregando(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = handleSubmit(async d => {
    setSalvando(true)
    setErro(null)
    setSucesso(false)
    try {
      const atualizado = await configuracoesApi.atualizar({
        valorMaoDeObraPadrao: Number(d.valorMaoDeObraPadrao) || 0,
        prazoGarantiaPecaDias: Number(d.prazoGarantiaPecaDias) || 0,
        prazoGarantiaEquipamentoDias: Number(d.prazoGarantiaEquipamentoDias) || 0,
        prazoGarantiaAcessorioDias: Number(d.prazoGarantiaAcessorioDias) || 0,
      })
      reset({
        valorMaoDeObraPadrao: String(atualizado.valorMaoDeObraPadrao),
        prazoGarantiaPecaDias: String(atualizado.prazoGarantiaPecaDias),
        prazoGarantiaEquipamentoDias: String(atualizado.prazoGarantiaEquipamentoDias),
        prazoGarantiaAcessorioDias: String(atualizado.prazoGarantiaAcessorioDias),
      })
      setSucesso(true)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível salvar.'
      setErro(msg)
    } finally {
      setSalvando(false)
    }
  })

  if (carregando) return <div className="loading">Carregando</div>

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Configurações</div>
          <div className="page-sub">// valores gerais do sistema</div>
        </div>
      </div>

      {erro && <div className="error-banner">{erro}</div>}

      <form onSubmit={onSubmit} className="section-card" style={{ maxWidth: 420 }}>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Valor padrão de mão de obra (R$)</label>
          <input
            type="number" min={0} step="0.01" className="form-input"
            {...register('valorMaoDeObraPadrao')}
          />
          <div className="form-hint" style={{ marginTop: 4 }}>
            Preenche automaticamente ao adicionar mão de obra na avaliação ou no orçamento — dá pra mudar em cada item.
          </div>
        </div>

        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Prazo de garantia da peça trocada (dias)</label>
          <input
            type="number" min={1} step="1" className="form-input"
            {...register('prazoGarantiaPecaDias')}
          />
          <div className="form-hint" style={{ marginTop: 4 }}>
            Prazo de cobertura da peça trocada num reparo — usado pro atalho de garantia na avaliação técnica.
          </div>
        </div>

        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Prazo de garantia de equipamento (dias)</label>
          <input
            type="number" min={1} step="1" className="form-input"
            {...register('prazoGarantiaEquipamentoDias')}
          />
          <div className="form-hint" style={{ marginTop: 4 }}>
            Prazo de garantia de fábrica/venda aplicado a equipamentos cadastrados automaticamente pelo N/S.
          </div>
        </div>

        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Prazo de garantia de acessório (dias)</label>
          <input
            type="number" min={1} step="1" className="form-input"
            {...register('prazoGarantiaAcessorioDias')}
          />
          <div className="form-hint" style={{ marginTop: 4 }}>
            Prazo de garantia de fábrica/venda aplicado a acessórios cadastrados automaticamente pelo N/S.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="submit" className="btn btn-amber" disabled={salvando}>
            {salvando ? '// salvando...' : 'Salvar'}
          </button>
          {sucesso && <span className="form-hint">Salvo.</span>}
        </div>
      </form>
    </div>
  )
}
