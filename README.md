# Search Credit Frontend

Aplicação web desenvolvida em Angular para consulta e visualização de créditos fiscais através de número de NFS-e ou número do crédito.

## Links dos Repositórios

- **Backend:** https://github.com/saulocapistrano/search-credit
- **Frontend (Este projeto):** https://github.com/saulocapistrano/search-credit-frontend
- **Worker:** https://github.com/saulocapistrano/credito-analise-worker

## Pré-requisitos Obrigatórios

- **Docker Desktop** instalado e **rodando**
- **Node.js 18+** (para desenvolvimento local, se necessário)
- **npm** ou **yarn** (para desenvolvimento local)

**Verificar Docker:**
```bash
docker ps
```

Se o comando acima falhar, inicie o Docker Desktop e aguarde até que esteja totalmente inicializado.

## Comandos para Executar o Frontend

```bash
# 1. Clone o repositório
git clone https://github.com/saulocapistrano/search-credit-frontend.git
cd search-credit-frontend

# 2. Criar rede Docker (se não existir)
docker network create search-credit-network

# 3. Subir o frontend
docker compose up -d --build

# 4. Verificar logs do frontend
docker compose logs -f frontend
```

**Aguarde até ver:** Container rodando e Nginx respondendo.

**Acessar:** http://localhost:4200

## Execução do Ecossistema Completo

Para testar o sistema completo (Backend + Frontend), execute os projetos abaixo na ordem indicada.

### Backend Spring Boot

```bash
git clone https://github.com/saulocapistrano/search-credit.git
cd search-credit
./mvnw clean package
docker compose up -d postgres zookeeper kafka kafka-ui
docker compose up -d search-credit
```

**Repositório:** https://github.com/saulocapistrano/search-credit

**Responsabilidades:**
- API REST para consulta de créditos
- Gerencia PostgreSQL e Kafka
- Porta: `8189`

**Acessar:** http://localhost:8189/swagger-ui.html

### Frontend Angular (Este Projeto)

```bash
git clone https://github.com/saulocapistrano/search-credit-frontend.git
cd search-credit-frontend
docker compose up -d --build
```

**Repositório:** https://github.com/saulocapistrano/search-credit-frontend

**Responsabilidades:**
- Interface web para consulta de créditos
- Consulta por NFS-e ou número do crédito
- Tabela responsiva de resultados
- Porta: `4200`

**Acessar:** http://localhost:4200

### Serviço de Análise (Opcional)

O worker Kafka é um serviço adicional.

### Worker Kafka (Opcional)

```bash
git clone https://github.com/saulocapistrano/credito-analise-worker.git
cd credito-analise-worker
./mvnw clean package
docker compose up -d worker
```

**Repositório:** https://github.com/saulocapistrano/credito-analise-worker

**Responsabilidades:**
- Consome eventos Kafka do tópico `consulta-creditos-topic`
- Processa eventos de consulta de forma assíncrona
- Porta: `8081`

## Execução do Frontend Isoladamente

O frontend pode ser executado isoladamente para desenvolvimento local. A comunicação com a API requer que o backend esteja rodando e acessível.

