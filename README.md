# MafiaCorp / BLACK INVESTIGATION

Site atualizado com a interface completa do `index.html` enviado em 09/11/2026, **sem Supabase ou outro banco remoto**.

## Produção
- https://mafiacorp.vercel.app
- https://github.com/Luc-RP/MafiaCorp
- Hospedagem Vercel; `main` publica automaticamente.

## Funcionalidades
Dashboard, investigações, investigados, veículos, locais e mapa Leaflet, contatos, associados, facções, evidências, operações, equipe, relatórios, auditoria e mapa de conexões. Cadastro, edição, pesquisa e arquivamento habilitados.

Registros e perfis são salvos em **localStorage**. Arquivos de imagem/vídeo/documentos ficam em **IndexedDB**, sujeitos ao espaço disponível no navegador. No primeiro acesso, cada navegador define seu login e senha locais. O sistema tenta recuperar automaticamente uma base legada que esteja salva na chave `bi_local_cache_v1`.

### Limitações importantes
- Não existe sincronização de dados entre pessoas ou navegadores.
- A senha protege apenas a interface local; NÃO oferece segurança de servidor. Não armazene dados pessoais ou sigilosos nessa versão.
- Limpar os dados do site pode apagar os cadastros e anexos.
- Anexos antigos armazenados somente em serviços remotos não foram migrados.

A antiga API de checagem de banco e suas dependências foram removidas. Nenhuma operação foi feita em bancos externos.
