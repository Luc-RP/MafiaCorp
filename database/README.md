# MafiaCorp: migração de contas locais para Aiven PostgreSQL

**Status:** GATE DB-01 PREPARADO. Ainda não existe serviço PostgreSQL no projeto Aiven conectado. Não executar `001_accounts.sql` sem instância criada.

## Decisões de produto

- Cadastro remoto: nome, codinome único usado como login e senha com **mínimo 8 caracteres**, validada no servidor com política de força adequada.
- Cadastro público nunca concede papel `admin`; o primeiro administrador requer bootstrap seguro, iniciado pelo responsável pelo site.
- O servidor salva somente hash de senha com KDF forte e salt por conta. Nunca usar SHA-256 simples nem transmitir hash de senha ao cliente.
- Sessões de navegador com cookie `HttpOnly`, `Secure`, `SameSite=Lax`, expiração e revogação pelo servidor.
- Painel ADM global: lista todos os perfis remotos, bloqueia, redefine credenciais, reativa e exclui contas com confirmação. Essas operações invalidam sessões associadas.
- Auditoria registra operações administrativas sem gravar senhas.
- Separar **contas de login** de **personagens RP**. Não migrar automaticamente identidades ou credenciais da chave `bi_offline_db_v2`.
- Dossiês, evidências, localizações e fichas que hoje usam `localStorage` ainda não estarão sincronizados somente por criar o banco de contas. Essa será uma migração separada.
- A aplicação antiga não deve ser cortada para login remoto até API, banco, variáveis de ambiente e bootstrap passarem por teste de ponta a ponta.

## Banco proposto

- `mc_accounts`: perfis, senha derivada, cargo, bloqueio, revisão de senha, tentativa de login e horários.
- `mc_sessions`: hash de tokens opacos, validade e revogação.
- `mc_auth_audit`: trilha de alterações administrativas.

## Provisionamento pendente

Projeto Aiven conectado: `ldxgamess-1ba9` (sem PostgreSQL preexistente).

Planos encontrados pela integração:
- `free-1-1gb`: US$ 0/h em `aws-us-east-1`, `aws-us-east-2`, `do-nyc`, `aws-us-west-2` e algumas regiões europeias, mas não na região padrão São Paulo.
- `hobbyist`: US$ 0,048/h na `google-southamerica-east1` (estimativa US$ 35,04 por 730h).

**Não provisionar serviço pago nem escolher região sem decisão explícita do usuário.** Após autorização, criar PostgreSQL 17, aplicar DDL (uma instrução por chamada), validar schema e então implantar API no Vercel com credenciais apenas server-side.

## Arquivo

`database/001_accounts.sql` contém a migração inicial, preparada e não aplicada.
