/* MafiaCorp RP Center - client-side FiveM roleplay records only. */
(function () {
  'use strict';
  var app = null;
  var context = null;
  var map = null;
  var revision = '2026-11-09-rp1';
  var modules = {
    'rp-members':'members',
    'rp-missions':'missions',
    'rp-goals':'goals',
    'rp-locations':'locations',
    'rp-network':'links'
  };
  var types = {
    members:'Membros',missions:'Missões',goals:'Metas',locations:'Locais',links:'Conexões'
  };
  var schemas = {
    members:[
      ['name','Nome do personagem','text',true],
      ['codename','Codinome','text',true],
      ['rank','Hierarquia','select','', ['Chefe','Subchefe','Conselheiro','Caporegime','Soldado','Associado','Recruta']],
      ['role','Função na organização','text'],
      ['status','Situação','select','',['ATIVO','EM MISSÃO','AUSENTE','AFASTADO']],
      ['phone','Telefone no RP','text'],
      ['discord','Contato externo (opcional)','text'],
      ['home','Residência no jogo','text'],
      ['vehicle','Veículo no jogo','text'],
      ['relatives','Parentes / vínculos no RP','textarea'],
      ['joinedAt','Entrada na organização','date'],
      ['notes','Observações de RP','textarea']
    ],
    missions:[
      ['title','Título da missão','text',true],
      ['kind','Categoria','select','',['COBRANÇA RP','INVESTIGAÇÃO','VIGILÂNCIA RP','NEGOCIAÇÃO','LOGÍSTICA','OPERAÇÃO RP','OUTRA']],
      ['status','Situação','select','',['PLANEJAMENTO','EM ANDAMENTO','EM PAUSA','CONCLUÍDA','CANCELADA']],
      ['priority','Prioridade','select','',['BAIXA','MÉDIA','ALTA','CRÍTICA']],
      ['memberId','Responsável','members'],
      ['suspectId','Investigado associado','suspects'],
      ['factionId','Facção relacionada','factions'],
      ['locationId','Local relacionado','locations'],
      ['progress','Progresso (%)','number'],
      ['reward','Recompensa no jogo','text'],
      ['cutPercent','Participação da equipe (%)','number'],
      ['dueAt','Prazo RP','date'],
      ['description','Resumo da missão','textarea'],
      ['notes','Anotações','textarea']
    ],
    goals:[
      ['title','Descrição da meta','text',true],
      ['memberId','Meta atribuída a','members'],
      ['period','Período','select','',['SEMANAL','MENSAL','EVENTO','LIVRE']],
      ['unit','Unidade','select','',['MISSÕES','AÇÕES','R$ RP','MEMBROS','PONTOS','OUTROS']],
      ['target','Quantidade da meta','number',true],
      ['current','Quantidade realizada','number'],
      ['dueAt','Prazo','date'],
      ['notes','Orientações de RP','textarea']
    ],
    locations:[
      ['name','Nome do local','text',true],
      ['kind','Tipo de local','select','',['QG DA FAMÍLIA','QG DE FACÇÃO','GALPÃO','RESIDÊNCIA','GARAGEM','PONTO DE ENCONTRO','TERRITÓRIO','OUTRO']],
      ['district','Bairro / região','text'],
      ['factionId','Facção vinculada','factions'],
      ['memberId','Membro responsável','members'],
      ['x','Coordenada X do GTA V','number'],
      ['y','Coordenada Y do GTA V','number'],
      ['radius','Raio territorial em metros (opcional)','number'],
      ['notes','Descrição no RP','textarea']
    ],
    links:[
      ['from','Origem','node',true],
      ['to','Destino','node',true],
      ['kind','Relação','select','',['ALIADO','FAMILIAR','MEMBRO','CONTATO','RESPONSÁVEL','VÍNCULO','RIVALIDADE','LOCALIZAÇÃO']],
      ['notes','Descrição da ligação','textarea']
    ]
  };
  function e(value) {
    return String(value==null?'':value).replace(/[&<>"']/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c];
    });
  }
  function uid(){return 'rp_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,9);}
  function safeNumber(v){var n=Number(v);return Number.isFinite(n)?n:0;}
  function percent(a,b){return b>0?Math.max(0,Math.min(100,Math.round(safeNumber(a)/safeNumber(b)*100))):0;}
  function active(list){return (list||[]).filter(function(x){return x&&!x.archived;});}
  function shorten(s,len){s=String(s||'');return s.length>len?s.slice(0,len-1)+'…':s;}
  function friendly(v){return String(v||'—').replace(/_/g,' ');}
  function prepare(db) {
    if(!db.rp || typeof db.rp!=='object')db.rp={};
    if(db.rp.version!==1) db.rp.version=1;
    ['members','missions','goals','locations','links'].forEach(function(k){
      if(!Array.isArray(db.rp[k]))db.rp[k]=[];
    });
    return db.rp;
  }
  function list(type){return active(app[type]);}
  function nameOf(kind,id){
    if(!id)return 'Não definido';
    var rows=kind==='suspects'?context.db.suspects:kind==='factions'?context.db.factions:kind==='contacts'?context.db.contacts:kind==='vehicles'?context.db.vehicles:app[kind];
    var found=(rows||[]).find(function(x){return x.id===id;});
    return found?(found.codename||found.name||found.title||found.plate||id):'Registro indisponível';
  }
  function nodes(){
    var out=[];
    [['members',list('members')],['suspects',active(context.db.suspects)],['factions',active(context.db.factions)],['contacts',active(context.db.contacts)],['vehicles',active(context.db.vehicles)],['locations',list('locations')]].forEach(function(group){
      group[1].forEach(function(rec){
        out.push({key:group[0]+':'+rec.id,name:rec.codename||rec.name||rec.plate||rec.title||'Registro',kind:group[0]});
      });
    });
    return out;
  }
  function typeColor(kind){
    return {members:'#e5e8ed',suspects:'#b8bec7',factions:'#9096a1',contacts:'#b8b0a6',vehicles:'#91a0ac',locations:'#aeb7b1'}[kind]||'#ddd';
  }
  function badge(text,color){
    return '<span class="rp-tag '+(color||'')+'">'+e(friendly(text))+'</span>';
  }
  function btn(label,act,kind,id,extra){
    return '<button type="button" class="rp-btn '+(extra||'')+'" data-rp="'+e(act)+'" data-kind="'+e(kind||'')+'" data-id="'+e(id||'')+'">'+label+'</button>';
  }
  function progressBar(p){
    return '<div class="rp-progress"><span style="width:'+Math.min(100,Math.max(0,p))+'%"></span></div>';
  }
  function empty(text,kind){
    return '<div class="rp-empty"><div class="rp-empty-icon">◎</div><p>'+e(text)+'</p>'+(context.canEdit?btn('+ Novo cadastro','add',kind):'')+'</div>';
  }
  function header(title,subtitle,kind){
    return '<div class="rp-pagehead"><div><div class="rp-eyebrow">MAFIACORP / ROLEPLAY • FIVEM</div><h1>'+e(title)+'</h1><p>'+e(subtitle)+'</p></div><div class="rp-actions">'+(context.canEdit?btn('+ Novo registro','add',kind,'','rp-primary'):'')+'</div></div>';
  }
  function memberRow(x){
    var sub=[x.rank||'SEM PATENTE',x.role||'Função não definida'].join(' • ');
    return '<article class="rp-member-row"><div class="rp-avatar">'+e((x.codename||x.name||'?').slice(0,2).toUpperCase())+'</div><div class="rp-grow"><strong>'+e(x.codename||x.name)+'</strong><small>'+e(sub)+'</small><small>'+e(x.phone||'Contato não cadastrado')+' · '+e(x.vehicle||'Veículo não cadastrado')+'</small></div>'+badge(x.status||'ATIVO')+(context.canEdit?btn('Editar','edit','members',x.id):'')+'</article>';
  }
  function missionRow(x){
    var p=percent(x.progress||0,100);
    return '<article class="rp-mission-row"><div class="rp-mission-header"><div><strong>'+e(x.title)+'</strong><small>'+e(x.kind||'OPERAÇÃO RP')+' · '+e(nameOf('members',x.memberId))+'</small></div>'+badge(x.status||'PLANEJAMENTO')+'</div><div class="rp-mission-meter">'+progressBar(p)+'<b>'+p+'%</b></div>'+(context.canEdit?'<div class="rp-mini-actions">'+btn('Editar','edit','missions',x.id)+btn('Concluir','finish','missions',x.id)+'</div>':'')+'</article>';
  }
  function goalRow(x){
    var p=percent(x.current,x.target);
    return '<article class="rp-goal-row"><div class="rp-split"><strong>'+e(x.title)+'</strong><b>'+p+'%</b></div><small>'+e(String(safeNumber(x.current)))+' / '+e(String(safeNumber(x.target)))+' '+e(x.unit||'AÇÕES')+' · '+e(nameOf('members',x.memberId))+'</small>'+progressBar(p)+(context.canEdit?'<div class="rp-mini-actions">'+btn('+1','increment','goals',x.id)+btn('Editar','edit','goals',x.id)+'</div>':'')+'</article>';
  }
  function dashboard(){
    var ms=list('members'),mi=list('missions'),go=list('goals'),loc=list('locations');
    var going=mi.filter(function(m){return m.status==='EM ANDAMENTO';});
    var goalScore=go.length?Math.round(go.reduce(function(t,g){return t+percent(g.current,g.target)},0)/go.length):0;
    var critical=mi.filter(function(m){return m.priority==='CRÍTICA'&&m.status!=='CONCLUÍDA'&&m.status!=='CANCELADA';}).length;
    var members=ms.slice(0,4).map(memberRow).join('')||empty('Nenhum membro de RP cadastrado.','members');
    var missions=mi.slice(0,3).map(missionRow).join('')||empty('Cadastre a primeira missão da organização.','missions');
    var goals=go.slice(0,3).map(goalRow).join('')||empty('Defina metas para acompanhar a equipe.','goals');
    var factions=active(context.db.factions).slice(0,3).map(function(f){
      return '<div class="rp-faction-row"><span class="rp-skull">♜</span><div><b>'+e(f.name)+'</b><small>'+e(f.status||f.riskLevel||'Facção de RP')+'</small></div></div>';
    }).join('')||'<div class="rp-muted" style="padding:12px">As facções cadastradas no módulo de Inteligência aparecerão aqui.</div>';
    return '<section class="rp-dashboard">'+
      '<div class="rp-hero"><div><span class="rp-eyebrow">CENTRAL DA FAMÍLIA · LOS SANTOS RP</span><h1>'+ (new Date().getHours()<12?'Bom dia':new Date().getHours()<18?'Boa tarde':'Boa noite') +', Chefe.</h1><p>Painel de informações, equipe e operações da organização.</p></div><div class="rp-hero-stamp">M / C<br><small>ROLEPLAY</small></div></div>'+
      '<div class="rp-kpis">'+
        '<div class="rp-kpi"><span>♟ MEMBROS</span><strong>'+ms.length+'</strong><small>Personagens cadastrados</small></div>'+
        '<div class="rp-kpi"><span>◎ MISSÕES ATIVAS</span><strong>'+going.length+'</strong><small>'+mi.length+' missões no painel</small></div>'+
        '<div class="rp-kpi"><span>▥ METAS</span><strong>'+goalScore+'%</strong>'+progressBar(goalScore)+'</div>'+
        '<div class="rp-kpi"><span>⚠ ALERTAS RP</span><strong>'+critical+'</strong><small>Missões críticas pendentes</small></div>'+
      '</div>'+
      '<div class="rp-dash-columns">'+
        '<section class="rp-panel"><div class="rp-panel-head"><h3>♟ Equipe da família</h3>'+btn('Ver todos','go','rp-members')+'</div><div class="rp-panel-inner">'+members+'</div></section>'+
        '<section class="rp-panel"><div class="rp-panel-head"><h3>◎ Missões</h3>'+btn('Ver todas','go','rp-missions')+'</div><div class="rp-panel-inner">'+missions+'</div></section>'+
        '<section class="rp-panel"><div class="rp-panel-head"><h3>▥ Metas</h3>'+btn('Gerenciar','go','rp-goals')+'</div><div class="rp-panel-inner">'+goals+'</div></section>'+
        '<section class="rp-panel rp-map-teaser"><div class="rp-panel-head"><h3>⌖ Território / GTA V</h3>'+btn('Abrir mapa','go','rp-map')+'</div><div class="rp-teaser-art"><div class="rp-map-rings"></div><strong>LOS SANTOS</strong><small>'+loc.length+' local(is) mapeado(s)</small></div><div class="rp-teaser-action">'+btn('⌖ Explorar mapa interativo','go','rp-map','','rp-primary')+'</div></section>'+
      '</div>'+
      '<div class="rp-dash-bottom">'+
        '<section class="rp-panel"><div class="rp-panel-head"><h3>⚔ Inteligência / facções</h3>'+btn('Ver facções','go','factions')+'</div><div class="rp-panel-inner rp-faction-list">'+factions+'</div></section>'+
        '<section class="rp-panel"><div class="rp-panel-head"><h3>◇ Mapa de conexões</h3>'+btn('Abrir relações','go','rp-network')+'</div><div class="rp-connect-preview"><div class="rp-node central">FAMÍLIA</div><span></span><div class="rp-node">MEMBROS</div><span></span><div class="rp-node">FACÇÕES</div><p>'+list('links').length+' vínculo(s) registrados</p></div></section>'+
      '</div>'+
      '<div class="rp-dashboard-foot">INTERFACE DE ROLEPLAY · DADOS LOCAIS DO NAVEGADOR · NÃO SINCRONIZADO</div></section>';
  }
  function memberView(){
    var rows=list('members');
    return header('Equipe da família','Personagens, hierarquia, contatos, residência, veículos e vínculos pessoais no RP.','members')+
      '<div class="rp-card-grid">'+(rows.length?rows.map(function(x){
      return '<section class="rp-profile"><div class="rp-profile-top"><div class="rp-avatar">'+e((x.codename||x.name).slice(0,2).toUpperCase())+'</div><div><h3>'+e(x.codename||x.name)+'</h3><small>'+e(x.name)+'</small></div>'+badge(x.status||'ATIVO')+'</div><div class="rp-profile-grid">'+
        '<div><span>Patente</span><b>'+e(x.rank||'—')+'</b></div><div><span>Função</span><b>'+e(x.role||'—')+'</b></div>'+
        '<div><span>Contato RP</span><b>'+e(x.phone||'—')+'</b></div><div><span>Veículo</span><b>'+e(x.vehicle||'—')+'</b></div>'+
        '<div><span>Casa</span><b>'+e(x.home||'—')+'</b></div><div><span>Parentes (RP)</span><b>'+e(x.relatives||'—')+'</b></div>'+
        '</div>'+(x.notes?'<p class="rp-profile-notes">'+e(x.notes)+'</p>':'')+
        (context.canEdit?'<div class="rp-card-actions">'+btn('Editar ficha','edit','members',x.id)+btn('Arquivar','archive','members',x.id)+'</div>':'')+'</section>';
    }).join(''):empty('Cadastre os personagens da sua organização.','members'))+'</div>';
  }
  function missionsView(){
    var rows=list('missions');
    return header('Missões e contratos','Controle de missões de roleplay, responsáveis, facções, prazos e participação.','missions')+
      '<div class="rp-card-grid">'+(rows.length?rows.map(function(x){
      return '<section class="rp-profile"><div class="rp-mission-header"><h3>'+e(x.title)+'</h3>'+badge(x.status||'PLANEJAMENTO')+'</div>'+
        '<p class="rp-muted">'+e(x.description||'Sem resumo cadastrado')+'</p><div class="rp-profile-grid">'+
        '<div><span>Responsável</span><b>'+e(nameOf('members',x.memberId))+'</b></div>'+
        '<div><span>Prioridade</span><b>'+e(x.priority||'—')+'</b></div>'+
        '<div><span>Facção</span><b>'+e(nameOf('factions',x.factionId))+'</b></div>'+
        '<div><span>Investigado</span><b>'+e(nameOf('suspects',x.suspectId))+'</b></div>'+
        '<div><span>Participação</span><b>'+e(x.cutPercent||'0')+'%</b></div>'+
        '<div><span>Prazo</span><b>'+e(x.dueAt||'—')+'</b></div></div>'+
        progressBar(percent(x.progress,100))+'<p class="rp-muted">Progresso: '+percent(x.progress,100)+'%</p>'+
        (context.canEdit?'<div class="rp-card-actions">'+btn('Editar','edit','missions',x.id)+btn('Concluir','finish','missions',x.id)+btn('Arquivar','archive','missions',x.id)+'</div>':'')+
        '</section>';
    }).join(''):empty('Comece cadastrando uma missão de roleplay.','missions'))+'</div>';
  }
  function goalsView(){
    var rows=list('goals');
    return header('Metas da organização','Metas por membro, período, quantidade realizada e objetivos da família.','goals')+
      '<div class="rp-card-grid">'+(rows.length?rows.map(function(x){
      var p=percent(x.current,x.target);
      return '<section class="rp-profile"><div class="rp-split"><h3>'+e(x.title)+'</h3><b class="rp-percent">'+p+'%</b></div><p class="rp-muted">'+e(x.period||'SEMANAL')+' · '+e(nameOf('members',x.memberId))+'</p>'+
       '<div class="rp-big-metric">'+safeNumber(x.current)+' <span>/ '+safeNumber(x.target)+' '+e(x.unit||'AÇÕES')+'</span></div>'+progressBar(p)+
       '<div class="rp-card-actions">'+(context.canEdit?btn('+1','increment','goals',x.id)+btn('Editar','edit','goals',x.id)+btn('Arquivar','archive','goals',x.id):'')+'</div></section>';
    }).join(''):empty('Cadastre a primeira meta e acompanhe o progresso.','goals'))+'</div>';
  }
  function locationsView(){
    var rows=list('locations');
    return header('Locais e territórios','QGs, garagens, galpões e outros locais com coordenadas do GTA V.','locations')+
      '<div class="rp-two-buttons">'+btn('Abrir mapa de Los Santos','go','rp-map','','rp-primary')+'</div>'+
      '<div class="rp-card-grid">'+(rows.length?rows.map(function(x){
      return '<section class="rp-profile"><div class="rp-split"><h3>'+e(x.name)+'</h3>'+badge(x.kind||'LOCAL')+'</div>'+
      '<div class="rp-profile-grid">'+
      '<div><span>Região</span><b>'+e(x.district||'—')+'</b></div><div><span>Facção</span><b>'+e(nameOf('factions',x.factionId))+'</b></div>'+
      '<div><span>Coordenadas GTA</span><b>'+e(x.x)+' / '+e(x.y)+'</b></div><div><span>Responsável</span><b>'+e(nameOf('members',x.memberId))+'</b></div>'+
      '</div><p class="rp-muted">'+e(x.notes||'')+'</p>'+
      (context.canEdit?'<div class="rp-card-actions">'+btn('Editar local','edit','locations',x.id)+btn('Arquivar','archive','locations',x.id)+'</div>':'')+'</section>';
    }).join(''):empty('Adicione um QG, galpão ou ponto de interesse.','locations'))+'</div>';
  }
  function gtaMapView(){
    return header('Mapa de Los Santos','Mapa GTA V com coordenadas X/Y, pinos e zonas cadastradas no painel.','locations')+
      '<div class="rp-map-layout"><section class="rp-panel"><div class="rp-panel-head"><h3>⌖ Mapa de GTA V</h3><span class="rp-muted">Arraste e use o zoom. Clique para adicionar um local.</span></div>'+
      '<div id="rp-map-canvas" class="rp-map-canvas"><div class="rp-empty">Carregando o mapa…</div></div>'+
      '<div class="rp-map-foot"><span class="rp-legend-symbol family">'+(window.MafiaIcons?window.MafiaIcons.svg('headquarters','mc-marker-svg'):'◆')+'</span> QG da família <span class="rp-legend-symbol rival">'+(window.MafiaIcons?window.MafiaIcons.svg('shield','mc-marker-svg'):'◇')+'</span> Facção <span class="rp-legend-symbol">'+(window.MafiaIcons?window.MafiaIcons.svg('warehouse','mc-marker-svg'):'▣')+'</span> Outros locais <span class="rp-legend-symbol territory">'+(window.MafiaIcons?window.MafiaIcons.svg('territory','mc-marker-svg'):'⬡')+'</span> Territórios <span class="rp-map-credit">Mapa © Rockstar Games · tiles: FiveDock</span></div></section>'+
      '<aside class="rp-panel"><div class="rp-panel-head"><h3>Locais marcados</h3>'+btn('Ver lista','go','rp-locations')+'</div><div class="rp-map-side">'+
      (list('locations').length?list('locations').map(function(x){return '<div class="rp-map-location"><b>'+e(x.name)+'</b><small>'+e(x.kind||'LOCAL')+' · '+e(x.district||'sem distrito')+'</small>'+btn('Localizar','focus','locations',x.id)+'</div>';}).join(''):empty('Nenhum local cadastrado.','locations'))+
      '</div></aside></div>';
  }
  function networkView(){
    var all=nodes(),edges=list('links');
    var focused={};
    edges.forEach(function(x){focused[x.from]=true;focused[x.to]=true;});
    var use=all.filter(function(n){return focused[n.key];});
    if(!use.length)use=all.slice(0,16);
    use=use.slice(0,36);
    var centers={};
    use.forEach(function(n,i){
      var rad=use.length===1?0:(Math.PI*2*i/use.length-Math.PI/2);
      centers[n.key]={x:600+Math.cos(rad)*420,y:270+Math.sin(rad)*195,n:n};
    });
    var lines=edges.map(function(edge){
      var a=centers[edge.from],b=centers[edge.to];
      return a&&b?'<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="#8f4149" stroke-width="2" opacity=".8"><title>'+e(edge.kind||'VÍNCULO')+'</title></line>':'';
    }).join('');
    var circles=Object.keys(centers).map(function(k){
      var p=centers[k],n=p.n,c=typeColor(n.kind);
      return '<g class="rp-graph-node" data-node-key="'+e(n.key)+'" tabindex="0" role="button"><circle cx="'+p.x+'" cy="'+p.y+'" r="44" fill="#170e12" stroke="'+c+'" stroke-width="2"/>'+
       '<text x="'+p.x+'" y="'+(p.y-4)+'" fill="#fff" font-size="15" font-weight="700" text-anchor="middle">'+e(shorten(n.name,15))+'</text>'+
       '<text x="'+p.x+'" y="'+(p.y+16)+'" fill="'+c+'" font-size="11" text-anchor="middle">'+e(n.kind.toUpperCase())+'</text></g>';
    }).join('');
    return header('Mapa de conexões','Ligações entre membros, facções, investigados, contatos, veículos e locais do RP.','links')+
      '<section class="rp-panel rp-network-panel"><div class="rp-panel-head"><h3>◇ Rede de relacionamentos</h3><span class="rp-muted">'+edges.length+' vínculo(s) manuais</span></div>'+
      '<svg class="rp-graph" viewBox="0 0 1200 540" role="img" aria-label="Mapa de vínculos cadastrados">'+
      '<defs><radialGradient id="rp-glow"><stop stop-color="#341219"/><stop offset="1" stop-color="#08090c"/></radialGradient></defs>'+
      '<rect width="1200" height="540" fill="url(#rp-glow)"/>'+lines+circles+'</svg>'+
      (!edges.length?'<div class="rp-graph-hint">Nenhum vínculo manual cadastrado. Use “Novo registro” para ligar pessoas, locais e facções.</div>':'')+
      '</section><section class="rp-panel rp-link-list"><div class="rp-panel-head"><h3>Ligações registradas</h3></div>'+
      (edges.length?edges.map(function(l){
       var label=function(k){var n=all.find(function(item){return item.key===k});return n?n.name:'Registro não localizado';};
       return '<div class="rp-link-line"><b>'+e(label(l.from))+'</b><span>'+e(l.kind||'VÍNCULO')+'</span><b>'+e(label(l.to))+'</b>'+(context.canEdit?btn('Editar','edit','links',l.id)+btn('Excluir','archive','links',l.id):'')+'</div>';
      }).join(''):empty('Adicione vínculos para construir a rede.','links'))+'</section>';
  }
  function backupView(){
    return '<div class="rp-pagehead"><div><div class="rp-eyebrow">MAFIACORP / DADOS LOCAIS</div><h1>Backup do RP</h1><p>Exporte e importe cadastros da nova central no mesmo navegador ou em outro dispositivo.</p></div></div>'+
    '<div class="rp-card-grid"><section class="rp-profile"><h3>⬇ Exportar dados da central</h3><p class="rp-muted">Inclui equipe de RP, missões, metas, locais e conexões. Não exporta usuários, senhas nem as investigações legadas.</p>'+btn('Exportar JSON','export','backup','','rp-primary')+'</section>'+
    '<section class="rp-profile"><h3>⬆ Importar backup</h3><p class="rp-muted">Substitui somente os registros da Central RP. Revise o arquivo antes de importar.</p>'+
    '<input type="file" accept=".json,application/json" id="rp-import-input" class="rp-file-input"/>'+btn('Importar arquivo','import','backup','','rp-primary')+'</section></div>';
  }
  function render(view,db,options){
    context=Object.assign(context||{},options||{},{db:db});
    app=prepare(db);
    if(map){map.remove();map=null;}
    if(view==='dashboard')return dashboard();
    if(view==='rp-members')return memberView();
    if(view==='rp-missions')return missionsView();
    if(view==='rp-goals')return goalsView();
    if(view==='rp-locations')return locationsView();
    if(view==='rp-map')return gtaMapView();
    if(view==='rp-network')return networkView();
    if(view==='rp-backup')return backupView();
    return '<div class="rp-empty">Tela da central não encontrada.</div>';
  }
  function optionsFor(kind){
    if(kind==='node')return nodes().map(function(n){return {value:n.key,label:n.kind.toUpperCase()+' · '+n.name};});
    if(['members','locations'].includes(kind))return list(kind).map(function(r){return {value:r.id,label:r.codename||r.name};});
    if(['suspects','factions'].includes(kind))return active(context.db[kind]).map(function(r){return {value:r.id,label:r.name};});
    return [];
  }
  function fieldHtml(field,value){
    var key=field[0],label=field[1],kind=field[2],required=field[3]===true;
    var opts=field[4]||null;
    if(['members','locations','suspects','factions','node'].includes(kind))opts=optionsFor(kind);
    var body='';
    if(opts){
      body='<select class="rp-input" name="'+e(key)+'" '+(required?'required':'')+'>'+
       (required?'<option value="">Selecione</option>':'<option value="">Não definido</option>')+
       opts.map(function(o){
         var k=typeof o==='string'?o:o.value,n=typeof o==='string'?o:o.label;
         return '<option value="'+e(k)+'" '+(String(value||'')===String(k)?'selected':'')+'>'+e(n)+'</option>';
       }).join('')+'</select>';
    } else if(kind==='textarea'){
      body='<textarea class="rp-input" name="'+e(key)+'" rows="3">'+e(value)+'</textarea>';
    }else{
      var attrs=kind==='number'?'step="any" ':'';
      if(key==='progress'||key==='cutPercent')attrs+='min="0" max="100" ';
      if(key==='target')attrs+='min="0" ';
      body='<input class="rp-input" type="'+e(kind)+'" name="'+e(key)+'" '+attrs+'value="'+e(value==null?'':value)+'" '+(required?'required':'')+'/>';
    }
    return '<label class="rp-field"><span>'+e(label)+'</span>'+body+'</label>';
  }
  function openForm(kind,id,defaults){
    if(!context.canEdit){context.toast('Sem permissão para editar.',true);return;}
    var row=(id?app[kind].find(function(x){return x.id===id;}):null)||defaults||{};
    var title=id?'Editar '+types[kind]:'Novo cadastro · '+types[kind];
    var form='<div class="modal-head"><h3>'+e(title)+'</h3><button type="button" class="modal-close" data-rp-close>×</button></div>'+
     '<form id="rp-record-form" class="rp-record-form"><div class="modal-body rp-fields">'+
     schemas[kind].map(function(f){return fieldHtml(f,row[f[0]])}).join('')+
     '</div><div class="modal-foot"><button type="button" class="rp-btn" data-rp-close>Cancelar</button>'+
     '<button class="rp-btn rp-primary" type="submit">Salvar registro</button></div></form>';
    context.openModal(form);
    document.querySelectorAll('[data-rp-close]').forEach(function(b){b.addEventListener('click',context.closeModal)});
    var modalForm=document.getElementById('rp-record-form');
    modalForm.addEventListener('submit',async function(ev){
      ev.preventDefault();
      if(!modalForm.reportValidity())return;
      var data=new FormData(modalForm),obj=Object.assign({},row);
      schemas[kind].forEach(function(f){
        var v=data.get(f[0]);
        if(kind==='locations' && (f[0]==='x'||f[0]==='y') && (v==null||String(v).trim()==='')){
          obj[f[0]]=null;
        }else{
          obj[f[0]]=f[2]==='number'?safeNumber(v):String(v||'').trim();
        }
      });
      if(kind==='links' && (!obj.from||!obj.to||obj.from===obj.to)){
        context.toast('Escolha dois registros diferentes para a conexão.',true);return;
      }
      if(kind==='goals'&&obj.target<=0){context.toast('A meta deve ser maior que zero.',true);return;}
      if(kind==='missions'){
        obj.progress=Math.max(0,Math.min(100,obj.progress||0));
        obj.cutPercent=Math.max(0,Math.min(100,obj.cutPercent||0));
      }
      if(id){
        var index=app[kind].findIndex(function(x){return x.id===id;});
        if(index<0)return;
        obj.id=id;
        app[kind][index]=obj;
      }else{
        obj.id=uid();obj.createdAt=new Date().toISOString();app[kind].unshift(obj);
      }
      obj.updatedAt=new Date().toISOString();
      await context.saveDB();
      context.closeModal();
      context.renderView();
      context.toast('Registro RP salvo neste navegador.');
    });
  }
  async function action(element){
    var act=element.dataset.rp,kind=element.dataset.kind,id=element.dataset.id;
    if(act==='go'){context.navigate(kind);return;}
    if(act==='add'){openForm(kind);return;}
    if(act==='edit'){openForm(kind,id);return;}
    if(act==='archive'){
      if(!context.canEdit)return;
      var row=app[kind].find(function(x){return x.id===id;});
      if(!row || !confirm('Arquivar este registro do RP?'))return;
      row.archived=true;await context.saveDB();context.renderView();context.toast('Registro arquivado.');return;
    }
    if(act==='finish'){
      if(!context.canEdit)return;
      var mission=app.missions.find(function(x){return x.id===id;});
      if(mission){mission.status='CONCLUÍDA';mission.progress=100;await context.saveDB();context.renderView();context.toast('Missão concluída no painel.');}
      return;
    }
    if(act==='increment'){
      if(!context.canEdit)return;
      var goal=app.goals.find(function(x){return x.id===id;});
      if(goal){goal.current=Math.min(safeNumber(goal.target),safeNumber(goal.current)+1);await context.saveDB();context.renderView();}
      return;
    }
    if(act==='focus'){
      var p=app.locations.find(function(x){return x.id===id;});
      if(p&&map&&p.x!==''&&p.y!=='')map.setView([safeNumber(p.y),safeNumber(p.x)],5);
      return;
    }
    if(act==='export'){
      var blob=new Blob([JSON.stringify({application:'MafiaCorp-RP',version:1,exportedAt:new Date().toISOString(),rp:app},null,2)],{type:'application/json'});
      var url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='mafiacorp-rp-backup.json';
      document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},3000);return;
    }
    if(act==='import'){
      if(!context.canEdit)return;
      var input=document.getElementById('rp-import-input'),file=input&&input.files[0];
      if(!file){context.toast('Selecione um arquivo JSON de backup.',true);return;}
      if(file.size>4*1024*1024){context.toast('Backup muito grande.',true);return;}
      try{
        var raw=JSON.parse(await file.text());
        if(raw.application!=='MafiaCorp-RP'||raw.version!==1||!raw.rp)throw Error('Formato inválido');
        var restored={version:1};
        ['members','missions','goals','locations','links'].forEach(function(k){
          if(!Array.isArray(raw.rp[k])||raw.rp[k].length>10000)throw Error('Registros inválidos: '+k);
          restored[k]=raw.rp[k].filter(function(x){return x&&typeof x.id==='string'&&x.id.length<200});
        });
        if(!confirm('Substituir os dados da Central RP neste navegador? Faça um backup antes.'))return;
        context.db.rp=restored;app=restored;
        await context.saveDB();context.renderView();context.toast('Backup RP importado com sucesso.');
      }catch(err){context.toast('Falha ao importar: '+err.message,true);}
    }
  }
  function renderGameMap(){
    if(!window.L){document.getElementById('rp-map-canvas').innerHTML='<div class="rp-empty">Biblioteca Leaflet indisponível. É possível cadastrar locais manualmente na lista.</div>';return;}
    var L=window.L;
    var crs=L.extend({},L.CRS.Simple,{
      projection:L.Projection.LonLat,
      scale:function(z){return Math.pow(2,z)},
      zoom:function(s){return Math.log(s)/Math.LN2},
      transformation:new L.Transformation(.02072,117.3,-.0205,172.8),
      infinite:true
    });
    map=L.map('rp-map-canvas',{crs:crs,zoomControl:true,minZoom:1,maxZoom:6,preferCanvas:true,attributionControl:true});
    var bounds=L.latLngBounds(map.unproject([0,8192],5),map.unproject([8192,0],5));
    var tileOpts={tileSize:256,minZoom:0,maxZoom:6,maxNativeZoom:5,bounds:bounds,attribution:'Mapa © Rockstar Games | tiles FiveDock'};
    var tileLayer=L.tileLayer('https://cdn.fivedock.dev/o/fivedock/maps/styleatlas/{z}/{x}/{y}.jpg',tileOpts).addTo(map);
    var failures=0,switched=false;
    tileLayer.on('tileerror',function(){
      failures++;
      if(failures>=3&&!switched){
        switched=true;
        if(map){
          map.removeLayer(tileLayer);
          tileLayer=L.tileLayer('https://assets.fivedock.dev/maps/styleatlas/{z}/{x}/{y}.jpg',tileOpts).addTo(map);
        }
      }
    });
    map.setMaxBounds(bounds.pad(.12));
    map.setView([0,0],3);
    list('locations').forEach(function(loc){
      if(loc.x===''||loc.y===''||loc.x==null||loc.y==null)return;
      if(!Number.isFinite(Number(loc.x))||!Number.isFinite(Number(loc.y)))return;
      var markerKind={
        'QG DA FAMÍLIA':'headquarters','QG DE FACÇÃO':'shield',
        'GALPÃO':'warehouse','GARAGEM':'garage','RESIDÊNCIA':'home',
        'PONTO DE ENCONTRO':'meeting','TERRITÓRIO':'territory'
      }[loc.kind]||'pin';
      var tone=loc.kind==='QG DA FAMÍLIA'?'family':loc.kind==='QG DE FACÇÃO'?'rival':loc.kind==='TERRITÓRIO'?'territory':'neutral';
      var markerHtml='<span class="mc-map-pin '+tone+'"><span class="plate">'+
        (window.MafiaIcons?window.MafiaIcons.svg(markerKind,'mc-marker-svg'):'◆')+'</span></span>';
      var icon=L.divIcon({className:'mafia-pin-wrap',html:markerHtml,iconSize:[40,48],iconAnchor:[20,43],popupAnchor:[0,-38]});
      var marker=L.marker([Number(loc.y),Number(loc.x)],{icon,keyboard:true,title:loc.name});
      marker.bindPopup('<strong>'+e(loc.name)+'</strong><p>'+e(loc.kind||'LOCAL')+'<br>'+e(loc.district||'')+'</p><code>X: '+e(loc.x)+' Y: '+e(loc.y)+'</code>');
      marker.addTo(map);
      if(loc.kind==='TERRITÓRIO'&&safeNumber(loc.radius)>0){
        L.circle([Number(loc.y),Number(loc.x)],{radius:safeNumber(loc.radius),color:'#b1b6bf',fillOpacity:.1,weight:1.5}).addTo(map);
      }
    });
    if(context.canEdit){
      map.on('click',function(ev){
        openForm('locations',null,{x:ev.latlng.lng.toFixed(1),y:ev.latlng.lat.toFixed(1),kind:'PONTO DE ENCONTRO'});
      });
    }
    setTimeout(function(){if(map)map.invalidateSize()},120);
  }
  function wire(view,ctx){
    context=Object.assign(context||{},ctx||{});
    document.querySelectorAll('[data-rp]').forEach(function(button){
      button.addEventListener('click',function(){action(button).catch(function(err){console.error(err);context.toast('Falha ao executar ação no painel.',true);});});
    });
    document.querySelectorAll('[data-node-key]').forEach(function(el){
      function open(){
        var n=nodes().find(function(x){return x.key===el.dataset.nodeKey;});
        if(n)context.toast(n.kind.toUpperCase()+' · '+n.name);
      }
      el.addEventListener('click',open);
      el.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();open();}});
    });
    if(view==='rp-map')renderGameMap();
  }
  window.MafiaCenter={render:render,wire:wire,revision:revision};
})();