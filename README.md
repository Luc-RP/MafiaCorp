# MafiaCorp | Central da Família (FiveM / GTA RP)

## Gate 006: Aprovação de metas, desempenho até 2030 e fila Discord (10/11/2026)

**Cargos autorizados a aprovar contribuições RP:** Liderança 01, 02, 03, Gerente Geral e Gerente de Farm. O Administrador do Sistema também conserva aprovação. Outros cargos, inclusive Gerente de Ação, Elite, Membros e cargos personalizados, não aprovam. O backend impede aprovação da própria contribuição.

**Calendário e métricas:** a rota autenticada `GET /api/performance?accountId=<uuid>&year=2026` retorna histórico diário entre `2026-11-01` e `2030-12-31`, somente do integrante ou de integrantes visíveis a cargos autorizados. A tela `Desempenho` é acessível ao clicar no codinome no cadastro de integrantes e nas entregas. Exibe calendário mensal (até dezembro de 2030), barras diárias, semanais e mensais, dias ativos, metas de 20% atingidas e média diária. Dias sem atividade registrada não são contados como falha ou queda. Datas futuras não recebem dados fictícios.

**Validação existente:** consulta SQL de histórico real confirmou Coringa (Liderança 01) com uma entrega de Aeronave de 10% pendente em 10/11/2026, sem modificar o registro. Testes simulados de permissões cobriram os cinco cargos, cargos não autorizados e proibição de autoaprovação. Testes de renderização confirmaram calendário, anos até 2030 e gráficos. Testes reais de aprovação entre sessões distintas ainda são necessários.

**Preparação Discord, não integração ativa:** `database/006_discord_outbox.sql` adiciona `mc_event_outbox`; `server/event-outbox.js` grava eventos dentro da transação de entrega/aprovação/atividade/fechamento do painel. O evento contém só identificadores de contas, tipo de missão, data, pontuação e situação, nunca o print, senha ou token. Não há webhook, bot, cron ou notificação para Discord neste gate. Um futuro emissor precisará autenticação de servidor, idempotência, tentativas/reentrega e controles de privacidade, após autorização dos canais.

**Arquivos:** `api/performance.js`, `mafia-performance.js`, `mafia-performance.css`, `server/org-roles.js`, `api/organization.js`, `server/event-outbox.js`, `database/006_discord_outbox.sql`, atualizações em `index.html`, `mafia-org.js`, `mafia-cloud-ui.js` e estilos.

## Gate 005: administracao, cargos dinamicos e perfil (10/11/2026)

- Conta Luc marcada como administradora permanente pelo campo is_system_admin; pode escolher um cargo RP ou retornar a admin_sistema sem perder privilegios.
- Liderancas 01, 02 e 03 podem atribuir cargos, gerenciar contas e criar cargos personalizados; outros cargos nao recebem permissoes administrativas.
- PostgreSQL: tabela mc_org_roles criada e populada com onze cargos originais. Avatar pequeno em mc_accounts.avatar_data e vinculo de org_role por chave estrangeira.
- APIs novas: /api/roles (CRUD protegido) e /api/profile (perfil do proprio usuario e JPEG compacto).
- Painel ADM: Cargo liberado no proprio administrador permanente e catalogo para criar, editar e excluir cargos nao originais.
- Menu Meu Perfil para editar nome, codinome e foto; hierarquia exibe infografico SVG navegavel abaixo do organograma.
- Plano Aiven Free atingiu temporariamente limite de conexoes durante testes paralelos. Pool Node ajustado para conexoes ociosas de 1 segundo; leitura posterior confirmou 11 cargos e um administrador permanente.
- Sem limpeza de contas, senhas ou historico. Homologacao com sessoes reais e segundo integrante ainda pendente.

## Administrador independente da hierarquia

Em 10/11/2026, por decisão expressa do responsável, a conta central `Luc` foi alterada de `lider_01` para `admin_sistema`, preservando o papel técnico `admin`, a senha e a sessão.

- **Administrador do Sistema:** 100% de acesso à administração e às seções, mas **sem posto na hierarquia RP**.
- **Liderança 01:** está disponível para atribuição a outro integrante.
- **Meta e atividade diária:** a conta administrativa fica isenta; o backend não aceita submissão de missões RP pela conta `admin_sistema`.
- **Organograma e lista de integrantes:** contas com cargo `admin_sistema` ficam excluídas do resultado de integrantes RP, mas continuam aparecendo no Painel ADM.
- **Segurança:** a conta administrativa do sistema não pode ser bloqueada, excluída nem receber outro cargo pela API administrativa comum. Novos cadastros não podem obter `admin_sistema`.
- **Migração aplicada:** `database/004_system_admin.sql` ajustou a constraint de cargos, e o `UPDATE` específico da conta Luc foi aplicado separadamente e confirmado via consulta SQL.
- **Homologação:** banco confirmou uma conta `Luc` com `role=admin` e `org_role=admin_sistema`, e zero contas no cargo `lider_01`. Verificação de permissões do backend e sintaxe do frontend passou. A aparência final deve ser validada no navegador após atualização.