### Desenvolvimento Local

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor de desenvolvimento
npm start
# ou
ng serve
```

**Acessar:** http://localhost:4200

**Nota:** Para desenvolvimento local, pode ser necessário configurar um proxy para `/api/` ou ajustar a URL base no serviço `CreditoService`.

## Funcionalidades Implementadas

### Consulta por Número de NFS-e

Permite buscar todos os créditos associados a um número de NFS-e específico.

**Endpoint utilizado:** `GET /api/creditos/{numeroNfse}`

**Características:**
- Formulário reativo com validação
- Exibição de resultados em tabela responsiva
- Loading indicator durante a busca
- Tratamento de erros com mensagens específicas
- Clique na linha para exibir detalhes completos
- Suporte a scroll horizontal em dispositivos móveis

**Campos exibidos na tabela:**
- Número do Crédito
- Número NFSe
- Valor
- Data de Emissão
- Status (com badge colorido)

### Consulta por Número do Crédito

Permite buscar um crédito específico pelo seu número único.

**Endpoint utilizado:** `GET /api/creditos/credito/{numeroCredito}`

**Características:**
- Formulário reativo com validação
- Exibição imediata dos detalhes em modal
- Loading indicator durante a busca
- Tratamento de erros específicos (404, 500, outros)
- Mensagem inicial orientando o usuário
- Suporte a teclado (Enter para buscar)

**Status HTTP tratados:**
- `200 OK` - Crédito encontrado
- `404 Not Found` - Crédito não encontrado
- `500 Internal Server Error` - Erro interno do servidor

### Modal de Detalhes do Crédito

Exibe informações completas do crédito selecionado em modal responsivo.

**Campos exibidos:**
- Número do Crédito
- Número NFSe
- Tipo de Crédito
- Status
- Valor Faturado
- Valor de Dedução
- Base de Cálculo
- Alíquota
- Valor ISSQN
- Simples Nacional
- Data de Constituição
- Data de Emissão
- Valor Total

**Características:**
- Layout responsivo (máximo 95% da largura em mobile)
- Formatação adequada de valores monetários, datas e percentuais
- Tratamento de valores opcionais
- Botão de fechar sempre visível

## Testes Automatizados

### Executar Testes

```bash
npm test
# ou
ng test
```

**Cobertura:**
- Testes unitários do `ConsultaNfseComponent`
- Testes do `AppComponent`
- Jasmine e Karma
- Mock de requisições HTTP via `HttpClientTestingModule`
- Testes isolados sem dependências externas

### Executar Testes com Cobertura

```bash
ng test --code-coverage
```

## Tecnologias e Recursos

### Stack Tecnológico

- **Angular 19.2.0** - Framework principal
- **TypeScript 5.7.2** - Linguagem de programação
- **RxJS 7.8.0** - Programação reativa
- **Bootstrap 5.3.8** - Framework CSS responsivo
- **SCSS** - Pré-processador CSS
- **Angular Reactive Forms** - Formulários reativos
- **Angular Router** - Roteamento de páginas
- **Docker & Docker Compose** - Containerização
- **Nginx** - Servidor web para produção
- **Jasmine & Karma** - Testes unitários

### Arquitetura

O projeto segue uma arquitetura modular baseada em features, com separação clara de responsabilidades:

- **Core**: Serviços HTTP compartilhados e modelos/DTOs
- **Features**: Componentes de funcionalidades específicas (consulta-nfse, consulta-credito)
- **Standalone Components**: Componentes independentes sem módulos tradicionais
- **Lazy Loading**: Carregamento sob demanda das rotas

### Comunicação com Backend

O frontend comunica-se com a API através de proxy reverso configurado no Nginx:

- **Proxy Reverso**: `/api/` → `http://search-credit:8189`
- **Resolução DNS**: Utiliza nome do serviço Docker `search-credit`
- **Rede Compartilhada**: Todos os serviços na rede `search-credit-network`

### Padrões de Projeto

- **Service Pattern** - Separação de lógica HTTP em serviços
- **DTO Pattern** - Interfaces TypeScript para transferência de dados
- **Reactive Forms** - Formulários reativos com validação
- **Dependency Injection** - Injeção via Angular
- **Lazy Loading** - Carregamento sob demanda de componentes

## Comandos Úteis

### Verificar Status do Serviço

```bash
docker compose ps
```

### Ver Logs

```bash
docker compose logs -f frontend
```

### Parar o Serviço

```bash
docker compose down
```

### Reiniciar o Serviço

```bash
docker compose restart
```

### Build Local

```bash
npm run build
```

Os arquivos compilados estarão em `dist/search-credit-frontend/browser/`

## Troubleshooting

### Docker Desktop não está rodando

**Sintoma:** `Cannot connect to the Docker daemon`

**Solução:** Inicie o Docker Desktop e aguarde até que esteja totalmente inicializado.

### Porta já está em uso

**Sintoma:** `Bind for 0.0.0.0:4200 failed: port is already allocated`

