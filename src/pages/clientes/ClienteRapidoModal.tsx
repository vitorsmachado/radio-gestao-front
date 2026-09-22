import { useState } from 'react'
import { useForm } from 'react-hook-form'
import Modal from '../../components/Modal'
import { clientesApi } from '../../api/clientes'
import type { ClienteCreateRequest, ClienteDTO, EnderecoDTO } from '../../types/cliente'

interface FormValues {
  documento: string
  nomeRazaoSocial: string
  nomeFantasia: string
}

interface Props {
  buscaInicial?: string
  onClose: () => void
  onCriado: (cliente: ClienteDTO) => void
}

function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/**
 * Cadastro rápido, aberto de dentro da criação de OS quando o cliente não é
 * encontrado. Reaproveita a mesma consulta à ReceitaWS do cadastro completo
 * (ClienteForm), mas só expõe os campos essenciais — endereço vem preenchido
 * pela consulta e pode ser revisado depois em "Editar cliente".
 */
export default function ClienteRapidoModal({ buscaInicial, onClose, onCriado }: Props) {
  const [erroServidor, setErroServidor] = useState<string | null>(null)
  const [erroCnpj, setErroCnpj] = useState<string | null>(null)
  const [consultandoCnpj, setConsultandoCnpj] = useState(false)
  const [endereco, setEndereco] = useState<EnderecoDTO | undefined>(undefined)

  const digitosIniciais = buscaInicial ? apenasDigitos(buscaInicial) : ''
  const documentoInicial = digitosIniciais.length === 11 || digitosIniciais.length === 14 ? digitosIniciais : ''

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      documento: documentoInicial,
      nomeRazaoSocial: documentoInicial ? '' : (buscaInicial ?? ''),
      nomeFantasia: '',
    },
  })

  const documentoAtual = watch('documento') || ''
  const ehCnpj = apenasDigitos(documentoAtual).length === 14

  const consultarReceita = async () => {
    const cnpj = apenasDigitos(documentoAtual)
    if (cnpj.length !== 14) return
    setErroCnpj(null)
    setConsultandoCnpj(true)
    try {
      const dados = await clientesApi.consultarCNPJ(cnpj)
      if (dados.nomeRazaoSocial) setValue('nomeRazaoSocial', dados.nomeRazaoSocial)
      if (dados.nomeFantasia) setValue('nomeFantasia', dados.nomeFantasia)
      setEndereco(dados.endereco)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível consultar a Receita — preencha manualmente.'
      setErroCnpj(msg)
    } finally {
      setConsultandoCnpj(false)
    }
  }

  const onSubmit = async (dados: FormValues) => {
    setErroServidor(null)
    try {
      const payload: ClienteCreateRequest = {
        documento: apenasDigitos(dados.documento),
        nomeRazaoSocial: dados.nomeRazaoSocial.trim(),
        nomeFantasia: dados.nomeFantasia.trim() || undefined,
        endereco,
      }
      const cliente = await clientesApi.criar(payload)
      onCriado(cliente)
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível criar o cliente.'
      setErroServidor(msg)
    }
  }

  return (
    <Modal
      title="Cadastrar cliente"
      subtitle="// cadastro rápido — dá pra completar o endereço depois em Editar cliente"
      onClose={onClose}
    >
      {erroServidor && <div className="error-banner">{erroServidor}</div>}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label className="form-label">Documento (CPF ou CNPJ)</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className={`form-input${errors.documento ? ' error' : ''}`}
              placeholder="Somente números"
              autoFocus
              {...register('documento', {
                required: 'Documento obrigatório',
                validate: v => {
                  const d = apenasDigitos(v)
                  return d.length === 11 || d.length === 14 || 'Deve ter 11 (CPF) ou 14 (CNPJ) dígitos'
                },
              })}
            />
            {ehCnpj && (
              <button
                type="button" className="btn btn-sm" style={{ whiteSpace: 'nowrap' }}
                disabled={consultandoCnpj} onClick={consultarReceita}
              >
                {consultandoCnpj ? '// consultando...' : 'Consultar Receita'}
              </button>
            )}
          </div>
          {errors.documento && <span className="form-error">{errors.documento.message}</span>}
          {erroCnpj && <span className="form-error">{erroCnpj}</span>}
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

        {endereco && (
          <div className="form-hint" style={{ marginTop: 12 }}>
            Endereço encontrado: {endereco.logradouro}
            {endereco.cidade ? `, ${endereco.cidade}` : ''}
            {endereco.estado ? `/${endereco.estado}` : ''}
          </div>
        )}

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn btn-amber" disabled={isSubmitting}>
            {isSubmitting ? '// salvando...' : 'Cadastrar cliente'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
