# GoLedger Challenge Web

Aplicação web inspirada no IMDb, desenvolvida em React, para catalogar séries, temporadas, episódios e watchlists usando a API blockchain da GoLedger.

## Visão geral

O projeto consome a API REST disponibilizada no desafio e implementa as operações de `Create`, `Update`, `Delete` e `Search` para os principais tipos de ativos da aplicação.

Entidades cobertas:

- Séries
- Temporadas
- Episódios
- Watchlists

## Funcionalidades

- CRUD completo de séries
- CRUD completo de temporadas
- CRUD completo de episódios
- CRUD completo de watchlists
- Busca remota integrada à API
- Interface responsiva
- Modais para criação e edição
- Toasts de sucesso e erro
- Loading states
- Confirmação antes de excluir

## Stack utilizada

- React
- TypeScript
- Vite
- Tailwind CSS
- React Query
- Radix UI / componentes no estilo shadcn

## API do desafio

Base URL:

```bash
http://ec2-50-19-36-138.compute-1.amazonaws.com
```

Swagger:

```bash
http://ec2-50-19-36-138.compute-1.amazonaws.com/api-docs/index.html
```

A API utiliza autenticação Basic Auth com as credenciais enviadas por e-mail.

## Como executar o projeto

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure o ambiente

Crie um arquivo `.env` na raiz do projeto com:

```bash
VITE_API_URL=http://ec2-50-19-36-138.compute-1.amazonaws.com
VITE_API_USER=SEU_USUARIO
VITE_API_PASSWORD=SUA_SENHA
```

Você também pode copiar o arquivo de exemplo:

```bash
copy .env.example .env
```

Depois, substitua os placeholders pelas credenciais reais.

### 3. Execute o projeto em desenvolvimento

```bash
npm run dev
```

Aplicação disponível em:

```bash
http://localhost:8080
```

### 4. Gere a build de produção

```bash
npm run build
```

## Observações técnicas

- O projeto foi ajustado com base no contrato real da API validado via Swagger e testes práticos.
- Watchlists usam o asset type `watchlist`.
- Temporadas usam os campos `number` e `year`.
- Episódios usam `episodeNumber` e `releaseDate` em formato RFC3339 internamente.

## Estrutura principal

```bash
src/
  components/
  pages/
  services/
  types/
```

## Status da entrega

- Build de produção validada com `npm run build`
- Integração com a API validada nos fluxos principais
- Projeto pronto para execução local com `.env`
