# MafiaCorp | Central da Família (FiveM / GTA RP)

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
- `mafia-center.css`: identidade visual dark crimson e adaptação responsiva
- `vercel.json`: cabeçalhos de segurança, CSP para fontes e tiles do mapa

## Validação

- Sintaxe do JavaScript testada;
- Renderização dos módulos testada em ambiente de simulação, com base vazia e registros de exemplo;
- Após a publicação, validar em navegador real, incluindo imagens de tiles, zoom/pinos do mapa, persistência após atualização e fluxos de anexos.

Projeto de roleplay / ficção. Não utilizar como central de coleta ou investigação de pessoas reais.
