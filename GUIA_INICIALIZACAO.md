# 🐳 Guia de Inicialização do Ambiente Docker

## 📋 Visão Geral

Este guia descreve a ordem correta de inicialização dos serviços Docker do ecossistema Search Credit.

### Serviços do Ecossistema

1. **search-credit** - API Backend + PostgreSQL + Kafka
2. **credito-analise-worker** - Worker de processamento
3. **search-credit-frontend** - Frontend Angular (este projeto)

---

## 🔗 Dependências entre Serviços

```
search-credit (API + DB + Kafka)
    │
    ├──> credito-analise-worker (depende de: API, Kafka)
    │
    └──> search-credit-frontend (depende de: API)
```

### Detalhamento das Dependências

| Serviço | Depende de | Motivo |
|---------|------------|--------|
| `search-credit` | Nenhum (base) | Contém PostgreSQL e Kafka que são infraestrutura base |
| `credito-analise-worker` | `search-credit` | Precisa da API para receber tarefas e do Kafka para processar mensagens |
| `search-credit-frontend` | `search-credit` | Precisa da API disponível para fazer requisições HTTP via proxy reverso |

---

## ✅ Checklist de Pré-requisitos

Antes de iniciar, verifique:

- [ ] Docker instalado e rodando (`docker --version`)
- [ ] Docker Compose instalado (`docker-compose --version`)
- [ ] Rede Docker `search-credit-network` criada (ou será criada automaticamente)
- [ ] Portas disponíveis:
  - `4200` - Frontend
  - `8189` - API Backend (verificar no docker-compose do backend)
  - Portas do PostgreSQL e Kafka (verificar no docker-compose do backend)

---

## 🚀 Passo a Passo de Inicialização

### Etapa 1: Criar a Rede Docker Compartilhada

A rede `search-credit-network` deve existir antes de iniciar os serviços.

```bash
docker network create search-credit-network
```

**Verificar se a rede foi criada:**
```bash
docker network ls | grep search-credit-network
```

**Por que é necessário:**
- Todos os serviços precisam estar na mesma rede para se comunicarem
- O frontend usa o nome `search-credit` para resolver o DNS do backend
- Sem a rede compartilhada, os serviços não conseguem se comunicar

---

### Etapa 2: Iniciar o Backend (search-credit)

**Localização:** Diretório do projeto `search-credit` (backend)

```bash
cd /caminho/para/search-credit
docker-compose up -d
```

**Verificar se os serviços estão rodando:**
```bash
docker-compose ps
```

**Aguardar até que os serviços estejam saudáveis:**
```bash
docker-compose logs -f
```

**Critérios de sucesso:**
- ✅ API respondendo em `http://localhost:8189` (ou porta configurada)
- ✅ PostgreSQL aceitando conexões
- ✅ Kafka brokers ativos
- ✅ Sem erros críticos nos logs

**Por que iniciar primeiro:**
- Contém a infraestrutura base (PostgreSQL e Kafka)
- Outros serviços dependem da API estar disponível
- O worker precisa do Kafka para consumir mensagens
- O frontend precisa da API para fazer requisições

**Tempo estimado:** 30-60 segundos para inicialização completa

---

### Etapa 3: Iniciar o Worker (credito-analise-worker)

**Localização:** Diretório do projeto `credito-analise-worker`

```bash
cd /caminho/para/credito-analise-worker
docker-compose up -d
```

**Verificar se o worker está rodando:**
```bash
docker-compose ps
docker-compose logs -f credito-analise-worker
```

**Critérios de sucesso:**
- ✅ Container em execução
- ✅ Worker conectado ao Kafka
- ✅ Worker conseguindo acessar a API do backend
- ✅ Sem erros de conexão nos logs

**Por que iniciar após o backend:**
- Precisa do Kafka estar rodando para consumir mensagens
- Precisa da API disponível para processar tarefas
- Se iniciar antes, falhará tentando conectar aos serviços

**Tempo estimado:** 10-20 segundos

---

### Etapa 4: Iniciar o Frontend (search-credit-frontend)

**Localização:** Diretório do projeto `search-credit-frontend` (este projeto)

```bash
cd /caminho/para/search-credit-frontend
docker-compose up -d --build
```

**Verificar se o frontend está rodando:**
```bash
docker-compose ps
docker-compose logs -f frontend
```

**Testar acesso:**
```bash
curl http://localhost:4200
```

**Critérios de sucesso:**
- ✅ Container em execução
- ✅ Nginx respondendo na porta 80 (mapeada para 4200)
- ✅ Frontend acessível em `http://localhost:4200`
- ✅ Proxy reverso funcionando (testar `/api/`)