**Solução:** Identifique e pare o processo usando a porta ou altere a porta no `docker-compose.yml`.

### Frontend não consegue acessar o backend

**Sintoma:** Erro 502 Bad Gateway ou "host not found in upstream"

**Soluções:**
1. Verificar se o backend está rodando: `docker ps | grep search-credit`
2. Verificar se estão na mesma rede Docker: `docker network inspect search-credit-network`
3. Verificar configuração do Nginx em `nginx.conf`
4. Reiniciar o frontend: `docker compose restart`

### Rede Docker não existe

**Sintoma:** `network search-credit-network not found`

**Solução:**
```bash
docker network create search-credit-network
```

### Build falha com erro de SSR

**Sintoma:** Erro durante build relacionado a prerendering

**Solução:** O projeto está configurado para build apenas client-side. Verifique se o `angular.json` não contém configurações de `server` ou `ssr`.

### Testes falham

**Sintomas:** Erros relacionados a `ActivatedRoute` ou `HttpClient`

**Soluções:**
1. Verificar se `ActivatedRoute` está mockado nos testes do `AppComponent`
2. Verificar se `HttpClientTestingModule` está importado nos testes
3. Executar `npm install` para garantir dependências atualizadas

## Estrutura do Projeto

```
search-credit-frontend/
├── src/
│   ├── app/
│   │   ├── core/                  # Serviços e modelos compartilhados
│   │   │   ├── models/            # DTOs e interfaces
│   │   │   │   ├── credito-response.dto.ts
│   │   │   │   └── credito-detalhado.dto.ts
│   │   │   └── services/          # Serviços HTTP
│   │   │       └── credito.service.ts
│   │   ├── features/              # Módulos de funcionalidades
│   │   │   ├── consulta-nfse/     # Consulta por NFS-e
│   │   │   │   ├── consulta-nfse.component.ts
│   │   │   │   ├── consulta-nfse.component.html
│   │   │   │   ├── consulta-nfse.component.scss
│   │   │   │   └── consulta-nfse.component.spec.ts
│   │   │   └── consulta-credito/  # Consulta por número do crédito
│   │   │       ├── consulta-credito.component.ts
│   │   │       ├── consulta-credito.component.html
│   │   │       └── consulta-credito.component.scss
│   │   ├── app.component.ts       # Componente raiz
│   │   ├── app.routes.ts          # Configuração de rotas
│   │   └── app.config.ts          # Configuração da aplicação
│   ├── index.html
│   └── styles.scss                # Estilos globais
├── docker-compose.yml
├── Dockerfile
├── nginx.conf                      # Configuração do Nginx
├── angular.json
├── package.json
└── README.md
```

## Responsividade

A aplicação foi desenvolvida com foco em responsividade, garantindo experiência adequada em diferentes tamanhos de tela:

- **Desktop:** Layout completo com tabelas e modais em tamanho padrão
- **Tablet:** Adaptação de colunas e espaçamentos
- **Mobile (< 768px):**
  - Tabelas com scroll horizontal
  - Botões com largura total
  - Modais ocupando até 95% da largura
  - Inputs com área de toque adequada (mínimo 44px)
  - Menu hambúrguer funcional

## Rotas da Aplicação

A aplicação utiliza lazy loading para otimizar o carregamento inicial:

- `/consulta-nfse` - Consulta por NFS-e (lazy loaded)
- `/consulta-credito` - Consulta por número do crédito (lazy loaded)
- `/` - Redireciona para `/consulta-nfse`

## Configuração do Nginx

O frontend utiliza Nginx como servidor web em produção, configurado para:
- Servir arquivos estáticos da aplicação Angular
- Proxy reverso para `/api/` direcionando para o backend em `http://search-credit:8189`
- Suporte a rotas SPA (Single Page Application)
- Resolução dinâmica de DNS para o backend

**Arquivo:** `nginx.conf`

## Guia de Inicialização Completo

Para instruções detalhadas sobre inicialização do ambiente Docker completo (Backend + Worker + Frontend), consulte o [Guia de Inicialização Docker](GUIA_INICIALIZACAO.md).