## Cargos e metas do QG (gate de 10/11/2026)

**Fonte:** estrutura organizacional e regras fornecidas diretamente pelo responsável pelo MafiaCorp. A aplicação é um recurso de gerenciamento de personagens de FiveM RP.

### Hierarquia central do PostgreSQL
- **Liderança 01, 02 e 03 (100%)**: definem objetivos e diretrizes, tomam decisões importantes, acompanham Gerente Geral, aprovam promoções e resolvem questões internas.
- **Gerente Geral (90%)**: supervisiona setores, acompanha metas, cobra resultados dos gerentes, organiza reuniões/avaliações semanais e mantém a comunicação.
- **Gerente de Farm (65%)**: acompanha a meta diária de 20%, organiza painel QG, incentiva missões do Noia, acompanha a evolução, produção e estoque.
- **Gerente de Ação (65%)**: lidera a Elite, organiza ações/dominações RP, treina, avalia e identifica potenciais integrantes.
- **Estrategista / Inteligência (60%)**: planejamento de operações RP, informações relevantes, oportunidades e apoio ao Gerente de Ação.
- **Logística (55%)**: recursos, preparação, apoio aos setores e disponibilidade de materiais e equipamentos RP.
- **Elite / Operadores (40%)**: integrantes especializados aprovados, treinamentos, atividades programadas, apoio e referência técnica.
- **Membro / Integrante (25%)**: cumpre metas nos dias ativos, participa das ações, respeita a hierarquia e evolui no RP.

Os percentuais são **níveis iniciais de acesso**, não uma autorização genérica para obter todos os dados do banco. A matriz efetiva de telas e ações fica em `server/org-roles.js`. O servidor valida as operações das novas APIs e o painel esconde seções não autorizadas. **Módulos antigos com conteúdo em localStorage ainda não possuem proteção de dados por backend**, e deverão ser migrados em gate separado antes de armazenar informações sensíveis ou compartilhadas.

**Conta principal:** a única conta que existia na Aiven, codinome `Luc`, passou de `observador` para papel técnico `admin` e cargo `lider_01`, sem alterar sua senha. Novos cadastros recebem `membro`/`observador` por padrão, sem escalada automática. Somente Liderança pode atribuir cargos via Painel ADM. Os postos de Liderança e gerência principal são exclusivos por cargo; alterações de cargo revogam as sessões anteriores da pessoa.

### Metas e comprovantes
- **Meta por integrante:** 20% por dia em que marcar atividade; não se presume presença automática pela abertura do site.
- **Missões:** Aeronave 10%, Caminhão 5%, Submarino 5% e Cargueiro 5%. Pontuação fixa validada no PostgreSQL.
- **Painel coletivo:** meta de 100% de contribuições aprovadas. Cinco contribuições individuais de 20% completam 100%.
- **Entrega:** integrante cadastra missão, log escrito e/ou print. Imagens são convertidas para JPEG compacto no navegador, máximo aproximado de 100 KB por comprovante.
- **Validação:** contribuição entra como `pendente`. Liderança, Gerente Geral e Gerente de Farm podem aprovar/rejeitar contribuições de **outros** integrantes. O sistema não permite aprovar a própria entrega.
- **Produção:** quando 100% for atingido, Liderança ou Gerente Geral registra a escolha de produção do painel.
- **Perfis:** botão `Ver log / prints` lista as contribuições de cada integrante; visualização e aprovação seguem permissões do servidor.
- **Guarda:** registro de atividade, missão, log, pontuação e print em `mc_daily_activity`, `mc_contributions` e `mc_qg_panels`.
- **Limpeza mensal:** pedido para etapa futura. Não há limpeza automática ativada nem cron de exclusão; definir política de retenção, backup e homologação antes de implementar.

### Implementação
- `database/003_hierarchy_contributions.sql`: nova migração **aplicada** na Aiven PostgreSQL.
- `server/org-roles.js`: cargos, responsabilidades, percentuais de acesso e autorização.
- `api/organization.js`: endpoints autenticados de visão diária, atividade, submissão e conferência de provas RP.
- `api/admin.js`: atribuição central de cargo (`PATCH action=orgRole`).
- `mafia-org.js`, `mafia-org.css`: organograma, lista de integrantes, metas QG, prints, histórico e aprovação.
- `mafia-cloud-ui.js`: seletor de cargo e metas dentro do Painel ADM.
- `index.html`: roteador e menu autorizados por perfil.

