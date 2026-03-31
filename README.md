# GoLedger Challenge Web

Interface web inspirada no IMDb, desenvolvida em React, para catalogar séries, temporadas, episódios e watchlists usando a API blockchain da GoLedger.

## Funcionalidades

- CRUD de séries
- CRUD de temporadas
- CRUD de episódios
- CRUD de watchlists
- Busca remota usando a API da GoLedger
- Interface responsiva com modais, toasts, loading e confirmação de exclusão

## Stack utilizada

- React
- TypeScript
- Vite
- Tailwind CSS
- React Query
- Radix UI / componentes no estilo shadcn

## API

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

### 1. Instalar as dependências

```bash
npm install
```

### 2. Criar o arquivo de ambiente

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

### 3. Rodar o projeto em desenvolvimento

```bash
npm run dev
```

A aplicação será iniciada em:

```bash
http://localhost:8080
```

### 4. Gerar build de produção

```bash
npm run build
```

## Observações

- O projeto foi ajustado com base no contrato real da API validado via Swagger e testes práticos.
- Watchlists usam o asset type `watchlist`.
- Temporadas usam os campos `number` e `year`.
- Episódios usam `episodeNumber` e `releaseDate` em formato RFC3339 internamente.
