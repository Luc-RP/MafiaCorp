(function(){
"use strict";

const DATA = {
  investigations: [
    {id:"inv-001",caseId:"BLI-2026-00001",name:"OPERAÇÃO BLACKOUT",description:"Caso fictício utilizado para demonstrar a organização de dossiês, evidências e operações dentro da plataforma Black Investigation.",responsible:"LIMA",status:"ATIVA",priority:"CRÍTICA",openedAt:"2026-10-07",updatedAt:"2026-11-08"},
    {id:"inv-002",caseId:"BLI-2026-00002",name:"DOSSIÊ SILÊNCIO",description:"Exemplo demonstrativo de investigação documental e análise de vínculos. Todo o conteúdo desta página é fictício.",responsible:"REIS",status:"EM ANÁLISE",priority:"ALTA",openedAt:"2026-10-17",updatedAt:"2026-11-07"},
    {id:"inv-003",caseId:"BLI-2026-00003",name:"CASO MERIDIAN",description:"Exemplo de cadastro com pessoas, contatos e locais relacionados. Dados inventados, sem vínculo com investigações reais.",responsible:"COSTA",status:"ATIVA",priority:"MÉDIA",openedAt:"2026-10-24",updatedAt:"2026-11-06"}
  ],
  suspects: [
    {id:"sus-001",name:"Marcus Almeida",alias:"Marcão",faction:"NÃO INFORMADA",status:"ALVO",level:"CRÍTICO",classification:"SIGILOSO",investigationId:"inv-001",description:"Personagem fictício utilizado para ilustrar o preenchimento de um dossiê. Não corresponde a uma pessoa real."},
    {id:"sus-002",name:"João Silva",alias:"Joãozinho",faction:"NÃO INFORMADA",status:"SUSPEITO",level:"ALTO",classification:"RESTRITO",investigationId:"inv-001",description:"Perfil demonstrativo para apresentar relações entre investigados e veículos."},
    {id:"sus-003",name:"Helena Duarte",alias:"",faction:"NÃO INFORMADA",status:"MONITORADO",level:"MÉDIO",classification:"CONFIDENCIAL",investigationId:"inv-002",description:"Registro fictício para visualização da estrutura de um dossiê."},
    {id:"sus-004",name:"Bruno Teles",alias:"",faction:"NÃO INFORMADA",status:"MONITORADO",level:"BAIXO",classification:"PÚBLICO",investigationId:"inv-003",description:"Registro exclusivamente demonstrativo."},
    {id:"sus-005",name:"Camila Rocha",alias:"",faction:"NÃO INFORMADA",status:"SUSPEITO",level:"MÉDIO",classification:"RESTRITO",investigationId:"inv-003",description:"Registro exclusivamente demonstrativo."}
  ],
  vehicles: [
    {id:"veh-001",plate:"ABC-1234",brand:"BMW",model:"M4",color:"Preto",year:"2022",ownerId:"sus-001",status:"MONITORADO",investigationId:"inv-001"},
    {id:"veh-002",plate:"BRA-2E19",brand:"Toyota",model:"Corolla",color:"Prata",year:"2019",ownerId:"sus-002",status:"REGISTRADO",investigationId:"inv-001"},
    {id:"veh-003",plate:"XYZ-9821",brand:"Honda",model:"Civic",color:"Branco",year:"2021",ownerId:"sus-003",status:"MONITORADO",investigationId:"inv-002"}
  ],
  addresses: [
    {id:"loc-001",name:"Galpão 04",address:"Zona Industrial / localização fictícia",type:"GALPÃO",suspectId:"sus-001",investigationId:"inv-001",description:"Local ilustrativo sem coordenadas reais."},
    {id:"loc-002",name:"Residência de referência",address:"Rua Demonstrativa, 100",type:"RESIDÊNCIA",suspectId:"sus-002",investigationId:"inv-001",description:"Endereço fictício."},
    {id:"loc-003",name:"Escritório Central",address:"Avenida Exemplo, 200",type:"EMPRESA",suspectId:"sus-003",investigationId:"inv-002",description:"Endereço fictício."},
    {id:"loc-004",name:"Ponto Meridian",address:"Setor fictício 03",type:"PONTO DE ENCONTRO",suspectId:"sus-004",investigationId:"inv-003",description:"Local ilustrativo."}
  ],
  contacts: [
    {id:"cnt-001",name:"Contato de referência A",phone:"(00) 00000-0000",type:"Informante fictício",relation:"Contato",suspectId:"sus-001",investigationId:"inv-001"},
    {id:"cnt-002",name:"Contato de referência B",phone:"(00) 00000-0000",type:"Testemunha fictícia",relation:"Conhecido",suspectId:"sus-002",investigationId:"inv-001"},
    {id:"cnt-003",name:"Contato de referência C",phone:"(00) 00000-0000",type:"Comercial fictício",relation:"Contato",suspectId:"sus-003",investigationId:"inv-002"}
  ],
  associates: [
    {id:"asc-001",name:"Associado de referência A",alias:"",relation:"Fornecedor fictício",relevance:"ALTA",suspectId:"sus-001",investigationId:"inv-001"},
    {id:"asc-002",name:"Associada de referência B",alias:"",relation:"Conhecida fictícia",relevance:"MÉDIA",suspectId:"sus-003",investigationId:"inv-002"}
  ],
  evidence: [
    {id:"evd-001",evdId:"EVD-2026-000001",name:"Fotografia de referência",type:"FOTO",classification:"SIGILOSO",date:"2026-11-06",investigationId:"inv-001",suspectId:"sus-001",description:"Item demonstrativo. Nenhuma imagem ou evidência real foi anexada."},
    {id:"evd-002",evdId:"EVD-2026-000002",name:"Documento ilustrativo",type:"DOCUMENTO",classification:"CONFIDENCIAL",date:"2026-11-04",investigationId:"inv-002",suspectId:"sus-003",description:"Exemplo de entrada documental sem arquivo real."},
    {id:"evd-003",evdId:"EVD-2026-000003",name:"Registro de campo",type:"OUTRO",classification:"RESTRITO",date:"2026-11-02",investigationId:"inv-003",suspectId:"sus-004",description:"Entrada exclusivamente demonstrativa."}
  ],
  operations: [
    {id:"op-001",code:"OP-BLACKOUT-01",name:"Cerco ao Galpão 04",objective:"Operação fictícia para teste do fluxo de visualização.",status:"ATIVA",priority:"CRÍTICA",responsible:"LIMA",investigationId:"inv-001"},
    {id:"op-002",code:"OP-SILENCIO-01",name:"Análise Documental",objective:"Apresentação de um registro operacional demonstrativo.",status:"PLANEJAMENTO",priority:"ALTA",responsible:"REIS",investigationId:"inv-002"},
    {id:"op-003",code:"OP-MERIDIAN-01",name:"Monitoramento Meridian",objective:"Exibição de cronologia e conexões sem conteúdo real.",status:"ATIVA",priority:"MÉDIA",responsible:"COSTA",investigationId:"inv-003"}
  ],
  team: [
    {id:"usr-001",name:"Administrador de demonstração",codename:"ROOT",role:"ADMINISTRADOR",specialty:"Gestão da plataforma",status:"ONLINE"},
    {id:"usr-002",name:"Rafael Lima",codename:"LIMA",role:"CHEFE DE INVESTIGAÇÃO",specialty:"Gestão de casos fictícios",status:"ONLINE"},
    {id:"usr-003",name:"Bianca Costa",codename:"COSTA",role:"INVESTIGADOR",specialty:"Análise de campo fictícia",status:"EM OPERAÇÃO"},
    {id:"usr-004",name:"Diego Reis",codename:"REIS",role:"INVESTIGADOR",specialty:"Análise documental fictícia",status:"OFFLINE"}
  ],
  reports: [
    {id:"rep-001",title:"Relatório Preliminar — Operação Blackout",type:"RELATÓRIO INVESTIGATIVO",classification:"SIGILOSO",author:"LIMA",investigationId:"inv-001",date:"2026-11-04",description:"Síntese demonstrativa das seções vinculadas ao caso.",conclusion:"Exemplo de conclusão, sem validade operacional."},
    {id:"rep-002",title:"Relatório de Inteligência — Dossiê Silêncio",type:"RELATÓRIO DE INTELIGÊNCIA",classification:"CONFIDENCIAL",author:"REIS",investigationId:"inv-002",date:"2026-11-07",description:"Consolidação fictícia de dados para apresentar a interface.",conclusion:"Registro de treinamento e apresentação."}
  ],
  audit: [
    {id:"au-001",user:"SISTEMA",action:"Base demonstrativa preparada",detail:"Conteúdo fictício",date:"2026-11-09T08:00:00"},
    {id:"au-002",user:"LIMA",action:"Caso de demonstração atualizado",detail:"BLI-2026-00001",date:"2026-11-08T16:24:00"},
    {id:"au-003",user:"REIS",action:"Relatório de exemplo registrado",detail:"BLI-2026-00002",date:"2026-11-07T14:18:00"}
  ]
};
const NAV=[
  {section:"GERAL",items:[["dashboard","Dashboard","◆"]]},
  {section:"INVESTIGAÇÃO",items:[["investigations","Investigações","▣"],["suspects","Investigados","◎"],["vehicles","Veículos","▤"],["addresses","Locais","⌂"],["contacts","Contatos","☏"],["associates","Associados","◇"],["evidence","Evidências","⌘"],["operations","Operações","⚑"]]},
  {section:"GESTÃO",items:[["team","Equipe","☰"],["reports","Relatórios","▦"],["connections","Connection Map","⬡"],["audit","Auditoria","◈"]]}
];
const NAMES={dashboard:"COMMAND CENTER",investigations:"INVESTIGAÇÕES",suspects:"INVESTIGADOS",vehicles:"VEÍCULOS",addresses:"LOCAIS",contacts:"CONTATOS",associates:"ASSOCIADOS",evidence:"EVIDÊNCIAS",operations:"OPERAÇÕES",team:"EQUIPE",reports:"RELATÓRIOS",connections:"CONNECTION MAP",audit:"AUDITORIA",search:"PESQUISA",case:"DOSSIÊ",person:"INVESTIGADO"};
let screen="dashboard",caseId=null,personId=null,caseTab="overview",filter="TODOS",selectedPerson="sus-001",query="";
const content=document.getElementById("content"),modalRoot=document.getElementById("modal-root");
function esc(v){return String(v===undefined||v===null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function tag(v){v=String(v||"NÃO INFORMADO");let cls=/CRÍTICA|SIGILOSO|ALVO|PROCURADO|FORAGIDO|CANCELADA/.test(v)?"tag-red":/ATIVA|ONLINE|CONCLUÍDA/.test(v)?"tag-green":/ALTA|MÉDIA|EM ANÁLISE|RESTRITO|CONFIDENCIAL|PLANEJAMENTO|EM OPERAÇÃO/.test(v)?"tag-warn":"tag-grey";return '<span class="tag '+cls+'">'+esc(v)+'</span>';}
function inv(id){return DATA.investigations.find(function(x){return x.id===id;});}
function person(id){return DATA.suspects.find(function(x){return x.id===id;});}
function invName(id){let a=inv(id);return a?a.caseId:"—";}
function personName(id){let a=person(id);return a?a.name:"—";}
function fmtDate(s){if(!s)return"—";let a=s.slice(0,10).split("-");return a.length===3?a[2]+"/"+a[1]+"/"+a[0]:"—";}
function heading(title,sub,actions){return '<div class="page-head"><div><div class="eyebrow">BLACK INVESTIGATION / MAFIACORP</div><h1 class="page-title">'+title+'</h1><p class="subtext">'+esc(sub||"")+'</p></div>'+(actions||"")+'</div>';}
function caseCard(i){return '<button class="case-card" data-case="'+esc(i.id)+'"><div class="case-id">'+esc(i.caseId)+'</div><div class="case-name">'+esc(i.name)+'</div><div class="badges">'+tag(i.status)+tag(i.priority)+'</div><div class="case-bottom"><span>RESP. <strong>'+esc(i.responsible)+'</strong></span><span>ATUALIZADO <strong>'+fmtDate(i.updatedAt)+'</strong></span></div></button>';}
function activityRow(a){return '<div class="activity"><div class="activity-time">'+esc(a.date.slice(11,16)||"—")+'</div><div class="activity-text"><strong>'+esc(a.user)+'</strong> '+esc(a.action)+' <span class="row-caption">'+esc(a.detail)+'</span></div></div>';}
function dashboard(){
  const active=DATA.investigations.filter(function(x){return x.status==="ATIVA";}).length;
  const ops=DATA.operations.filter(function(x){return x.status==="ATIVA";}).length;
  const online=DATA.team.filter(function(x){return x.status==="ONLINE";}).length;
  const kpis=[["INVESTIGAÇÕES ATIVAS",active,"casos em andamento"],["INVESTIGADOS",DATA.suspects.length,"perfis demonstrativos"],["OPERAÇÕES ATIVAS",ops,"operações de exemplo"],["EVIDÊNCIAS",DATA.evidence.length,"entradas ilustrativas"],["EQUIPE ONLINE",online,"estado simulado"]];
  let html=heading('BLACK INVESTIGATION <span class="accent">// COMMAND CENTER</span>',"Central de inteligência • Visualização pública da demonstração",'<div class="head-actions"><button class="button" data-export>↓ EXPORTAR DEMO</button></div>');
  html+='<div class="kpis">'+kpis.map(function(k){return '<div class="kpi"><div class="k-label">'+k[0]+'</div><div class="k-value">'+k[1]+'</div><div class="k-foot">'+k[2]+'</div></div>';}).join("")+'</div>';
  html+='<div class="dash-columns"><section class="panel"><div class="panel-header"><span class="panel-title">ATIVIDADE RECENTE</span><span class="panel-sub">REGISTROS FICTÍCIOS</span></div>'+DATA.audit.map(activityRow).join("")+'</section>';
  const counts=["ATIVA","EM ANÁLISE","SUSPENSA","CONCLUÍDA","ARQUIVADA"].map(function(s){return [s,DATA.investigations.filter(function(i){return i.status===s;}).length];});
  html+='<section class="panel"><div class="panel-header"><span class="panel-title">INVESTIGAÇÕES POR STATUS</span><span class="panel-sub">DISTRIBUIÇÃO</span></div><div class="panel-body">'+counts.map(function(c){return '<div class="barline"><span>'+esc(c[0])+'</span><div class="track"><div class="fill" style="width:'+Math.round(100*c[1]/DATA.investigations.length)+'%"></div></div><span class="value">'+c[1]+'</span></div>';}).join("")+'</div><div class="panel-header"><span class="panel-title">OPERAÇÕES</span></div>'+DATA.operations.map(function(o){return '<button class="list-card" data-record="operations:'+esc(o.id)+'"><div><strong>'+esc(o.name)+'</strong><small>'+esc(o.code)+'</small></div>'+tag(o.status)+'</button>';}).join("")+'</section></div>';
  html+='<div class="section-heading"><h2>DOSSIÊS EM DESTAQUE</h2><button class="button button-sm" data-view="investigations">VER TODOS</button></div><div class="cards">'+DATA.investigations.map(caseCard).join("")+'</div>';
  return html;
}
function columns(type){const t={
  suspects:[["NOME",function(r){return '<strong>'+esc(r.name)+'</strong><div class="row-caption">'+esc(r.alias||"SEM APELIDO")+'</div>'; }],["FACÇÃO",function(r){return esc(r.faction);} ],["STATUS",function(r){return tag(r.status);}],["NÍVEL",function(r){return tag(r.level);}],["CASO",function(r){return esc(invName(r.investigationId));}]],
  vehicles:[["PLACA",function(r){return '<strong class="mono">'+esc(r.plate)+'</strong>'; }],["MARCA / MODELO",function(r){return esc(r.brand+" "+r.model);}],["COR / ANO",function(r){return esc(r.color+" / "+r.year);}],["STATUS",function(r){return tag(r.status);}],["INVESTIGADO",function(r){return esc(personName(r.ownerId));}]],
  addresses:[["LOCAL",function(r){return '<strong>'+esc(r.name)+'</strong>'; }],["ENDEREÇO",function(r){return esc(r.address);}],["TIPO",function(r){return tag(r.type);}],["CASO",function(r){return esc(invName(r.investigationId));}]],
  contacts:[["NOME",function(r){return '<strong>'+esc(r.name)+'</strong>'; }],["CONTATO",function(r){return esc(r.phone);}],["TIPO",function(r){return esc(r.type);}],["VÍNCULO",function(r){return esc(personName(r.suspectId));}]],
  associates:[["NOME",function(r){return '<strong>'+esc(r.name)+'</strong>'; }],["RELAÇÃO",function(r){return esc(r.relation);}],["RELEVÂNCIA",function(r){return tag(r.relevance);}],["INVESTIGADO",function(r){return esc(personName(r.suspectId));}]],
  evidence:[["IDENTIFICADOR",function(r){return '<strong class="mono">'+esc(r.evdId)+'</strong>'; }],["NOME",function(r){return esc(r.name);}],["TIPO",function(r){return tag(r.type);}],["CLASSIFICAÇÃO",function(r){return tag(r.classification);}],["CASO",function(r){return esc(invName(r.investigationId));}]],
  operations:[["CÓDIGO",function(r){return '<strong class="mono">'+esc(r.code)+'</strong>'; }],["OPERAÇÃO",function(r){return esc(r.name);}],["STATUS",function(r){return tag(r.status);}],["PRIORIDADE",function(r){return tag(r.priority);}],["CASO",function(r){return esc(invName(r.investigationId));}]],
  team:[["NOME",function(r){return '<strong>'+esc(r.name)+'</strong>'; }],["CODINOME",function(r){return esc(r.codename);}],["CARGO",function(r){return tag(r.role);}],["ESPECIALIDADE",function(r){return esc(r.specialty);}],["STATUS",function(r){return tag(r.status);}]],
  audit:[["USUÁRIO",function(r){return '<strong class="mono">'+esc(r.user)+'</strong>'; }],["AÇÃO",function(r){return esc(r.action);}],["DETALHES",function(r){return esc(r.detail);}],["DATA",function(r){return fmtDate(r.date)+" "+esc(r.date.slice(11,16));}]]
};return t[type]||[];}
function table(type,items){const cols=columns(type);let head='<thead><tr>'+cols.map(function(c){return '<th>'+c[0]+'</th>';}).join("")+'</tr></thead>';let body=items.map(function(r){return '<tr class="clickable" tabindex="0" data-record="'+esc(type+":"+r.id)+'">'+cols.map(function(c){return '<td>'+c[1](r)+'</td>';}).join("")+'</tr>';}).join("");return items.length?'<div class="table-shell"><table class="data-table">'+head+'<tbody>'+body+'</tbody></table></div>':'<div class="empty"><strong>Nenhum registro encontrado</strong>Altere o filtro para consultar outros registros de demonstração.</div>';}
function listPage(type){
  const labels={suspects:"Perfis fictícios cadastrados",vehicles:"Registros demonstrativos de veículos",addresses:"Locais sem geolocalização real",contacts:"Contatos fictícios",associates:"Relações ilustrativas",evidence:"Catálogo de registros demonstrativos",operations:"Operações fictícias",team:"Equipe demonstrativa sem autenticação real",audit:"Histórico ilustrativo, sem registro de acessos reais"};
  let rows=DATA[type].slice();
  const statuses=type==="suspects"?["TODOS","ALVO","SUSPEITO","MONITORADO"]:type==="operations"?["TODOS","ATIVA","PLANEJAMENTO"]:type==="evidence"?["TODOS","FOTO","DOCUMENTO","OUTRO"]:[];
  if(statuses.length&&filter!=="TODOS") rows=rows.filter(function(r){return (type==="evidence"?r.type:r.status)===filter;});
  return heading(esc(NAMES[type]),labels[type],'<div class="head-actions"><span class="read-only-chip">'+DATA[type].length+' REGISTROS</span></div>')+(statuses.length?'<div class="toolbar"><div class="filter-area">'+statuses.map(function(s){return '<button class="filter-button '+(filter===s?"active":"")+'" data-filter="'+esc(s)+'">'+esc(s)+'</button>';}).join("")+'</div></div>':'')+table(type,rows);
}
function investigationList(){return heading("Investigações","Dossiês demonstrativos organizados por prioridade, responsável e status",'<div class="head-actions"><span class="read-only-chip">'+DATA.investigations.length+' CASOS</span></div>')+'<div class="cards">'+DATA.investigations.map(caseCard).join("")+'</div>';}
function related(type,id){return DATA[type].filter(function(r){return r.investigationId===id;});}
function detailPanel(label,number){return '<div class="kpi"><div class="k-label">'+label+'</div><div class="k-value">'+number+'</div><div class="k-foot">REGISTROS</div></div>';}
function caseDetail(){
  const i=inv(caseId);if(!i)return '<div class="empty">Caso indisponível</div>';
  let html='<div class="detail-nav"><button class="back" data-view="investigations">← VOLTAR PARA INVESTIGAÇÕES</button></div><div class="detail-head"><div class="detail-headline"><div><h2>'+esc(i.name)+'</h2><div class="case-id">'+esc(i.caseId)+'</div></div>'+tag(i.priority)+'</div><div class="detail-meta"><div><small>Status</small>'+tag(i.status)+'</div><div><small>Prioridade</small>'+tag(i.priority)+'</div><div><small>Responsável</small><strong>'+esc(i.responsible)+'</strong></div><div><small>Aberta em</small><strong>'+fmtDate(i.openedAt)+'</strong></div></div></div>';
  const tabs=[["overview","Visão Geral"],["suspects","Investigados"],["vehicles","Veículos"],["addresses","Locais"],["contacts","Contatos"],["associates","Associados"],["evidence","Evidências"],["operations","Operações"],["reports","Relatórios"]];
  html+='<div class="tabs" role="tablist">'+tabs.map(function(t){return '<button class="tab '+(caseTab===t[0]?"active":"")+'" data-tab="'+t[0]+'" role="tab" aria-selected="'+(caseTab===t[0])+'">'+t[1]+'</button>';}).join("")+'</div>';
  if(caseTab==="overview"){
    const kinds=[["INVESTIGADOS","suspects"],["VEÍCULOS","vehicles"],["LOCAIS","addresses"],["EVIDÊNCIAS","evidence"],["OPERAÇÕES","operations"]];
    html+='<section class="panel"><div class="panel-header"><span class="panel-title">DESCRIÇÃO DO DOSSIÊ</span></div><div class="panel-body text-block">'+esc(i.description)+'</div></section><div class="section-heading"><h2>REGISTROS VINCULADOS</h2></div><div class="kpis">'+kinds.map(function(k){return detailPanel(k[0],related(k[1],i.id).length);}).join("")+'</div>';
  }else if(caseTab==="reports"){
    html+=reports(related("reports",i.id),false);
  }else{
    html+=table(caseTab,related(caseTab,i.id));
  }
  return html;
}
function personDetail(){
  const p=person(personId);if(!p)return '<div class="empty">Investigado indisponível</div>';
  const init=p.name.split(" ").slice(0,2).map(function(w){return w.charAt(0);}).join("");
  let html='<div class="detail-nav"><button class="back" data-view="suspects">← VOLTAR PARA INVESTIGADOS</button></div><div class="person-layout"><aside class="person-portrait"><div class="portrait" aria-label="Sem fotografia real">'+esc(init)+'</div><p class="eyebrow">SEM FOTO / DEMO</p><button class="button" data-view="connections" data-person-select="'+esc(p.id)+'">⬡ MAPA DE CONEXÕES</button></aside><div><div class="detail-head"><h2>'+esc(p.name)+'</h2><div class="case-id">ALIAS: '+esc(p.alias||"NÃO INFORMADO")+'</div><div class="detail-meta"><div><small>STATUS</small>'+tag(p.status)+'</div><div><small>NÍVEL</small>'+tag(p.level)+'</div><div><small>CLASSIFICAÇÃO</small>'+tag(p.classification)+'</div><div><small>CASO</small><button class="back" data-case="'+esc(p.investigationId)+'">'+esc(invName(p.investigationId))+'</button></div></div></div><div class="panel" style="margin-bottom:15px"><div class="panel-header"><span class="panel-title">DESCRIÇÃO</span></div><div class="panel-body text-block">'+esc(p.description)+'</div></div><div class="person-info">';
  [["VEÍCULOS RELACIONADOS","vehicles","ownerId"],["CONTATOS","contacts","suspectId"],["LOCAIS RELACIONADOS","addresses","suspectId"],["ASSOCIADOS","associates","suspectId"],["EVIDÊNCIAS VINCULADAS","evidence","suspectId"]].forEach(function(x){let rows=DATA[x[1]].filter(function(a){return a[x[2]]===p.id;});html+='<div class="panel"><div class="panel-header"><span class="panel-title">'+x[0]+'</span><span class="panel-sub">'+rows.length+'</span></div><div class="panel-body">'+(rows.map(function(r){return '<button class="list-card" data-record="'+esc(x[1]+":"+r.id)+'"><div><strong>'+esc(r.name||r.plate||r.evdId)+'</strong><small>'+esc(r.type||r.model||r.relation||"REGISTRO")+'</small></div><span>↗</span></button>';}).join("")||'<p>Nenhum registro vinculado.</p>')+'</div></div>';});
  html+='</div></div></div>';return html;
}
function reports(rows,withTitle){return (withTitle?heading("Relatórios","Documentos demonstrativos vinculados aos dossiês"):"")+(rows.length?rows.map(function(r){return '<section class="report"><div class="report-top"><div><h3>'+esc(r.title)+'</h3><small>'+esc(r.type)+' • '+esc(invName(r.investigationId))+' • '+esc(r.author)+' • '+fmtDate(r.date)+'</small></div>'+tag(r.classification)+'</div><p>'+esc(r.description)+'</p><div class="eyebrow" style="margin-top:18px">CONCLUSÃO</div><p>'+esc(r.conclusion)+'</p></section>';}).join(""):'<div class="empty">Nenhum relatório vinculado.</div>');}
function connections(){
  const p=person(selectedPerson)||DATA.suspects[0];selectedPerson=p.id;
  const nodes=[{type:"suspects",row:p,label:p.name,center:true}];
  const caseRow=inv(p.investigationId);if(caseRow)nodes.push({type:"investigations",row:caseRow,label:caseRow.caseId});
  ["vehicles","contacts","associates","addresses","evidence"].forEach(function(t){DATA[t].filter(function(r){return (t==="vehicles"?r.ownerId:r.suspectId)===p.id;}).forEach(function(r){nodes.push({type:t,row:r,label:r.name||r.plate||r.evdId});});});
  const cx=50,cy=50,others=nodes.length-1;
  let svg='<svg viewBox="0 0 1000 590" preserveAspectRatio="none" aria-hidden="true">';
  nodes.forEach(function(n,k){if(k===0)return;const a=(k-1)/others*Math.PI*2-Math.PI/2,x=50+37*Math.cos(a),y=50+37*Math.sin(a);n.x=x;n.y=y;svg+='<line x1="500" y1="295" x2="'+(x*10).toFixed(1)+'" y2="'+(y*5.9).toFixed(1)+'" stroke="#613331" stroke-width="1.2" stroke-dasharray="4 5" />';});
  svg+='</svg>';
  let html=heading('Connection <span class="accent">Map</span>',"Relações ilustrativas por perfil, com nós navegáveis");
  html+='<div class="connections-layout"><div class="panel connection-people"><div class="panel-header"><span class="panel-title">INVESTIGADOS</span></div>'+DATA.suspects.map(function(s){return '<button class="connection-pick '+(selectedPerson===s.id?"active":"")+'" data-pick="'+esc(s.id)+'"><strong>'+esc(s.name)+'</strong><small>'+esc(invName(s.investigationId))+'</small></button>';}).join("")+'</div><div><div class="network" aria-label="Mapa de conexões demonstrativo">'+svg;
  nodes.forEach(function(n,k){let x=k===0?50:n.x,y=k===0?50:n.y;html+='<button class="node '+(k===0?"center":"")+'" style="left:'+x.toFixed(2)+'%;top:'+y.toFixed(2)+'%" data-record="'+esc(n.type+":"+n.row.id)+'"><span>'+esc(k===0?"INVESTIGADO":NAMES[n.type]||"REGISTRO")+'</span><strong>'+esc(n.label)+'</strong></button>';});
  html+='</div><div class="network-caption">* Os vínculos e nomes desta demonstração são fictícios. Clique em um nó para consultar o registro.</div></div></div>';
  return html;
}
function searchResults(){
  const q=query.trim().toLocaleLowerCase("pt-BR");
  const types=["investigations","suspects","vehicles","addresses","contacts","associates","evidence","operations","team","reports"];
  let matches=[];
  if(q)types.forEach(function(type){DATA[type].forEach(function(r){let hay=Object.values(r).join(" ").toLocaleLowerCase("pt-BR");if(hay.includes(q))matches.push({type:type,row:r});});});
  const html=heading('Pesquisa <span class="accent">// GLOBAL</span>',q?'Resultados para "'+query+'"':'Digite um termo na busca superior.');
  if(!q)return html+'<div class="empty"><strong>Pesquisa global</strong>Busque pelo nome de uma pessoa fictícia, identificador de caso, placa ou operação.</div>';
  return html+'<div class="eyebrow">'+matches.length+' RESULTADO(S) ENCONTRADO(S)</div><div class="data-list">'+(matches.map(function(m){const r=m.row;return '<button class="list-card" data-record="'+esc(m.type+":"+r.id)+'"><div><strong>'+esc(r.name||r.title||r.plate||r.action||r.evdId)+'</strong><small>'+esc(NAMES[m.type]||m.type)+' • '+esc(r.caseId||r.code||r.evdId||r.status||"REGISTRO")+'</small></div><span>↗</span></button>';}).join("")||'<div class="empty"><strong>Nenhuma correspondência</strong>Tente outro nome, placa ou código de caso.</div>')+'</div>';
}
function renderNav(){const el=document.getElementById("navigation");el.innerHTML=NAV.map(function(section){return '<div class="nav-section">'+section.section+'</div>'+section.items.map(function(it){return '<button class="nav-link '+(screen===it[0]?"active":"")+'" data-view="'+it[0]+'"><span class="nav-symbol">'+it[2]+'</span><span>'+it[1]+'</span></button>';}).join("");}).join("");}
function render(){
  renderNav();document.getElementById("breadcrumb").textContent=NAMES[screen]||screen.toUpperCase();document.title=(NAMES[screen]||"BLACK INVESTIGATION")+" | MafiaCorp";
  let html="";
  if(screen==="dashboard")html=dashboard();
  else if(screen==="investigations")html=investigationList();
  else if(screen==="case")html=caseDetail();
  else if(screen==="person")html=personDetail();
  else if(screen==="connections")html=connections();
  else if(screen==="reports")html=reports(DATA.reports,true);
  else if(screen==="search")html=searchResults();
  else if(DATA[screen])html=listPage(screen);
  else html='<div class="empty">Página não encontrada.</div>';
  content.innerHTML=html;
}
function navigate(view){screen=view;filter="TODOS";query=view==="search"?query:"";if(view!=="search")document.getElementById("search").value="";render();closeMenu();window.scrollTo(0,0);}
function openCase(id){caseId=id;caseTab="overview";navigate("case");}
function openPerson(id){personId=id;navigate("person");}
function openRecord(spec){const parts=spec.split(":"),type=parts[0],id=parts[1];if(type==="investigations")return openCase(id);if(type==="suspects")return openPerson(id);const r=(DATA[type]||[]).find(function(a){return a.id===id;});if(!r)return;
  const LABELS={id:"Identificador",name:"Nome",title:"Título",plate:"Placa",brand:"Marca",model:"Modelo",color:"Cor",year:"Ano",address:"Endereço",phone:"Contato",type:"Tipo",relation:"Relação",relevance:"Relevância",status:"Status",classification:"Classificação",level:"Nível",priority:"Prioridade",objective:"Objetivo",description:"Descrição",conclusion:"Conclusão",specialty:"Especialidade",role:"Função",code:"Código",evdId:"ID da Evidência",author:"Autor",responsible:"Responsável",date:"Data",investigationId:"Investigação",suspectId:"Investigado",ownerId:"Vinculado a",codename:"Codinome",alias:"Apelido"};
  const rows=Object.keys(r).map(function(key){let val=r[key];if(key==="investigationId")val=invName(val);if(key==="suspectId"||key==="ownerId")val=personName(val);if(key==="date")val=fmtDate(val);return '<div class="kv"><small>'+esc(LABELS[key]||key)+'</small><span>'+esc(val||"—")+'</span></div>';}).join("");
  modalRoot.innerHTML='<section class="modal-window" role="dialog" aria-modal="true" aria-label="Detalhes do registro"><div class="modal-head"><h2>'+esc(r.name||r.title||r.plate||r.evdId||r.action||"REGISTRO")+'</h2><button class="modal-close" data-close aria-label="Fechar">×</button></div><div class="modal-content"><div class="eyebrow">'+esc(NAMES[type]||type)+' / REGISTRO DEMONSTRATIVO</div>'+rows+'</div></section>';
  modalRoot.hidden=false;document.body.style.overflow="hidden";modalRoot.querySelector("[data-close]").focus();
}
function closeModal(){modalRoot.hidden=true;modalRoot.innerHTML="";document.body.style.overflow="";}
function closeMenu(){const bar=document.getElementById("sidebar");bar.classList.remove("open");document.getElementById("mobile-scrim").hidden=true;document.getElementById("menu-toggle").setAttribute("aria-expanded","false");}
function toggleMenu(){const bar=document.getElementById("sidebar"),on=!bar.classList.contains("open");bar.classList.toggle("open",on);document.getElementById("mobile-scrim").hidden=!on;document.getElementById("menu-toggle").setAttribute("aria-expanded",String(on));}
document.addEventListener("click",function(e){
  const btn=e.target.closest("[data-view],[data-case],[data-person],[data-record],[data-tab],[data-pick],[data-filter],[data-person-select],[data-export],[data-close]");
  if(!btn){if(e.target===modalRoot)closeModal();return;}
  if(btn.hasAttribute("data-close"))return closeModal();
  if(btn.hasAttribute("data-case"))return openCase(btn.getAttribute("data-case"));
  if(btn.hasAttribute("data-person"))return openPerson(btn.getAttribute("data-person"));
  if(btn.hasAttribute("data-record"))return openRecord(btn.getAttribute("data-record"));
  if(btn.hasAttribute("data-tab")){caseTab=btn.getAttribute("data-tab");render();return;}
  if(btn.hasAttribute("data-pick")){selectedPerson=btn.getAttribute("data-pick");render();return;}
  if(btn.hasAttribute("data-filter")){filter=btn.getAttribute("data-filter");render();return;}
  if(btn.hasAttribute("data-person-select"))selectedPerson=btn.getAttribute("data-person-select");
  if(btn.hasAttribute("data-view"))return navigate(btn.getAttribute("data-view"));
  if(btn.hasAttribute("data-export")){const b=new Blob([JSON.stringify({notice:"DADOS FICTICIOS PARA DEMONSTRACAO",data:DATA},null,2)],{type:"application/json"});const a=document.createElement("a");const u=URL.createObjectURL(b);a.href=u;a.download="black-investigation-demo.json";a.click();setTimeout(function(){URL.revokeObjectURL(u);},1000);}
});
document.addEventListener("keydown",function(e){if(e.key==="Escape"){closeModal();closeMenu();}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();document.getElementById("search").focus();}if((e.key==="Enter"||e.key===" ")&&e.target.matches("tr[data-record]")){e.preventDefault();openRecord(e.target.getAttribute("data-record"));}});
document.getElementById("search").addEventListener("input",function(e){query=e.target.value;screen="search";render();});
document.getElementById("menu-toggle").addEventListener("click",toggleMenu);
document.getElementById("mobile-scrim").addEventListener("click",closeMenu);
function clock(){const d=new Date();document.getElementById("clock").textContent=d.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"})+" "+d.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});}
clock();setInterval(clock,30000);render();
})();