import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { clientesApi } from '../../api/clientes'
import type { ClienteCreateRequest } from '../../types/cliente'

interface FormValues {
  documento: string
  nomeRazaoSocial: string
  nomeFantasia: string
  inscricaoEstadual: string
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

export default function ClienteForm() {
  const navigate = useNavigate()
  const [erroServidor, setErroServidor] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>()

  const onSubmit = async (dados: FormValues) => {
    setErroServidor(null)
    const documento = apenasDigitos(dados.documento)

    const temEndereco = dados.cep.trim() !== '' && dados.logradouro.trim() !== ''

    const payload: ClienteCreateRequest = {
      documento,
      nomeRazaoSocial: dados.nomeRazaoSocial.trim(),
      nomeFantasia: dados.nomeFantasia.trim() || undefined,
      inscricaoEstadual: dados.inscricaoEstadual.trim() || undefined,
      endereco: temEndereco
        ? {
            cep: apenasDigitos(dados.cep),
            logradouro: dados.logradouro.trim(),
            numero: dados.numero.trim() || undefined,
            complemento: dados.complemento.trim() || undefined,
            bairro: dados.bairro.trim() || undefined,
            cidade: dados.cidade.trim() || undefined,
            estado: dados.estado.trim() || undefined,
          }
        : undefined,
    }

    try {
      const cliente = await clientesApi.criar(payload)
      navigate(`/clientes/${cliente.id}`, { replace: true })
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível criar o cliente.'
      setErroServidor(msg)
    }
  }

  return (
    <div className="fade-in">
      <div className="breadcrumb">
        <span className="crumb" onClick={() => navigate('/clientes')}>Clientes</span>
        <span className="sep">/</span>
        <span className="current">Novo</span>
      </div>

      <div className="page-header">
        <div>
          <div className="page-title">Novo cliente</div>
          <div className="page-sub">// tipo é inferido pelo tamanho do documento (11 = CPF, 14 = CNPJ)</div>
        </div>
      </div>

      {erroServidor && <div className="error-banner">{erroServidor}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ maxWidth: 640 }}>
        <div className="section-card">
          <div className="form-row form-row-2" style={{ marginBottom: 12 }}>
            <div className="form-field">
              <label className="form-label">Documento (CPF ou CNPJ)</label>
              <input
                className={`form-input${errors.documento ? ' error' : ''}`}
                placeholder="Somente números"
                {...register('documento', {
                  required: 'Documento obrigatório',
                  validate: v => {
                    const d = apenasDigitos(v)
                    return d.length === 11 || d.length === 14 || 'Deve ter 11 (CPF) ou 14 (CNPJ) dígitos'
                  },
                })}
              />
              {errors.documento && <span className="form-error">{errors.documento.message}</span>}
            </div>
            <div className="form-field">
              <label className="form-label">Inscrição estadual</label>
              <input className="form-input" {...register('inscricaoEstadual')} />
            </div>
          </div>

          <div className="form-field" style={{ marginBottom: 12 }}>
            <label className="form-label">Nome / Razão social</label>
            <input
              className={`form-input${errors.nomeRazaoSocial ? ' error' : ''}`}
              {...register('nomeRazaoSocial', { required: 'Nome obrigatório' })}
            />
            {errors.nomeRazaoSocial && <span className="form-error">{errors.nomeRazaoSocial.message}</span>}
          </div>

          <div className="form-field">
            <label className="form-label">Nome fantasia</label>
            <input className="form-input" {...register('nomeFantasia')} />
          </div>
        </div>

        <div className="section-hd"><h3>Endereço (opcional)</h3></div>
        <div className="section-card">
          <div className="form-row form-row-3" style={{ marginBottom: 12 }}>
            <div className="form-field">
              <label className="form-label">CEP</label>
              <input className="form-input" placeholder="Somente números" {...register('cep')} />
            </div>
            <div className="form-field" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Logradouro</label>
              <input className="form-input" {...register('logradouro')} />
            </div>
          </div>
          <div className="form-row form-row-auto" style={{ marginBottom: 12 }}>
            <div className="form-field">
              <label className="form-label">Número</label>
              <input className="form-input" {...register('numero')} />
            </div>
            <div className="form-field">
              <label className="form-label">Complemento</label>
              <input className="form-input" {...register('complemento')} />
            </div>
            <div className="form-field">
              <label className="form-label">Bairro</label>
              <input className="form-input" {...register('bairro')} />
            </div>
          </div>
          <div className="form-row form-row-2">
            <div className="form-field">
              <label className="form-label">Cidade</label>
              <input className="form-input" {...register('cidade')} />
            </div>
            <div className="form-field">
              <label className="form-label">Estado (UF)</label>
              <input className="form-input" maxLength={2} {...register('estado')} />
            </div>
          </div>
          <div className="form-hint" style={{ marginTop: 8 }}>
            Preencha ao menos CEP e Logradouro para salvar o endereço — senão ele fica em branco.
          </div>
        </div>

        <div className="footer-actions">
          <div className="footer-left">
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/clientes')}>
              Cancelar
            </button>
          </div>
          <div className="footer-right">
            <button type="submit" className="btn btn-amber" disabled={isSubmitting}>
              {isSubmitting ? '// salvando...' : 'Salvar cliente'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
