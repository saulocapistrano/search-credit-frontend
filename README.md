# Search Credit Frontend

Aplicação web desenvolvida em Angular para consulta e visualização de créditos fiscais através de número de NFS-e ou número do crédito.

## Visão Geral

O Search Credit Frontend é uma Single Page Application (SPA) que fornece uma interface moderna e responsiva para consulta de créditos fiscais. A aplicação permite aos usuários buscar créditos utilizando dois métodos distintos: por número de NFS-e ou por número do crédito, exibindo informações detalhadas de forma clara e organizada.

## Tecnologias Utilizadas

### Framework e Core
- **Angular 19.2.0** - Framework principal
- **TypeScript 5.7.2** - Linguagem de programação
- **RxJS 7.8.0** - Programação reativa
- **Zone.js 0.15.0** - Detecção de mudanças

### UI e Estilização
- **Bootstrap 5.3.8** - Framework CSS responsivo
- **SCSS** - Pré-processador CSS
- **Font Awesome 7.1.0** - Biblioteca de ícones (disponível, não utilizado ativamente)

### Roteamento e Formulários
- **Angular Router 19.2.0** - Roteamento de páginas
- **Angular Reactive Forms** - Formulários reativos com validação

### HTTP e Comunicação
- **Angular HttpClient** - Cliente HTTP para comunicação com API REST
- **Express 4.18.2** - Servidor Node.js (para SSR, configurado mas não utilizado)

### Testes
- **Jasmine 5.6.0** - Framework de testes
- **Karma 6.4.0** - Test runner
- **HttpClientTestingModule** - Mock de requisições HTTP em testes

### Build e Deploy
- **Angular CLI 19.2.15** - Ferramentas de build e desenvolvimento
- **Docker** - Containerização
- **Nginx** - Servidor web para produção

## Arquitetura do Projeto

A aplicação segue uma arquitetura modular baseada em features, com separação clara de responsabilidades:

```
src/app/
├── core/                          # Módulos e serviços compartilhados
│   ├── models/                    # Interfaces e DTOs
│   │   ├── credito-response.dto.ts
│   │   └── credito-detalhado.dto.ts
│   └── services/                  # Serviços HTTP
│       └── credito.service.ts
├── features/                      # Módulos de funcionalidades
│   ├── consulta-nfse/             # Consulta por NFS-e
│   │   ├── consulta-nfse.component.ts
│   │   ├── consulta-nfse.component.html
│   │   ├── consulta-nfse.component.scss
│   │   └── consulta-nfse.component.spec.ts
│   └── consulta-credito/          # Consulta por número do crédito
│       ├── consulta-credito.component.ts
│       ├── consulta-credito.component.html
│       └── consulta-credito.component.scss
├── app.component.ts               # Componente raiz
├── app.routes.ts                  # Configuração de rotas
└── app.config.ts                  # Configuração da aplicação
```

## Funcionalidades Implementadas

### 1. Consulta por Número de NFS-e

Permite buscar todos os créditos associados a um número de NFS-e específico.

**Endpoint:** `GET /api/creditos/{numeroNfse}`

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

### 2. Consulta por Número do Crédito

Permite buscar um crédito específico pelo seu número único.

**Endpoint:** `GET /api/creditos/credito/{numeroCredito}`

**Características:**
- Formulário reativo com validação
- Exibição imediata dos detalhes em modal
- Loading indicator durante a busca
- Tratamento de erros específicos (404, 500, outros)
- Mensagem inicial orientando o usuário
- Suporte a teclado (Enter para buscar)

### 3. Modal de Detalhes do Crédito

Exibe informações completas do crédito selecionado.

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

### 4. Navegação

Menu de navegação fixo no topo da página com links para:
- Consulta por NFS-e
- Consulta por Número do Crédito

**Características:**
- Menu responsivo com collapse em mobile
- Indicação visual da rota ativa
- Navegação suave entre páginas

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

## Pré-requisitos

- **Node.js 18+** (para desenvolvimento local)
- **npm** ou **yarn**
- **Docker** e **Docker Compose** (para ambiente containerizado)
- **Angular CLI 19.2.15** (instalado globalmente ou via npx)

## Instalação e Configuração

### Desenvolvimento Local

1. Clone o repositório:
```bash
git clone <repository-url>
cd search-credit-frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm start
# ou
ng serve
```

4. Acesse a aplicação em `http://localhost:4200`

### Build para Produção

```bash
npm run build
```

Os arquivos compilados estarão em `dist/search-credit-frontend/browser/`

## Ambiente Docker

A aplicação está configurada para execução em ambiente Docker. Para instruções detalhadas sobre inicialização do ambiente completo, consulte o [Guia de Inicialização Docker](GUIA_INICIALIZACAO.md).

### Resumo Rápido

1. Criar a rede Docker compartilhada:
```bash
docker network create search-credit-network
```

