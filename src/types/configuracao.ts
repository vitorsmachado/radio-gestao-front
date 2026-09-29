export interface ConfiguracaoDTO {
  valorMaoDeObraPadrao: number
  prazoGarantiaPecaDias: number
  prazoGarantiaEquipamentoDias: number
  prazoGarantiaAcessorioDias: number
  nomeEmpresa: string
  razaoSocialEmpresa?: string
  documentoEmpresa: string
  inscricaoEstadualEmpresa?: string
  enderecoEmpresa?: string
  bairroEmpresa?: string
  cidadeEmpresa?: string
  telefoneEmpresa?: string
  emailEmpresa?: string
}

export interface AtualizarConfiguracaoRequest {
  valorMaoDeObraPadrao: number
  prazoGarantiaPecaDias: number
  prazoGarantiaEquipamentoDias: number
  prazoGarantiaAcessorioDias: number
  nomeEmpresa: string
  razaoSocialEmpresa?: string
  documentoEmpresa: string
  inscricaoEstadualEmpresa?: string
  enderecoEmpresa?: string
  bairroEmpresa?: string
  cidadeEmpresa?: string
  telefoneEmpresa?: string
  emailEmpresa?: string
}
