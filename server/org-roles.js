// MafiaCorp • única fonte para cargos, responsabilidades e autorização de dados centrais.
export const ROLE_DEFS={
 admin_sistema:{label:'Administrador do Sistema',section:'Administração',access:100,summary:'Administrar o MafiaCorp sem ocupar qualquer cargo da organização RP.'},
 lider_01:{label:'Liderança 01',section:'Comando Superior',access:100,summary:'Diretrizes, decisões finais, supervisão geral, promoções e conflitos internos.'},
 lider_02:{label:'Liderança 02',section:'Comando Superior',access:100,summary:'Objetivos estratégicos, decisões da liderança, avaliação e promoções.'},
 lider_03:{label:'Liderança 03',section:'Comando Superior',access:100,summary:'Diretrizes, decisões da liderança, avaliação e resolução interna.'},
 gerente_geral:{label:'Gerente Geral',section:'Supervisão',access:90,summary:'Supervisionar setores, metas, resultados, reuniões semanais e comunicação.'},
 gerente_farm:{label:'Gerente de Farm',section:'Produção e QG',access:65,summary:'Metas de 20%, missões do QG e do Noia, evolução, produção e estoque.'},
 gerente_acao:{label:'Gerente de Ação',section:'Ações',access:65,summary:'Coordenação da Elite, ações e dominações RP, treinamentos e avaliações.'},
 estrategista:{label:'Estrategista / Inteligência',section:'Ações',access:60,summary:'Planejar operações RP, levantar informações e apoiar o Gerente de Ação.'},
 logistica:{label:'Logística',section:'Apoio',access:55,summary:'Organizar recursos, preparação e disponibilidade de materiais e equipamentos RP.'},
 elite:{label:'Elite / Operadores',section:'Equipe Especializada',access:40,summary:'Participar dos treinamentos e ações, apoiar o Gerente de Ação e orientar integrantes.'},
 membro:{label:'Membro / Integrante',section:'Integrantes',access:25,summary:'Cumprir metas diárias quando ativo, participar das atividades e respeitar a hierarquia.'}
};
export const MISSION_POINTS={aeronave:10,caminhao:5,submarino:5,cargueiro:5};
export const MISSION_LABELS={aeronave:'Aeronave',caminhao:'Caminhão',submarino:'Submarino',cargueiro:'Cargueiro'};
const FULL=['dashboard','hierarquia','contribuicoes','roster','rp-members','rp-missions','rp-goals','rp-map','rp-locations','rp-network','infographics','rp-backup','investigations','suspects','vehicles','addresses','contacts','associates','factions','evidence','operations','team','admin','reports','connections','audit','cleanup-local'];
const COMMON=['dashboard','hierarquia','contribuicoes','roster'];
const views={
 admin_sistema:FULL,
 lider_01:FULL,lider_02:FULL,lider_03:FULL,
 gerente_geral:FULL.filter(x=>!['admin','cleanup-local','rp-backup'].includes(x)),
 gerente_farm:[...COMMON,'rp-members','rp-missions','rp-goals','rp-locations','rp-map','vehicles','reports'],
 gerente_acao:[...COMMON,'rp-members','rp-missions','rp-goals','rp-map','operations','infographics','reports'],
 estrategista:[...COMMON,'rp-missions','rp-map','infographics','investigations','suspects','factions','reports'],
 logistica:[...COMMON,'rp-missions','rp-locations','rp-map','vehicles','addresses','rp-goals'],
 elite:[...COMMON,'rp-missions','rp-goals','rp-map'],
 membro:[...COMMON,'rp-goals']
};
export const LEADERS=new Set(['lider_01','lider_02','lider_03']);
export const ADMINS=new Set(['admin_sistema','lider_01','lider_02','lider_03']);
export const ROLE_KEYS=Object.keys(ROLE_DEFS);
export function orgRole(user){const key=typeof user==='string'?user:user?.org_role||user?.orgRole;return ROLE_DEFS[key]?key:'membro';}
export function platformRoleFor(key){
 if(ADMINS.has(key))return 'admin';
 if(key==='gerente_geral')return 'chefe';
 if(['gerente_farm','gerente_acao','estrategista','logistica'].includes(key))return 'investigador';
 return 'observador';
}
export function permissionsFor(user){
 const role=orgRole(user),def=ROLE_DEFS[role];
 return {orgRole:role,label:def.label,section:def.section,accessPercent:def.access,description:def.summary,
   views:views[role],canViewAll:ADMINS.has(role)||['gerente_geral','gerente_farm'].includes(role),
   canReview:ADMINS.has(role)||['gerente_geral','gerente_farm'].includes(role),
   canManagePanel:ADMINS.has(role)||role==='gerente_geral',
   canAssignRoles:ADMINS.has(role),
   canManageAccounts:ADMINS.has(role),
   canSubmit:role!=='admin_sistema'};
}
export function permission(user,key){return Boolean(permissionsFor(user)[key]);}
export function businessDate(){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
