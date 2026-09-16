import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { clientesApi } from '../../api/clientes'
import { osApi } from '../../api/os'
import AlterarStatusModal, { type AcaoStatus } from './AlterarStatusModal'
import type { ClienteDTO } from '../../types/cliente'
import type { OrdemServicoDTO, StatusOS } from '../../types/os'

type Aba = 'dados' | 'contatos' | 'os'

const TIPO_LABEL: Record<string, string> = {
  PESSOA_FISICA: 'Pessoa Física',
  PESSOA_JURIDICA: 'Pessoa Jurídica',
}

const STATUS_BADGE: Record<string, string> = {
  ATIVO: 'b-green',
  INATIVO: 'b-gray',
  BLOQUEADO: 'b-red',
}

const STATUS_OS_LABEL: Record<StatusOS, string> = {
  ABERTA: 'Aberta',
  EM_ANDAMENTO: 'Em andamento',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
}

const STATUS_OS_BADGE: Record<StatusOS, string> = {
  ABERTA: 'b-blue',
  EM_ANDAMENTO: 'b-amber',
  CONCLUIDA: 'b-green',
  CANCELADA: 'b-red',
}

export default function ClienteDetalhe() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [aba, setAba] = useState<Aba>('dados')
  const [cliente, setCliente] = useState<ClienteDTO | null>(null)
  const [ordens, setOrdens] = useState<OrdemServicoDTO[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [modalStatus, setModalStatus] = useState<AcaoStatus | null>(null)

  const [editandoNumero, setEditandoNumero] = useState(false)
  const [novoNumero, setNovoNumero] = useState('')
  const [erroNumero, setErroNumero] = useState<string | null>(null)

  const carregar = () => {
    if (!id) return
    setCarregando(true)
    Promise.all([clientesApi.buscarCompleto(id), osApi.listarPorCliente(id)])
      .then(([clienteData, ordensData]) => {
        setCliente(clienteData)
        setOrdens(ordensData)
      })
      .catch(() => setErro('Cliente não encontrado.'))
      .finally(() => setCarregando(false))
  }

  useEffect(carregar, [id])

  if (carregando) return <div className="loading">Carregando</div>
  if (erro || !cliente) return <div className="error-banner">{erro ?? 'Cliente não encontrado.'}</div>

  const iniciarEdicaoNumero = () => {
    setNovoNumero(String(cliente.numeroIdentificacao))
    setErroNumero(null)
    setEditandoNumero(true)
  }

  const salvarNumero = async () => {
    if (!id) return
    setErroNumero(null)
    try {
      await clientesApi.atualizar(id, { numeroIdentificacao: Number(novoNumero) })
      setEditandoNumero(false)
      carregar()
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Não foi possível alterar o número.'
      setErroNumero(msg)
    }
  }

  return (
    <div className="fade-in">
      <div className="breadcrumb">
        <span className="crumb" onClick={() => navigate('/clientes')}>Clientes</span>
        <span className="sep">/</span>
        <span className="current">{cliente.nomeRazaoSocial}</span>
      </div>

      <div className="page-header">
        <div>
          <div className="page-title">
            {cliente.nomeRazaoSocial}
            {cliente.nomeFantasia && (
              <span style={{ color: 'var(--text3)', fontWeight: 400 }}> ({cliente.nomeFantasia})</span>
            )}
          </div>
          <div className="page-sub" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span>// {TIPO_LABEL[cliente.tipo] ?? cliente.tipo}</span>
            <span>·</span>
            <span>Nº</span>
            {!editandoNumero && (
              <>
                <strong>{cliente.numeroIdentificacao}</strong>
                <span className="crumb" style={{ cursor: 'pointer' }} onClick={iniciarEdicaoNumero}>alterar</span>
              </>
            )}
            {editandoNumero && (
              <>
                <input
                  type="number" className="form-input" style={{ width: 90, padding: '2px 6px' }}
                  value={novoNumero} onChange={e => setNovoNumero(e.target.value)}
                />
                <button className="btn btn-sm btn-amber" onClick={salvarNumero}>Salvar</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setEditandoNumero(false)}>Cancelar</button>
              </>
            )}
          </div>
          {erroNumero && <div className="error-banner" style={{ marginTop: 8 }}>{erroNumero}</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className={`badge ${STATUS_BADGE[cliente.status] ?? 'b-gray'}`}>{cliente.status}</span>
          {cliente.status !== 'ATIVO' && (
            <button className="btn btn-sm btn-green" onClick={() => setModalStatus('ativar')}>Ativar</button>
          )}
          {cliente.status !== 'BLOQUEADO' && (
            <button className="btn btn-sm btn-danger" onClick={() => setModalStatus('bloquear')}>Bloquear</button>
          )}
          {cliente.status === 'ATIVO' && (
            <button className="btn btn-sm btn-ghost" onClick={() => setModalStatus('inativar')}>Inativar</button>
          )}
        </div>
      </div>

      <div className="tabs">
        <div className={`tab${aba === 'dados' ? ' active' : ''}`} onClick={() => setAba('dados')}>Dados gerais</div>
        <div className={`tab${aba === 'contatos' ? ' active' : ''}`} onClick={() => setAba('contatos')}>
          Contatos<span className="tab-count">{cliente.contatos?.length ?? 0}</span>
        </div>
        <div className={`tab${aba === 'os' ? ' active' : ''}`} onClick={() => setAba('os')}>
          Ordens de Serviço<span className="tab-count">{ordens.length}</span>
        </div>
      </div>

      {aba === 'dados' && (
        <>
          <div className="section-card">
            <div className="form-row form-row-2">
              <div>
                <div className="form-label">Documento</div>
                <div>{cliente.documento}</div>
              </div>
              <div>
                <div className="form-label">Inscrição estadual</div>
                <div>{cliente.inscricaoEstadual || '—'}</div>
              </div>
            </div>
          </div>

          <div className="section-hd"><h3>Endereço</h3></div>
          {!cliente.endereco && <div className="empty">Nenhum endereço cadastrado.</div>}
          {cliente.endereco && (
            <div className="section-card">
              <div>
                {cliente.endereco.logradouro}
                {cliente.endereco.numero ? `, ${cliente.endereco.numero}` : ''}
                {cliente.endereco.complemento ? ` — ${cliente.endereco.complemento}` : ''}
              </div>
              <div className="page-sub" style={{ marginTop: 4 }}>
                {[cliente.endereco.bairro, cliente.endereco.cidade, cliente.endereco.estado]
                  .filter(Boolean)
                  .join(' · ')}
                {cliente.endereco.cep ? ` · CEP ${cliente.endereco.cep}` : ''}
              </div>
            </div>
          )}
        </>
      )}

      {aba === 'contatos' && (
        <>
          {(!cliente.contatos || cliente.contatos.length === 0) && (
            <div className="empty">Nenhum contato cadastrado.</div>
          )}
          {cliente.contatos && cliente.contatos.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Cargo</th>
                  <th>Telefone</th>
                </tr>
              </thead>
              <tbody>
                {cliente.contatos.map(contato => (
                  <tr key={contato.id}>
                    <td>{contato.nome}{contato.principal && <span className="badge b-blue" style={{ marginLeft: 6 }}>Principal</span>}</td>
                    <td>{contato.cargo || '—'}</td>
                    <td>{contato.telefone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {aba === 'os' && (
        <>
          <div className="section-hd">
            <h3>Ordens de Serviço ({ordens.length})</h3>
            <button className="btn btn-sm btn-amber" onClick={() => navigate(`/os/novo?clienteId=${cliente.id}`)}>
              + Nova OS
            </button>
          </div>

          {ordens.length === 0 && <div className="empty">Nenhuma OS registrada ainda.</div>}

          {ordens.length > 0 && (
            <table className="table">
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Solicitante</th>
                  <th>Data de abertura</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ordens.map(os => (
                  <tr key={os.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/os/${os.id}`)}>
                    <td>{os.numero}</td>
                    <td>{os.solicitante || '—'}</td>
                    <td>{new Date(os.dataAbertura).toLocaleDateString('pt-BR')}</td>
                    <td><span className={`badge ${STATUS_OS_BADGE[os.status]}`}>{STATUS_OS_LABEL[os.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {modalStatus && id && (
        <AlterarStatusModal
          clienteId={id}
          acao={modalStatus}
          onClose={() => setModalStatus(null)}
          onSalvo={() => { setModalStatus(null); carregar() }}
        />
      )}
    </div>
  )
}
