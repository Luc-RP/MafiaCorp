/* MafiaCorp • painel de desempenho histórico por integrante, 01/11/2026 a 31/12/2030. */
(function(){
'use strict';
const FIRST='2026-11-01',LAST='2030-12-31',MONTHS=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DOW=['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'];
const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&#39;'}[c]));
let ctx=null,record=null,month=10,year=2026,selectedDay='',requestId=0;
function valid(){return document.getElementById('view')&&(!ctx?.isActive||ctx.isActive());}
function dateStr(y,m,d){return y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');}
function monthLength(y,m){return new Date(Date.UTC(y,m+1,0)).getUTCDate();}
function weekIndex(y,m,d){const start=(new Date(Date.UTC(y,m,1)).getUTCDay()+6)%7;return Math.floor((start+d-1)/7);}
function dayInfo(day){return record.days.find(x=>x.day===day)||null;}
function total(arr,k){return arr.reduce((n,r)=>n+(Number(r[k])||0),0);}
function shortDate(day){return day?day.split('-').reverse().join('/'):'Nenhum';}
function allowed(day){return day>=FIRST&&day<=LAST&&day<=record.today;}
function status(day){
 const info=dayInfo(day);
 if(!allowed(day))return 'disabled';
 if(!info||!info.active)return 'unknown';
 if(info.approved>=20)return 'achieved';
 if(info.pending>0)return 'pending';
 return 'below';
}
function image(person){
 const pic=person.avatarData;
 return typeof pic==='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(pic)?
 '<img src="'+esc(pic)+'" alt="Foto de '+esc(person.codename)+'">':
 '<span>'+esc(person.codename.slice(0,2).toUpperCase())+'</span>';
}
function card(k,v,desc){return '<div class="perf-stat"><small>'+esc(k)+'</small><strong>'+esc(v)+'</strong><span>'+esc(desc)+'</span></div>';}
function svgChart(title,subtitle,bars,unit='%',height=172){
 // Static SVG with labels and a live route link outside. No graph library or remote CDN.
 const data=bars.map(x=>({name:String(x.name),value:Number(x.value)||0,marked:x.marked!==false}));
 const max=Math.max(20,...data.map(x=>x.value));
 const width=Math.max(680,data.length*50+70),left=40,right=width-20,bottom=height-28,top=20;
 const plot=bottom-top;
 const grid=[0,.25,.5,.75,1].map(f=>{
  const y=bottom-plot*f;return '<line x1="'+left+'" y1="'+y+'" x2="'+right+'" y2="'+y+'" class="perf-chart-grid"/>'+
   '<text x="4" y="'+(y+3)+'" class="perf-axis">'+Math.round(max*f)+'</text>';
 }).join('');
 const step=(right-left)/Math.max(1,data.length);
 const plotted=data.map((x,i)=>{
  const cx=left+step*(i+.5),h=plot*(x.value/max),y=bottom-h;
  return '<rect x="'+(cx-step*.32)+'" y="'+y+'" width="'+step*.64+'" height="'+Math.max(1,h)+'" rx="3" class="'+(x.marked?'perf-bar':'perf-bar dim')+'">'+
    '<title>'+esc(x.name)+': '+x.value+unit+'</title></rect>'+
    '<text x="'+cx+'" y="'+(bottom+17)+'" text-anchor="middle" class="perf-axis">'+esc(x.name)+'</text>';
 }).join('');
 return '<article class="perf-graph"><div class="perf-panel-head"><h3>'+esc(title)+'</h3><small>'+esc(subtitle)+'</small></div>'+
  '<div class="perf-chart-scroll"><svg viewBox="0 0 '+width+' '+height+'" role="img" aria-label="'+esc(title)+'">'+grid+plotted+'</svg></div></article>';
}
function monthRows(){
 const rows=[];const len=monthLength(year,month);
 for(let d=1;d<=len;d++){
  const day=dateStr(year,month,d);
  const item=dayInfo(day);
  rows.push({name:String(d).padStart(2,'0'),value:item?.approved||0,marked:!!item?.active});
 }
 return rows;
}
function weeklyRows(){
 const points=new Map();
 for(const item of record.days){
  if(item.day.slice(0,7)!==dateStr(year,month,1).slice(0,7))continue;
  const day=Number(item.day.slice(-2)),key=weekIndex(year,month,day);
  const old=points.get(key)||{approved:0,marked:false};
  old.approved+=item.approved;old.marked=old.marked||item.active;points.set(key,old);
 }
 const weeks=weekIndex(year,month,monthLength(year,month))+1;
 return Array.from({length:weeks},(_,i)=>({name:'Sem '+(i+1),value:points.get(i)?.approved||0,marked:points.get(i)?.marked||false}));
}
function yearlyRows(){
 return Array.from({length:12},(_,m)=>{
  const current=record.days.filter(d=>Number(d.day.slice(5,7))===m+1);
  return {name:MONTHS[m].slice(0,3),value:total(current,'approved'),marked:current.some(d=>d.active)};
 });
}
function calendar(){
 const first=(new Date(Date.UTC(year,month,1)).getUTCDay()+6)%7;
 let dayBoxes=Array.from({length:first},()=>'<span class="perf-empty" aria-hidden="true"></span>').join('');
 for(let i=1;i<=monthLength(year,month);i++){
  const day=dateStr(year,month,i),r=dayInfo(day),kind=status(day);
  const desc=kind==='achieved'?'Meta atingida':kind==='below'?'Abaixo da meta':kind==='pending'?'Entrega pendente':kind==='disabled'?'Fora do período':'Sem atividade registrada';
  dayBoxes+='<button type="button" class="perf-day '+kind+(selectedDay===day?' selected':'')+'" data-perf-day="'+day+'" '+
   (kind==='disabled'?'disabled':'')+' title="'+esc(shortDate(day)+' · '+desc)+'" aria-label="'+esc(shortDate(day)+' '+desc)+'">'+
   '<b>'+i+'</b>'+(r?.active?'<small>'+r.approved+'%</small>':'<small>·</small>')+'</button>';
 }
 return '<section class="perf-panel"><div class="perf-panel-head"><h3>Calendário de atividade</h3><small>Meta: 20% por dia ativo</small></div>'+
 '<div class="perf-calendar-top"><button id="perf-prev" '+(year===2026&&month===10?'disabled':'')+' aria-label="Mês anterior">‹</button>'+
 '<strong>'+MONTHS[month]+' de '+year+'</strong><button id="perf-next" '+(year===2030&&month===11?'disabled':'')+' aria-label="Próximo mês">›</button></div>'+
 '<div class="perf-weekdays">'+DOW.map(x=>'<span>'+x+'</span>').join('')+'</div>'+
 '<div class="perf-calendar">'+dayBoxes+'</div>'+
 '<div class="perf-legend"><span><i class="achieved"></i>Meta atingida</span><span><i class="below"></i>Abaixo de 20%</span>'+
 '<span><i class="pending"></i>Pendente</span><span><i class="unknown"></i>Sem atividade</span></div>'+
 '<div id="perf-day-details">'+dayDetail()+'</div></section>';
}
function dayDetail(){
 const day=selectedDay||dateStr(year,month,1),r=dayInfo(day);
 const show=allowed(day);
 if(!show)return '<p class="perf-day-info">Data futura ou fora do período de análise. Nenhum dado previsto.</p>';
 return '<div class="perf-day-info"><div><small>DIA SELECIONADO</small><strong>'+shortDate(day)+'</strong></div>'+
 '<div><small>APROVADO</small><strong>'+(r?.approved||0)+'%</strong></div>'+
 '<div><small>PENDENTE</small><strong>'+(r?.pending||0)+'%</strong></div>'+
 '<div><small>ATIVIDADE</small><strong>'+(r?.active?'Registrada':'Não registrada')+'</strong></div>'+
 '<button id="perf-go-logs">Ver entregas</button></div>';
}
function renderView(){
 if(!record||!valid())return;
 const p=record.person,s=record.summary;
 const title=esc(p.codename),years=[2026,2027,2028,2029,2030];
 const root=document.getElementById('view');
 root.innerHTML='<section class="perf-shell"><div class="perf-top"><button id="perf-back">‹ Voltar aos integrantes</button><span>MAFIACORP / ANÁLISE DE DESEMPENHO</span></div>'+
 '<div class="perf-identity"><div class="perf-photo">'+image(p)+'</div><div><small>RELATÓRIO INDIVIDUAL</small><h1>'+title+'</h1>'+
 '<p>'+esc(p.name)+' · '+esc(p.roleLabel||'Integrante')+'</p></div><div class="perf-range">HISTÓRICO DISPONÍVEL<br><strong>01/11/2026 · 31/12/2030</strong></div></div>'+
 '<div class="perf-controls"><label>Ano<select id="perf-year">'+years.map(y=>'<option value="'+y+'" '+(y===year?'selected':'')+'>'+y+'</option>').join('')+'</select></label>'+
 '<label>Mês<select id="perf-month">'+MONTHS.map((m,i)=>'<option value="'+i+'" '+(i===month?'selected':'')+' '+(year===2026&&i<10?'disabled':'')+'>'+m+'</option>').join('')+'</select></label>'+
 '<div class="perf-description">Não registrado ≠ falta. A análise usa somente atividade e missões que existem no banco.</div></div>'+
 '<div class="perf-stats">'+card('PONTOS APROVADOS',s.approved+'%','Total no ano selecionado')+
 card('DIAS ATIVOS',s.activeDays,'Marcados no QG')+
 card('DIAS COM META CUMPRIDA',s.goalDays,s.completionRate===null?'Sem base para taxa':s.completionRate+'% dos dias ativos')+
 card('MÉDIA POR DIA ATIVO',s.meanApproved===null?'—':s.meanApproved+'%','Meta individual: 20%')+'</div>'+
 '<div class="perf-layout"><div>'+calendar()+'</div><div class="perf-graph-stack">'+
 svgChart('Desempenho mensal','Pontos aprovados por mês no ano '+year,yearlyRows())+
 svgChart('Desempenho semanal','Soma das aprovações por semana de '+MONTHS[month],weeklyRows())+
 svgChart('Desempenho diário','Cada barra corresponde a um dia do mês',monthRows())+'</div></div>'+
 '<p class="perf-note">As barras exibem pontos de metas aprovados. Dias sem atividade registrada não são tratados como desempenho zero. Entregas pendentes não entram no total aprovado. Meses futuros permanecem sem projeções.</p></section>';
 wire();
}
function switchMonth(nextYear,nextMonth){
 if(nextYear<2026||nextYear>2030)return;
 if(nextYear===2026&&nextMonth<10)return;
 if(nextYear===2030&&nextMonth>11)return;
 if(nextMonth<0){nextYear--;nextMonth=11;}
 if(nextMonth>11){nextYear++;nextMonth=0;}
 if(nextYear<2026||nextYear>2030)return;
 const yearChanged=year!==nextYear;
 year=nextYear;month=nextMonth;selectedDay=dateStr(year,month,1);
 if(yearChanged)reload();else renderView();
}
function wire(){
 const yearNode=document.getElementById('perf-year'),monthNode=document.getElementById('perf-month');
 yearNode?.addEventListener('change',()=>switchMonth(Number(yearNode.value),Math.max(Number(monthNode?.value||0),Number(yearNode.value)===2026?10:0)));
 monthNode?.addEventListener('change',()=>switchMonth(year,Number(monthNode.value)));
 document.getElementById('perf-prev')?.addEventListener('click',()=>switchMonth(year,month-1));
 document.getElementById('perf-next')?.addEventListener('click',()=>switchMonth(year,month+1));
 document.getElementById('perf-back')?.addEventListener('click',()=>ctx.navigate('roster'));
 document.querySelectorAll('[data-perf-day]').forEach(b=>b.addEventListener('click',()=>{
  selectedDay=b.dataset.perfDay;
  document.querySelectorAll('[data-perf-day]').forEach(el=>el.classList.toggle('selected',el===b));
  document.getElementById('perf-day-details').innerHTML=dayDetail();
  document.getElementById('perf-go-logs')?.addEventListener('click',openLogs);
 }));
 document.getElementById('perf-go-logs')?.addEventListener('click',openLogs);
}
function openLogs(){
 if(selectedDay&&allowed(selectedDay))ctx.navigate('contribuicoes',{memberId:record.person.id,date:selectedDay});
}
async function reload(){
 const serial=++requestId;
 const root=document.getElementById('view');if(!root)return;
 root.innerHTML='<div class="perf-shell"><p class="perf-wait">Carregando histórico de '+year+'...</p></div>';
 try{
  const res=await fetch('/api/performance?accountId='+encodeURIComponent(ctx.memberId)+'&year='+year,{credentials:'same-origin',cache:'no-store'});
  const response=await res.json().catch(()=>({error:'SERVICE_UNAVAILABLE'}));
  if(!res.ok)throw Error(response.error==='FORBIDDEN'?'Sem permissão para consultar este desempenho.':
   response.error==='ACCOUNT_NOT_FOUND'?'Integrante não encontrado.':'O histórico não está disponível agora.');
  if(serial!==requestId||!valid())return;
  record=response;
  if(!selectedDay||!selectedDay.startsWith(String(year)))selectedDay=dateStr(year,month,1);
  renderView();
 }catch(err){if(serial===requestId&&valid())root.innerHTML='<section class="perf-shell"><h2>Desempenho</h2><p class="perf-error">'+esc(err.message)+'</p><button id="perf-back">Voltar</button></section>';document.getElementById('perf-back')?.addEventListener('click',()=>ctx.navigate('roster'));}
}
function render(context,params={}){
 ctx={...context,memberId:params.memberId||context.currentUser?.id};
 record=null;selectedDay='';
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date());
 year=Math.max(2026,Math.min(2030,Number(params.year||today.slice(0,4))));
 month=year===2026?Math.max(10,Number(params.month??Number(today.slice(5,7))-1)):Number(params.month??Number(today.slice(5,7))-1);
 month=Math.max(0,Math.min(11,month));
 reload();
}
window.MafiaPerformance={render};
})();