# radio-gestão (frontend)

Interface web do sistema de gestão de uma empresa de rádio comunicação — acompanha o fluxo completo de uma ordem de serviço, do recebimento do equipamento até a entrega, incluindo orçamento, garantia e configurações administráveis.

> Backend (Spring Boot + Java): [radio-gestao](https://github.com/vitrosmachado/radio-gestao)

![demo](docs/demo.gif)

## Funcionalidades

- **Ordens de serviço** com avaliação técnica por item, fila de manutenção, e ações de separar/desmembrar/unir itens entre OS conforme o ritmo de cada um.
- **Orçamento** com edição de peças/valores, reabertura de orçamento enviado, e indicador visual de peça coberta por garantia.
- **Cadastro de clientes** com contatos, postos e endereço, consulta automática de CNPJ, e histórico de garantia por equipamento/acessório.
- **Estoque e catálogo** de equipamentos/acessórios/peças, com resolução por número de série.
- **Configurações administráveis** (prazos de garantia, valor de mão de obra, dados da empresa) sem precisar de deploy.
- **Geração de PDF** (OS e orçamento) direto do navegador, com barra de progresso durante a geração.
- **Notificações** internas e autocomplete de texto nos campos de avaliação técnica mais usados.

## Tecnologias

React 19 · TypeScript · Vite · React Router · React Hook Form · Axios · Oxlint

## Estrutura

```
src/
├── api/          # clientes HTTP por módulo (axios)
├── components/    # componentes reutilizáveis entre páginas
├── contexts/      # autenticação e estado global
├── layouts/       # shell da aplicação (sidebar, navegação) e design system em CSS puro
├── pages/         # uma pasta por módulo de negócio (os, orcamentos, clientes, estoque, configuracoes...)
└── types/         # tipos TypeScript espelhando os DTOs do backend
```

## Como rodar localmente

Pré-requisito: Node.js 20+. O [backend](https://github.com/vitrosmachado/radio-gestao) precisa estar rodando (padrão: `http://localhost:8080/api`).

```bash
npm install
npm run dev      # http://localhost:5173
```

Pra apontar pra uma API em outro endereço, crie um `.env` com `VITE_API_URL=http://seu-host/api`.

## Build e lint

```bash
npm run build    # tsc -b && vite build
npm run lint      # oxlint
```
