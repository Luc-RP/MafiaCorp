# MafiaCorp | Central da Família (FiveM / GTA RP)

## Painel ADM (contas locais)

A aba **Painel ADM**, dentro do grupo **GESTÃO**, é visível somente a contas com papel `admin` no navegador atual. Ela organiza a administração das contas de acesso locais, sem misturá-las aos **Membros da Máfia**, que são fichas de personagens RP.

- Lista de contas com login, nome, codinome, função, especialidade, estado habilitado/bloqueado e último acesso local.
- Pesquisa e filtro por estado.
- Criação de uma nova conta local com papel, perfil e senha inicial.
- Ficha de usuário em modo leitura.
- Redefinição manual da senha para uma nova senha de pelo menos 10 caracteres; senhas anteriores não podem ser visualizadas. A troca incrementa a revisão da senha, invalidando sessões locais antigas no próximo carregamento (ou imediatamente nas outras abas sincronizadas).
- Bloqueio, reativação ou exclusão local, com confirmações. Os dossiês, relatórios e registros de RP permanecem.
- Conta principal `u_admin` e a conta administrativa em uso protegidas contra bloqueio ou exclusão acidental.
- A antiga página **Usuários do painel** virou uma lista de consulta com atalho administrativo, evitando dois editores divergentes.
- Login e recuperação de sessão recusam usuários com `accessDisabled=true`. Mudanças na mesma base local detectadas por outras abas encerram as sessões correspondentes.

**Limite essencial:** as contas estão no `localStorage` de **cada navegador**, não há conta central compartilhada. Um visitante novo pode criar seu próprio administrador local em seu navegador; essa conta não é controlada pelo administrador de outro dispositivo. Portanto, o Painel ADM **não consegue ver, bloquear, apagar nem redefinir remotamente** as contas das outras pessoas. Esse controle exige uma camada autenticada de servidor (não precisa ser Supabase), com armazenamento central e verificação de papéis no backend. Os controles implementados aqui são apenas gerenciamento local de perfis, **não segurança efetiva multiusuário**.

### Arquivos novos
- `mafia-admin.js`: ações e formulários administrativos locais.
- `mafia-admin.css`: identidade Obsidian/Silver do painel.

## Infográficos: grafo de conhecimento de roleplay

A nova seção **Infográficos** é uma visualização interativa estilo Graph View do Obsidian, integrada aos cadastros do MafiaCorp.

- **Visão global**: rede de personagens, contatos, associados, facções, veículos, endereços, investigações, operações, evidências, missões, locais e notas.
- **Visão focada**: duplo clique em um nó ou botão **Focar** no painel lateral. Profundidade configurável de 1 a 3 níveis.
- **Navegação**: pan, zoom por roda do mouse ou botões, arraste de nós, enquadramento automático, pesquisa e filtros por categoria.
- **Painel lateral**: mostra informações selecionadas, vínculos e atalhos para cadastros; conexões manuais podem ser editadas ou excluídas.
- **Conexões automáticas**: são derivadas dos campos já cadastrados, por exemplo investigado → facção, veículo → proprietário, caso → evidência e missão → responsável.
- **Conexões manuais**: utilizam a coleção existente `DB.rp.links`, sem duplicar armazenamento.
- **Notas de investigação RP**: nós personalizados com título e texto, armazenados em `DB.rp.graphNotes`.
- **Posições salvas**: nós arrastados guardam a posição em `DB.rp.graphPositions`.
- **Atalhos**: desde o dashboard ou o dossiê de um investigado/investigação, com foco direto no registro.
- **Backup JSON**: já inclui notas e posições da seção, além das conexões e cadastros RP; a importação mantém compatibilidade com backups antigos que não incluem esses campos.

O grafo é desenhado em **Canvas 2D sem bibliotecas externas**, com layout baseado em forças e limite de **250 nós simultaneamente visíveis** para evitar congelamentos em navegadores. Os demais registros não são apagados: use filtros ou pesquisa para visualizá-los. As relações geradas automaticamente são reconstruídas a cada visualização e não alteram suas fichas.

**Atenção:** toda a base continua exclusiva do navegador local, sem sincronização nem autenticação protegida por servidor. A seção é destinada a personagens e eventos fictícios de RP, não a dossiês de pessoas reais.

### Arquivos Infográficos
- `mafia-infographics.js`: geração de nós, vínculos, layout, zoom, foco e editor de notas/conexões.
- `mafia-infographics.css`: interface responsiva preto/grafite/prata.

## Atualização de 09/11/2026: sessão e tema Obsidian / Silver

