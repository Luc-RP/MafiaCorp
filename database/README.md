# MafiaCorp: migração de contas locais para Aiven PostgreSQL

**Status em 10/11/2026:** PostgreSQL 18.6 `mafiacorp` criado e em `RUNNING` na Aiven, projeto `ldxgamess-1ba9`, plano `free-1-1gb`, banco `defaultdb`.
Migrações `001_accounts.sql` e `002_request_limits.sql` **aplicadas**, com tabelas verificadas via consulta SQL. O login remoto **ainda não está ativo** porque faltam segredos server-side na Vercel.

## Código de autenticação implantado
- `server/auth-core.js` usa `pg`, TLS com validação de CA, `scrypt` com salt, sessões via cookie seguro HttpOnly e limitação de requisições.
- `api/auth.js`: `GET /api/auth?action=status`, `GET /api/auth?action=me`, `POST /api/auth?action=register|login|logout`.
- `api/admin.js`: somente administradores autenticados, `GET` lista todas as contas do banco; `POST` cria usuários; `PATCH` bloqueia, reativa, troca senha ou cargo; `DELETE` exclui.
- `mafia-cloud-ui.js`, `mafia-cloud-ui.css` e `index.html`: interface com nome, codinome e senha de mínimo 8 caracteres, e painel ADM central.
- `package.json`: driver PostgreSQL para Vercel.
- O modo remoto é ativado somente se `/api/auth?action=status` reconhecer a configuração e o banco online. Durante a preparação, a interface local existente continua ativa.
- A primeira conta central cadastrada recebe papel `observador`. A elevação do dono a `admin` só ocorre após verificação explícita pelo operador usando Aiven SQL; **o cadastro público nunca cria administrador**.

## Variáveis de ambiente pendentes (somente Vercel, nunca GitHub)
1. `DATABASE_URL`: Service URI `postgresql://...` obtida em Aiven → serviço `mafiacorp` → Overview → Connection information.
2. `AIVEN_CA_CERT`: conteúdo completo do certificado CA do mesmo serviço, incluindo cabeçalho e rodapé PEM, na seção Connection information.
3. `AUTH_SIGNUP_ENABLED` (opcional): `false` fecha os novos cadastros; omitido permite cadastro.

Usar variável **Sensitive** ou **Encrypted**, destino **Production**. Depois é necessário um novo deploy para as funções receberem os novos valores. `DATABASE_URL` e `AIVEN_CA_CERT` são acessados apenas pelo servidor. Não colar usuário/senha/token em arquivos estáticos.

### Verificações após configurar
- `GET /api/auth?action=status` deve retornar `{"mode":"remote","configured":true,"online":true}`.
- Cadastrar uma conta pelo formulário público, usando **nome, codinome único e senha forte de pelo menos 8 caracteres**.
- Conferir o registro na tabela `mc_accounts` sem revelar o hash da senha.
- Promover **somente a conta proprietária escolhida** via comando SQL controlado e reentrar para receber papel de administrador.
- Testar GET /api/admin, bloqueio, redefinição, exclusão e revogação de sessões em outro navegador.

**Limite do escopo:** este gate centraliza só as contas e sessões. Os dossiês e registros operacionais do site continuam no armazenamento local, exigindo migração própria e autorização.


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

## Histórico de provisionamento (concluído)

Projeto Aiven conectado: `ldxgamess-1ba9` (sem PostgreSQL preexistente).

Planos encontrados pela integração:
- `free-1-1gb`: US$ 0/h em `aws-us-east-1`, `aws-us-east-2`, `do-nyc`, `aws-us-west-2` e algumas regiões europeias, mas não na região padrão São Paulo.
- `hobbyist`: US$ 0,048/h na `google-southamerica-east1` (estimativa US$ 35,04 por 730h).

Banco Free já provisionado e migrações aplicadas. Falta somente o vínculo seguro de ambiente no Vercel.

## Arquivo

`database/001_accounts.sql` contém a migração inicial, preparada e não aplicada.