**Por que iniciar por último:**
- Precisa da API disponível para funcionar corretamente
- O Nginx precisa conseguir resolver o DNS do backend (`search-credit`)
- Se iniciar antes, o proxy reverso falhará ao tentar acessar a API

**Tempo estimado:** 30-60 segundos (inclui build do Angular)

---

## 🔍 Verificação Final do Ambiente

### Comando para verificar todos os serviços:

```bash
docker ps --filter "network=search-credit-network"
```

### Testar conectividade entre serviços:

**Do frontend para o backend:**
```bash
docker exec -it search-credit-frontend-frontend-1 wget -O- http://search-credit:8189/health
```

**Verificar logs de todos os serviços:**
```bash
# Backend
cd /caminho/para/search-credit && docker-compose logs --tail=50

# Worker
cd /caminho/para/credito-analise-worker && docker-compose logs --tail=50

# Frontend
cd /caminho/para/search-credit-frontend && docker-compose logs --tail=50
```

---

## 🛑 Ordem de Parada dos Serviços

Para parar os serviços, siga a ordem inversa:

1. **Frontend:**
   ```bash
   cd /caminho/para/search-credit-frontend
   docker-compose down
   ```

2. **Worker:**
   ```bash
   cd /caminho/para/credito-analise-worker
   docker-compose down
   ```

3. **Backend:**
   ```bash
   cd /caminho/para/search-credit
   docker-compose down
   ```

**Nota:** A rede `search-credit-network` permanecerá criada. Para removê-la:
```bash
docker network rm search-credit-network
```

---

## 🐛 Troubleshooting

### Problema: Frontend não consegue acessar o backend

**Sintomas:**
- Erro 502 Bad Gateway no frontend
- Logs do Nginx mostram "host not found in upstream"

**Solução:**
1. Verificar se o backend está rodando:
   ```bash
   docker ps | grep search-credit
   ```
2. Verificar se estão na mesma rede:
   ```bash
   docker network inspect search-credit-network
   ```
3. Verificar se o nome do serviço está correto no `nginx.conf` (deve ser `search-credit`)
4. Reiniciar o frontend:
   ```bash
   cd /caminho/para/search-credit-frontend
   docker-compose restart
   ```

### Problema: Worker não consegue conectar ao Kafka

**Sintomas:**
- Logs do worker mostram erros de conexão ao Kafka
- Worker não processa mensagens

**Solução:**
1. Verificar se o backend (com Kafka) está rodando
2. Verificar se o worker está na rede correta
3. Verificar variáveis de ambiente do worker (host do Kafka)

### Problema: Rede não existe

**Sintomas:**
- Erro ao iniciar serviços: "network search-credit-network not found"

**Solução:**
```bash
docker network create search-credit-network
```

---

## 📝 Notas Importantes

1. **Não usar comandos destrutivos globais:**
   - ❌ `docker system prune -a` (remove tudo)
   - ❌ `docker-compose down --volumes --remove-orphans` (sem cuidado)
   - ✅ Usar comandos específicos por serviço

2. **Build do Frontend:**
   - O primeiro `docker-compose up` fará o build automaticamente
   - Para rebuild após mudanças: `docker-compose up -d --build`

3. **Logs em tempo real:**
   - Use `docker-compose logs -f` para acompanhar inicialização
   - Use `docker-compose logs -f [servico]` para um serviço específico

4. **Variáveis de Ambiente:**
   - Cada serviço pode ter variáveis de ambiente específicas
   - Verificar `.env` ou `docker-compose.yml` de cada projeto

---

## ✅ Checklist de Validação Final

Após seguir todos os passos, verifique:

- [ ] Rede `search-credit-network` criada
- [ ] Backend `search-credit` rodando e saudável
- [ ] Worker `credito-analise-worker` rodando e conectado
- [ ] Frontend `search-credit-frontend` rodando e acessível
- [ ] Frontend consegue fazer requisições para `/api/` (proxy funcionando)
- [ ] Todos os serviços estão na mesma rede Docker
- [ ] Sem erros críticos nos logs

---

## 🎯 Resumo Rápido

```bash
# 1. Criar rede
docker network create search-credit-network

# 2. Backend (API + DB + Kafka)
cd /caminho/search-credit && docker-compose up -d

# 3. Worker
cd /caminho/credito-analise-worker && docker-compose up -d

# 4. Frontend
cd /caminho/search-credit-frontend && docker-compose up -d --build

# Verificar
docker ps --filter "network=search-credit-network"
```

---

**Última atualização:** $(date)
**Versão:** 1.0