2. Iniciar o backend (search-credit) primeiro

3. Iniciar o worker (credito-analise-worker) em seguida

4. Iniciar o frontend:
```bash
docker-compose up -d --build
```

O frontend estará disponível em `http://localhost:4200`

### Configuração do Nginx

O frontend utiliza Nginx como servidor web em produção, configurado para:
- Servir arquivos estáticos da aplicação Angular
- Proxy reverso para `/api/` direcionando para o backend em `http://search-credit:8189`
- Suporte a rotas SPA (Single Page Application)

## Testes

### Executar Testes Unitários

```bash
npm test
# ou
ng test
```

### Executar Testes com Cobertura

```bash
ng test --code-coverage
```

### Estrutura de Testes

Os testes estão organizados seguindo as melhores práticas:
- Uso de `HttpClientTestingModule` para mockar requisições HTTP
- Testes isolados por funcionalidade
- Cobertura de cenários de sucesso e erro
- Validação de estados e comportamentos do componente

**Arquivos de teste:**
- `src/app/app.component.spec.ts`
- `src/app/features/consulta-nfse/consulta-nfse.component.spec.ts`

## Estrutura de Rotas

A aplicação utiliza lazy loading para otimizar o carregamento inicial:

```typescript
/consulta-nfse          → ConsultaNfseComponent (lazy loaded)
/consulta-credito       → ConsultaCreditoComponent (lazy loaded)
/                       → Redireciona para /consulta-nfse
```

## Padrões e Boas Práticas

### Separação de Responsabilidades
- Serviços HTTP isolados em `core/services/`
- DTOs e interfaces em `core/models/`
- Componentes de feature em módulos separados
- Lógica de negócio nos componentes, comunicação HTTP nos serviços

### Formulários Reativos
- Validação no TypeScript usando `Validators`
- Controle de estado `disabled` via FormControl (não via template)
- Mensagens de erro contextuais
- Feedback visual de validação

### Tratamento de Erros
- Tratamento centralizado no serviço
- Mensagens específicas por código HTTP (404, 500, etc.)
- Exibição de erros de forma amigável ao usuário

### Acessibilidade
- Suporte a navegação por teclado
- Atributos ARIA quando necessário
- Estrutura semântica HTML

## Configuração da API

A URL base da API está configurada no serviço `CreditoService`:

```typescript
private readonly apiUrl = '/api';
```

Em ambiente Docker, o Nginx faz proxy reverso de `/api/` para o backend. Para desenvolvimento local, pode ser necessário configurar um proxy ou ajustar a URL base.

## Scripts Disponíveis

- `npm start` - Inicia servidor de desenvolvimento
- `npm run build` - Build de produção
- `npm run watch` - Build em modo watch (desenvolvimento)
- `npm test` - Executa testes unitários
- `ng serve` - Alias para `npm start`
- `ng build` - Alias para `npm run build`

## Dependências do Ecossistema

Este frontend faz parte de um ecossistema maior que inclui:

1. **search-credit** - API Backend (porta 8189)
   - Fornece endpoints REST para consulta de créditos
   - Gerencia PostgreSQL e Kafka

2. **credito-analise-worker** - Worker de processamento
   - Processa mensagens do Kafka
   - Realiza análises assíncronas

3. **search-credit-frontend** - Este projeto
   - Interface web para consulta de créditos
   - Comunica-se com a API via proxy reverso

Para mais detalhes sobre a ordem de inicialização e dependências, consulte o [Guia de Inicialização Docker](GUIA_INICIALIZACAO.md).

## Troubleshooting

### Problema: Frontend não consegue acessar o backend

**Sintomas:** Erro 502 Bad Gateway ou "host not found in upstream"

**Soluções:**
1. Verificar se o backend está rodando: `docker ps | grep search-credit`
2. Verificar se estão na mesma rede Docker: `docker network inspect search-credit-network`
3. Verificar configuração do Nginx em `nginx.conf`
4. Reiniciar o frontend: `docker-compose restart`

### Problema: Build falha com erro de SSR

**Solução:** O projeto está configurado para build apenas client-side. Verifique se o `angular.json` não contém configurações de `server` ou `ssr`.

### Problema: Testes falham

**Soluções:**
1. Verificar se `ActivatedRoute` está mockado nos testes
2. Verificar se `HttpClientTestingModule` está importado
3. Executar `npm install` para garantir dependências atualizadas

## Contribuição

Ao contribuir com este projeto, mantenha:
- Padrões de código consistentes
- Cobertura de testes adequada
- Documentação atualizada
- Separação de responsabilidades
- Código limpo sem comentários desnecessários

## Licença

Este projeto é privado e proprietário.

## Contato e Suporte

Para questões técnicas ou problemas, consulte a documentação do projeto ou entre em contato com a equipe de desenvolvimento.

---

**Última atualização:** 2024
**Versão:** 1.0.0
