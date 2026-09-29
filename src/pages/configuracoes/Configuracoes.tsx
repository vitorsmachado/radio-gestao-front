import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { configuracoesApi } from '../../api/configuracoes'

interface FormValues {
  valorMaoDeObraPadrao: string
  prazoGarantiaPecaDias: string
  prazoGarantiaEquipamentoDias: string
  prazoGarantiaAcessorioDias: string
  nomeEmpresa: string
  razaoSocialEmpresa: string
  documentoEmpresa: string
  inscricaoEstadualEmpresa: string
  enderecoEmpresa: string
  bairroEmpresa: string
  cidadeEmpresa: string
  telefoneEmpresa: string
  emailEmpresa: string
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
      nomeEmpresa: '',
      razaoSocialEmpresa: '',
      documentoEmpresa: '',
      inscricaoEstadualEmpresa: '',
      enderecoEmpresa: '',
      bairroEmpresa: '',
      cidadeEmpresa: '',
      telefoneEmpresa: '',
      emailEmpresa: '',
    },
  })

  useEffect(() => {
    configuracoesApi.buscar()
      .then(c => reset({
        valorMaoDeObraPadrao: String(c.valorMaoDeObraPadrao),
        prazoGarantiaPecaDias: String(c.prazoGarantiaPecaDias),
        prazoGarantiaEquipamentoDias: String(c.prazoGarantiaEquipamentoDias),
        prazoGarantiaAcessorioDias: String(c.prazoGarantiaAcessorioDias),
        nomeEmpresa: c.nomeEmpresa,
        razaoSocialEmpresa: c.razaoSocialEmpresa ?? '',
        documentoEmpresa: c.documentoEmpresa,
        inscricaoEstadualEmpresa: c.inscricaoEstadualEmpresa ?? '',
        enderecoEmpresa: c.enderecoEmpresa ?? '',
        bairroEmpresa: c.bairroEmpresa ?? '',
        cidadeEmpresa: c.cidadeEmpresa ?? '',
        telefoneEmpresa: c.telefoneEmpresa ?? '',
        emailEmpresa: c.emailEmpresa ?? '',
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
        nomeEmpresa: d.nomeEmpresa.trim(),
        razaoSocialEmpresa: d.razaoSocialEmpresa.trim() || undefined,
        documentoEmpresa: d.documentoEmpresa.trim(),
        inscricaoEstadualEmpresa: d.inscricaoEstadualEmpresa.trim() || undefined,
        enderecoEmpresa: d.enderecoEmpresa.trim() || undefined,
        bairroEmpresa: d.bairroEmpresa.trim() || undefined,
        cidadeEmpresa: d.cidadeEmpresa.trim() || undefined,
        telefoneEmpresa: d.telefoneEmpresa.trim() || undefined,
        emailEmpresa: d.emailEmpresa.trim() || undefined,
      })
      reset({
        valorMaoDeObraPadrao: String(atualizado.valorMaoDeObraPadrao),
        prazoGarantiaPecaDias: String(atualizado.prazoGarantiaPecaDias),
        prazoGarantiaEquipamentoDias: String(atualizado.prazoGarantiaEquipamentoDias),
        prazoGarantiaAcessorioDias: String(atualizado.prazoGarantiaAcessorioDias),
        nomeEmpresa: atualizado.nomeEmpresa,
        razaoSocialEmpresa: atualizado.razaoSocialEmpresa ?? '',
        documentoEmpresa: atualizado.documentoEmpresa,
        inscricaoEstadualEmpresa: atualizado.inscricaoEstadualEmpresa ?? '',
        enderecoEmpresa: atualizado.enderecoEmpresa ?? '',
        bairroEmpresa: atualizado.bairroEmpresa ?? '',
        cidadeEmpresa: atualizado.cidadeEmpresa ?? '',
        telefoneEmpresa: atualizado.telefoneEmpresa ?? '',
        emailEmpresa: atualizado.emailEmpresa ?? '',
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

      <form onSubmit={onSubmit} style={{ maxWidth: 420 }}>
        <div className="section-card" style={{ marginBottom: 16 }}>
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

          <div className="form-field">
            <label className="form-label">Prazo de garantia de acessório (dias)</label>
            <input
              type="number" min={1} step="1" className="form-input"
              {...register('prazoGarantiaAcessorioDias')}
            />
            <div className="form-hint" style={{ marginTop: 4 }}>
              Prazo de garantia de fábrica/venda aplicado a acessórios cadastrados automaticamente pelo N/S.
            </div>
          </div>
        </div>

        <div className="section-card" style={{ marginBottom: 16 }}>
          <div className="section-hd" style={{ marginBottom: 12 }}>
            <h3>Dados da empresa</h3>
          </div>
          <div className="page-sub" style={{ marginBottom: 12 }}>
            Usados no cabeçalho dos documentos gerados (OS, orçamento).
          </div>

          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Nome da empresa</label>
            <input className="form-input" {...register('nomeEmpresa')} />
          </div>

          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Razão social</label>
            <input className="form-input" {...register('razaoSocialEmpresa')} />
          </div>

          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">CNPJ</label>
            <input className="form-input" {...register('documentoEmpresa')} />
          </div>

          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Inscrição estadual</label>
            <input className="form-input" {...register('inscricaoEstadualEmpresa')} />
          </div>

          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Endereço</label>
            <input className="form-input" {...register('enderecoEmpresa')} />
          </div>

          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Bairro</label>
            <input className="form-input" {...register('bairroEmpresa')} />
          </div>

          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Cidade</label>
            <input className="form-input" {...register('cidadeEmpresa')} />
          </div>

          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Telefone</label>
            <input className="form-input" {...register('telefoneEmpresa')} />
          </div>

          <div className="form-field">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" {...register('emailEmpresa')} />
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
