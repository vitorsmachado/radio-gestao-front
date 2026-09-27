export interface ConfiguracaoDTO {
  valorMaoDeObraPadrao: number
  prazoGarantiaPecaDias: number
  prazoGarantiaEquipamentoDias: number
  prazoGarantiaAcessorioDias: number
}

export interface AtualizarConfiguracaoRequest {
  valorMaoDeObraPadrao: number
  prazoGarantiaPecaDias: number
  prazoGarantiaEquipamentoDias: number
  prazoGarantiaAcessorioDias: number
}
