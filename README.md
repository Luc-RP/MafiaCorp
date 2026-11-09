# MafiaCorp | BLACK INVESTIGATION

Interface de inteligência e dossiês baseada na versão HTML enviada em 09/11/2026.

## Estado da produção

- Deploy Vercel: https://mafiacorp.vercel.app
- Código: Luc-RP/MafiaCorp, branch main
- Versão atual: **demonstração pública, somente leitura**.
- O layout e os módulos do HTML enviado foram preservados: investigações, investigados, veículos, locais, contatos, associados, **facções**, evidências, operações, equipe, relatórios, mapa de conexões, auditoria e visualização de anexos.
- Os registros exibidos são **fictícios**, gerados no navegador a cada acesso.
- Não existe login de verdade nem gravação de dados na versão pública. O botão de logout foi ocultado.
- Vários visitantes podem visualizar simultaneamente a aplicação, sem sincronização de edição.

## Conexão Supabase

O projeto informado no HTML foi configurado nas variáveis privadas do Vercel:

- BI_SUPABASE_URL
- BI_SUPABASE_PUBLISHABLE_KEY

A função `api/supabase-status.js` executa uma **checagem mínima de conectividade** do Supabase. Consulta somente o identificador de até um registro, sem retornar o valor JSON, fotos, senhas ou dados de investigação. O frontend mostra o estado dessa checagem; ele **não recebe credenciais de banco**.

Essa checagem **NÃO habilita consulta de dados reais, gravação, autenticação ou segurança**. Se o status indicar conectividade, apenas significa que o serviço respondeu.

## Por que o banco não está conectado diretamente?

O arquivo `supabase-setup.sql` recebido traz a política `bi_state_all` com `USING (true)` e `WITH CHECK (true)`, e políticas amplas sobre o bucket `attachments`. No modelo enviado, o login e as permissões são checados apenas com JavaScript, enquanto uma chave pública permite consultar/escrever diretamente na API, sem passar pelo login. Isso expõe dados e hashes de senhas. Além disso, todos os dados estão em um único JSON compartilhado: edições concorrentes podem se sobrescrever.

O projeto de Supabase informado no HTML não está habilitado para administração pela conexão Supabase deste chat. Portanto, **não houve qualquer alteração no banco de destino** e nenhum SQL de migração foi executado.

## Próxima integração de produção (requer acesso autorizado ao projeto)

1. Conferir e proteger um backup válido antes de qualquer operação no banco.
2. Migrar o login para **Supabase Auth** e ativar contas reais para cada usuário, sem senha padrão no código.
3. Migrar a autorização para regras RLS baseadas em `auth.uid()` e tabela de membros com níveis definidos no servidor.
4. Refatorar o JSON único em tabelas por entidade (ou controle de versão/concorrência em transações), sem perder registros.
5. Proteger o bucket `attachments` por RLS, com acesso de leitura/edição por perfil e URLs assinadas.
6. Validar segurança e testes multiusuário de leitura, escrita, remoção, anexos e auditoria antes de ativar os dados reais.

O exemplo `supabase/lockdown.sql` documenta um bloqueio conservador das políticas abertas. **Não execute sem planejar a migração do login**, pois o HTML antigo perderá acesso aos dados. Ele não apaga os registros.

## Arquivos

- `index.html`: interface completa adaptada para visualização segura.
- `api/supabase-status.js`: checagem mínima no servidor Vercel.
- `supabase-status.js`: selo de conectividade na interface.
- `supabase/lockdown.sql`: script opcional de revogação de políticas abertas, não executado.
- `styles.css` e `app.js`: arquivos legados da primeira demonstração, atualmente não importados pelo index.html.
- `vercel.json`: cabeçalhos HTTP e permissões de recursos estáticos.

**Atenção:** não publique dados de pessoas reais nem carregue fotos, vídeos ou documentos sigilosos até que o fluxo de autenticação, as políticas RLS e a governança do banco estejam implementados e validados.
