# Search Credit Frontend

Aplicação frontend desenvolvida em **Angular** para interação com o ecossistema Search Credit.

O frontend demonstra:
- Consumo de APIs REST
- Controle de perfis
- Atualização de estado sem reload
- Integração com fluxos síncronos e assíncronos

---

## Perfis do Sistema

- **Admin Consulta**
  - Consulta créditos
  - Visualiza detalhes
- **Admin Crédito**
  - Cria solicitações de crédito
- **Admin Full**
  - Aprova ou reprova créditos manualmente
  - Tem precedência sobre decisões automáticas

---

## Funcionalidades

- Criação de solicitação de crédito (multipart + upload MinIO)
- Listagem paginada
- Modal de detalhes do crédito
- Aprovação / reprovação manual (Admin Full)
- Feedback visual com Toasts
- Atualização imediata do status na UI

---

## Execução

```bash
git clone https://github.com/saulocapistrano/search-credit-frontend.git
cd search-credit-frontend
docker compose up -d --build
```

Acessar: http://localhost:4200

---

## Integração com Processamento Assíncrono

O frontend não aguarda decisões automáticas.

Créditos aparecem inicialmente como `EM_ANALISE`.

Caso um worker aprove/reprove, o status será refletido nas consultas subsequentes.

Esse comportamento é intencional e representa sistemas reais orientados a eventos.

---

## Stack

- Angular
- TypeScript
- RxJS
- Docker
- Nginx