- O login local agora persiste após **F5, fechamento da aba e reabertura do navegador**, enquanto o armazenamento do site continuar disponível.
- A sessão é registrada em `localStorage` como `mafiacorp_active_user_v1` contendo o ID da conta local, sem salvar a senha em texto simples nessa chave.
- A aba atual também é restaurada a partir de `mafiacorp_last_view_v1`. A sessão e a aba são apagadas ao clicar em **Encerrar sessão**.
- O encerramento em uma aba comunica o logout às demais abas abertas no mesmo navegador.
- A autenticação continua **exclusivamente local**: isso não equivale a segurança de servidor, não implementa sincronização nem controla acesso real aos registros de outros usuários.
- Identidade visual convertida para **Obsidian / Brushed Silver**: preto, grafite, aço escovado, tipografia editorial noir, monograma em brasão e contraste claro nos elementos.
- Biblioteca de ícones SVG locais em `mafia-icons.js`; navegação com pictogramas consistentes e sem dependências externas.
- Marcadores Leaflet com símbolos por categoria: sede da família, QG rival, garagem, galpão, casa, território e ponto de encontro.
- `favicon.svg` contém o brasão MC em prata.
- Testes automatizados locais por simulação: login → recarregar mantendo sessão e aba → logout → recarregar pedindo login; geração de quatro pinos de mapa e círculo de território.

**Limitações:** Uma atualização com formulário ainda não salvo pode perder apenas os campos não gravados, mas não a conta autenticada. O armazenamento em modo anônimo/privado pode ser temporário. Para navegação entre diferentes usuários ou computadores e autenticação segura é necessário um backend, que não faz parte desta versão.


Central de informações de uma organização **fictícia de roleplay**, construída sobre o Black Investigation original e publicada no [Vercel](https://mafiacorp.vercel.app).

## Central operacional

A atualização acrescentou um dashboard em identidade visual **dark crimson**, com indicadores e atalhos para os módulos abaixo:

| Aba | Funcionalidade |
| --- | --- |
| Central operacional | Resumo de membros, missões, metas, alertas de prioridade e facções |
| Membros da máfia | Cadastro de personagem, nome, codinome, patente, função, telefone RP, contato, residência, veículos, parentes e observações |
| Missões e contratos | Cadastro e edição com responsável, prioridade, status, progresso, prazo, recompensa no jogo, participação da equipe, investigado, facção e local relacionados |
| Metas | Metas individuais ou gerais, por período, com unidade, valor-alvo, realização e evolução percentual |
| QGs e locais | Cadastro de locais, regiões, facções, responsáveis e coordenadas X/Y do jogo |
| Mapa de Los Santos | Mapa GTA V interativo via Leaflet, pinos por categoria e marcadores de território; clique no mapa para cadastrar um local |
| Mapa de conexões | Rede de relações cadastradas entre membros, investigados, facções, contatos, veículos e locais |
| Backup RP | Exportação/importação JSON apenas dos novos módulos da Central RP, sem credenciais |

Continuam acessíveis **os módulos legados** de investigação, suspeitos, veículos, contatos, associados, facções, evidências, operações, relatórios, auditoria, contas de acesso e conexões por investigado.

## Persistência e privacidade

**Sem Supabase e sem backend externo.** Os dados permanecem somente no navegador:

- `localStorage`: perfis de usuários locais, cadastros antigos e novos dados `DB.rp`.
- `IndexedDB`: anexos do sistema legado.
- Uma conta administrativa local é criada no primeiro acesso e não há senha padrão no código.
- Pessoas em navegadores ou dispositivos diferentes **não compartilham nem sincronizam cadastros**.
- O login é controlado no cliente, não oferece controle de acesso adequado para informações sensíveis. Registre apenas informações dos **personagens fictícios** do jogo, sem dados reais de terceiros.
- Limpar o armazenamento do site pode eliminar cadastros e anexos.
- O backup RP exporta somente os novos módulos, não os registros legados, os anexos nem as credenciais de login.

As atualizações **não sobrescrevem o armazenamento local de visitantes existentes** e preservam os recursos anteriores.

## Mapa GTA V

O mapa usa o **Leaflet 1.9.4** e tiles do FiveDock referenciados em:

- https://fivedock.dev/pt-BR/blog/gta-v-map-leaflet-fivem-nui
- `https://cdn.fivedock.dev/o/fivedock/maps/styleatlas/{z}/{x}/{y}.jpg`

A calibração de coordenadas GTA/FiveM é baseada na transformação do guia citado; `X` é leste/oeste e `Y` é norte/sul. O mapa exige conectividade à CDN. Referência visual do mapa pertence à Rockstar Games; implementação não é oficial e não é afiliada à Rockstar.

O painel usa coordenadas inseridas pelo usuário; não tem comunicação com o servidor FiveM nem acesso automático a coordenadas do personagem.

## Arquivos de produção

- `index.html`: sistema legado e ligação com a Central
- `mafia-center.js`: cadastros, metas, missões, grafo de relações, mapa, formulários e backups da Central RP
- `mafia-icons.js`: ícones SVG locais para navegação e marcações
- `favicon.svg`: brasão da identidade MafiaCorp
- `mafia-center.css`: identidade visual Obsidian / Silver e adaptação responsiva
- `vercel.json`: cabeçalhos de segurança, CSP para fontes e tiles do mapa

## Validação

- Sintaxe do JavaScript testada;
- Renderização dos módulos testada em ambiente de simulação, com base vazia e registros de exemplo;
- Após a publicação, validar em navegador real, incluindo imagens de tiles, zoom/pinos do mapa, persistência após atualização e fluxos de anexos.

Projeto de roleplay / ficção. Não utilizar como central de coleta ou investigação de pessoas reais.
