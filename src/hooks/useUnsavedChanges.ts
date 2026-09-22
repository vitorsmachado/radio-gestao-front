import { useEffect } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * Bloqueia navegação e refresh quando há alterações não salvas.
 * @param isDirty - true quando o formulário foi modificado
 * @param message - mensagem exibida no popup (opcional)
 */
export function useUnsavedChanges(
  isDirty: boolean,
  message = 'Você tem alterações não salvas. Se sair agora, perderá os dados preenchidos. Deseja continuar?',
) {
  // Bloqueia refresh / fechar aba
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = message
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty, message])

  // Bloqueia navegação interna (React Router v7)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  )

  // Quando o blocker é ativado, pede confirmação
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    if (window.confirm(message)) {
      blocker.proceed()
    } else {
      blocker.reset()
    }
  }, [blocker, message])
}
