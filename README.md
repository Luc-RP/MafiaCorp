# Black Investigation | MafiaCorp

Portal de visualização de dossiês, inspirado no protótipo HTML BLACK INVESTIGATION 5.1.

## Publicação atual

**Versão 1.0, somente leitura / demonstração pública.**

- Layout escuro e vermelho inspirado no protótipo.
- Dashboard, investigações, dossiês, investigados, veículos, locais, contatos, associados, evidências, operações, equipe, relatórios, Connection Map e auditoria.
- Pesquisa global, filtros por status, exportação JSON de dados de exemplo e layout responsivo.
- Dados inteiramente demonstrativos, incorporados no arquivo app.js.
- Vários visitantes podem acessar a mesma versão estática simultaneamente através do CDN da Vercel.
- Nenhuma senha, banco de dados, API privada ou registro real é usado nesta versão.
- Sem capacidade de edição compartilhada ou gravação de dados.

## Segurança e limites

O HTML recebido fazia login comparando um SHA-256 no navegador e armazenava usuários, papéis, dossiês e auditoria dentro de um único JSON em Supabase. Esse modelo não deve ser publicado como sistema real de investigação: expõe o mecanismo de autenticação, depende de permissões verificadas no cliente e permite conflitos por sobrescrita entre usuários.

Também havia uma credencial inicial fixa no protótipo. Ela não foi transferida para este repositório. Não reutilize essa senha para uma aplicação real. A URL e a chave publishable do Supabase existente também não foram incorporadas.

Para habilitar dados reais e colaboração segura, será preciso:

1. Acessar um projeto Supabase autorizado para este aplicativo.
2. Usar Supabase Auth (ou autenticação equivalente) com identidades individualizadas.
3. Criar tabelas relacionais por entidade e políticas RLS que validem permissões no banco.
4. Aplicar autorização explícita por usuário e, se necessário, organização/grupo. user_metadata não deve controlar papéis.
5. Definir políticas de acesso a anexos privados e URLs assinadas.
6. Tratar concorrência, trilha de auditoria do lado servidor, validações, backups, retenção e conformidade com a LGPD.
7. Testar sessões de usuários diferentes e operações concorrentes antes de habilitar produção com dados sensíveis.

## Desenvolvimento local

Não exige instalação. Sirva este diretório com um servidor HTTP estático (por exemplo, python -m http.server 8000) e acesse localhost:8000.

## Arquivos

- index.html: estrutura da aplicação.
- styles.css: identidade visual e responsividade.
- app.js: navegação e dados fictícios.
- vercel.json: cabeçalhos HTTP e ajustes de hospedagem.

## Deploy

Projeto estático conectado ao repositório GitHub Luc-RP/MafiaCorp. O branch de produção é main. O Vercel recompila automaticamente ao receber commits na branch vinculada.

## Responsabilidade de uso

Os exemplos não constituem acusações, registros oficiais nem dados verificados. Não substitua amostras por dados pessoais ou sigilosos até que autenticação, políticas RLS e governança sejam implementadas e auditadas.