**Verificação:** migração sem exclusões e conta Luc preservada; sintaxe JS validada, testes simulados de todas as categorias de cargo, quatro pontuações, organograma, lista de perfis, missão com print e botões de aprovação. Teste real de envio de comprovante e aprovação entre duas contas ainda deve ser feito pelos usuários do RP.

## Limpeza de registros antigos (novo gate)

- O PostgreSQL da Aiven foi inspecionado em 10/11/2026: há uma única conta central (`Luc`, papel `observador`), uma sessão, um evento de autenticação e um registro de limite de requisições. **Não havia dossiês ou registros de RP antigos no PostgreSQL**. Nenhuma linha do PostgreSQL foi excluída.
- A função obsoleta `seedDemoData()`, com investigação, suspeitos e registros fictícios antigos, foi retirada do `index.html`; `seedDB()` continua criando somente uma estrutura vazia de contingência para o armazenamento local.
- A opção **GESTÃO → Limpar dados antigos** permite limpar, após confirmação explícita, a base operacional deste **navegador**. Remove cadastros de investigação, RP, conexões, relatórios, atividade, auditoria local, metadados de anexos e o IndexedDB `bi_local_attachments_v1`.
- A rotina preserva o cookie HttpOnly e a conta PostgreSQL; após a limpeza, recria apenas a referência ao perfil remoto atual para a interface continuar funcionando.
- Também elimina as chaves locais antigas `bi_local_cache_v1` e `bi_core_db_v1`; a base atual `bi_offline_db_v2` é substituída por uma estrutura vazia.
- **A remoção não é automática e não alcança outros navegadores.** Isso evita destruir sem confirmação os registros que outras pessoas possam estar usando. O usuário precisa acionar a ferramenta no próprio navegador.
- Teste simulado: base com investigações, evidência, anexo, RP e usuário local foi zerada; perfil remoto continuou disponível e chaves legadas foram removidas.

## Autenticação central Aiven PostgreSQL (ATIVA)

**Em 10/11/2026**, o serviço PostgreSQL 18.6 `mafiacorp` (Aiven Free) está `RUNNING`; o Vercel recebeu as variáveis privadas `DATABASE_URL` e `AIVEN_CA_CERT` como segredos de produção. Um deploy de produção retornou `READY` e o endpoint `/api/auth?action=status` respondeu `{"mode":"remote","configured":true,"online":true,"registrationOpen":true}`.

O login e o cadastro são agora **validados pelo servidor**. O navegador não usa o antigo login local como alternativa: se a API estiver indisponível, o acesso fica bloqueado temporariamente. Usuários novos informam **nome, codinome único e senha forte com mínimo de 8 caracteres**. As sessões utilizam cookies HttpOnly e podem ser revogadas pelo backend.

**Próximo gate ainda pendente:** o proprietário deve criar sua primeira conta no formulário público; esta recebe papel `observador` por segurança. Após identificar e confirmar essa conta no PostgreSQL, a administração principal será atribuída de modo controlado. Ainda não existe administrador remoto criado.

**Escopo:** somente contas, sessões e funções administrativas estão centralizadas. Investigações, dossiês, personagens, arquivos anexados e demais registros continuam locais em cada navegador; não são sincronizados por este gate.

Detalhes técnicos e próximos testes: [database/README.md](database/README.md).

## Painel ADM legado (somente dados locais, substituído no modo remoto)

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

## Correção do mapa em Locais (11/11/2026)

O formulário legado **Locais → Novo/Editar Local** foi corrigido para exibir o mapa de **Los Santos (GTA V/FiveM)**, e não o OpenStreetMap do planeta Terra.

- Reutiliza a transformação GTA/FiveDock `L.Transformation(.02072,117.3,-.0205,172.8)` e os tiles públicos de GTA V (`assets.fivedock.dev`, fallback `cdn.fivedock.dev`).
- Clique no mapa cria o marcador; arrastar atualiza as coordenadas X/Y do GTA V. Os campos internos `longitude` e `latitude` são preservados por compatibilidade, mas aparecem como **Coordenada X (GTA V)** e **Coordenada Y (GTA V)**.
- Removeu-se o botão **Usar minha localização atual**, que consultava GPS real do navegador e não tem aplicação em GTA RP.
- Registros novos salvam `coordinateSystem:'gta-v'`. Registros antigos sem esse indicador preservam seus valores reais e não exibem marcador GTA automaticamente; ao clicar no novo mapa ou editar X/Y, são convertidos explicitamente.
- O mapa respeita permissões de somente leitura, limita a navegação ao território da ilha, e sua instância é destruída ao fechar o modal.
- Sem migração destrutiva, exclusão ou mudança nos outros módulos. Teste simulado de click, drag, recarga, legado e somente leitura passou.
- Mudança apenas no `index.html`. O mapa GTA principal (`mafia-center.js`) foi preservado.

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
