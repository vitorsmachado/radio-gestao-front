export type TipoNotificacao = 'GARANTIA_CONFLITO'

export const TIPO_NOTIFICACAO_LABEL: Record<TipoNotificacao, string> = {
  GARANTIA_CONFLITO: 'Conflito de garantia',
}

export interface NotificacaoDTO {
  id: string
  tipo: TipoNotificacao
  titulo: string
  mensagem?: string
  link?: string
  lida: boolean
  dataCriacao: string
}
