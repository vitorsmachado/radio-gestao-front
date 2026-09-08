import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthContext } from '../../contexts/AuthContext'
import type { LoginRequest } from '../../types/auth'
import './login.css'

export default function Login() {
  const { login } = useAuthContext()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sessaoExpirada = searchParams.get('sessao') === 'expirada'
  const [erroServidor, setErroServidor] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>()

  const onSubmit = async (dados: LoginRequest) => {
    setErroServidor(null)
    try {
      await login(dados)
      navigate('/', { replace: true })
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })
          ?.response?.data?.message ?? 'Credenciais inválidas'
      setErroServidor(msg)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-text">RADIOGESTÃO</div>
          <div className="login-logo-sub">// sistema de gestão</div>
        </div>

        <form className="login-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="login-field">
            <label htmlFor="login">Usuário</label>
            <input
              id="login"
              type="text"
              placeholder="nome.usuario"
              autoComplete="username"
              autoFocus
              {...register('login', { required: 'Usuário obrigatório' })}
              className={errors.login ? 'input-error' : ''}
            />
            {errors.login && <span className="field-error">{errors.login.message}</span>}
          </div>

          <div className="login-field">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('senha', { required: 'Senha obrigatória' })}
              className={errors.senha ? 'input-error' : ''}
            />
            {errors.senha && <span className="field-error">{errors.senha.message}</span>}
          </div>

          {sessaoExpirada && !erroServidor && (
            <div className="login-erro" style={{ background: 'color-mix(in srgb, var(--amber) 12%, transparent)', borderColor: 'var(--amber)', color: 'var(--amber)' }}>
              Sua sessão expirou. Faça login novamente.
            </div>
          )}
          {erroServidor && (
            <div className="login-erro">{erroServidor}</div>
          )}

          <button
            type="submit"
            className="login-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? '// autenticando...' : 'Entrar'}
          </button>
        </form>

        <div className="login-footer">
          <span>RadioGestão · Sistema de Gestão</span>
        </div>
      </div>
    </div>
  )
}
