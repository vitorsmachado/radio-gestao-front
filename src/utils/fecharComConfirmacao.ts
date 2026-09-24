const MENSAGEM_PADRAO = 'Você tem alterações não salvas. Se sair agora, perderá os dados preenchidos. Deseja continuar?'

/** Confirma o descarte antes de fechar um popup/formulário com alterações não salvas — mesmo texto usado em useUnsavedChanges. */
export function fecharComConfirmacao(dirty: boolean, onClose: () => void, message = MENSAGEM_PADRAO) {
  if (!dirty || window.confirm(message)) onClose()
}
