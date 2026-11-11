-- 005: cargos persistidos, administrador permanente e foto do perfil
CREATE TABLE IF NOT EXISTS public.mc_org_roles (
  code varchar(32) PRIMARY KEY,
  label varchar(80) NOT NULL,
  section varchar(60) NOT NULL DEFAULT 'Setores',
  access_percent smallint NOT NULL DEFAULT 25 CHECK (access_percent BETWEEN 0 AND 100),
  summary varchar(500) NOT NULL DEFAULT '',
  allowed_views jsonb NOT NULL DEFAULT '["dashboard","hierarquia","roster","contribuicoes","perfil"]'::jsonb CHECK (jsonb_typeof(allowed_views)='array'),
  can_view_all boolean NOT NULL DEFAULT false,
  can_review boolean NOT NULL DEFAULT false,
  can_manage_panel boolean NOT NULL DEFAULT false,
  can_submit boolean NOT NULL DEFAULT true,
  is_builtin boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.mc_accounts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.mc_org_roles
(code,label,section,access_percent,summary,allowed_views,can_view_all,can_review,can_manage_panel,can_submit,is_builtin)
VALUES
('admin_sistema','Administrador do Sistema','Administração',100,'Administrar o MafiaCorp sem ocupar qualquer cargo da organização RP.','["dashboard","hierarquia","contribuicoes","roster","rp-members","rp-missions","rp-goals","rp-map","rp-locations","rp-network","infographics","rp-backup","investigations","suspects","vehicles","addresses","contacts","associates","factions","evidence","operations","team","admin","reports","connections","audit","cleanup-local"]'::jsonb,true,true,true,false,true),
('lider_01','Liderança 01','Comando Superior',100,'Diretrizes, decisões finais, supervisão geral, promoções e conflitos internos.','["dashboard","hierarquia","contribuicoes","roster","rp-members","rp-missions","rp-goals","rp-map","rp-locations","rp-network","infographics","rp-backup","investigations","suspects","vehicles","addresses","contacts","associates","factions","evidence","operations","team","admin","reports","connections","audit","cleanup-local"]'::jsonb,true,true,true,true,true),
('lider_02','Liderança 02','Comando Superior',100,'Objetivos estratégicos, decisões da liderança, avaliação e promoções.','["dashboard","hierarquia","contribuicoes","roster","rp-members","rp-missions","rp-goals","rp-map","rp-locations","rp-network","infographics","rp-backup","investigations","suspects","vehicles","addresses","contacts","associates","factions","evidence","operations","team","admin","reports","connections","audit","cleanup-local"]'::jsonb,true,true,true,true,true),
('lider_03','Liderança 03','Comando Superior',100,'Diretrizes, decisões da liderança, avaliação e resolução interna.','["dashboard","hierarquia","contribuicoes","roster","rp-members","rp-missions","rp-goals","rp-map","rp-locations","rp-network","infographics","rp-backup","investigations","suspects","vehicles","addresses","contacts","associates","factions","evidence","operations","team","admin","reports","connections","audit","cleanup-local"]'::jsonb,true,true,true,true,true),
('gerente_geral','Gerente Geral','Supervisão',90,'Supervisionar setores, metas, resultados, reuniões semanais e comunicação.','["dashboard","hierarquia","contribuicoes","roster","rp-members","rp-missions","rp-goals","rp-map","rp-locations","rp-network","infographics","investigations","suspects","vehicles","addresses","contacts","associates","factions","evidence","operations","team","reports","connections","audit"]'::jsonb,true,true,true,true,true),
('gerente_farm','Gerente de Farm','Produção e QG',65,'Metas de 20%, missões do QG e do Noia, evolução, produção e estoque.','["dashboard","hierarquia","contribuicoes","roster","rp-members","rp-missions","rp-goals","rp-locations","rp-map","vehicles","reports"]'::jsonb,true,true,false,true,true),
('gerente_acao','Gerente de Ação','Ações',65,'Coordenação da Elite, ações e dominações RP, treinamentos e avaliações.','["dashboard","hierarquia","contribuicoes","roster","rp-members","rp-missions","rp-goals","rp-map","operations","infographics","reports"]'::jsonb,false,false,false,true,true),
('estrategista','Estrategista / Inteligência','Ações',60,'Planejar operações RP, levantar informações e apoiar o Gerente de Ação.','["dashboard","hierarquia","contribuicoes","roster","rp-missions","rp-map","infographics","investigations","suspects","factions","reports"]'::jsonb,false,false,false,true,true),
('logistica','Logística','Apoio',55,'Organizar recursos, preparação e disponibilidade de materiais e equipamentos RP.','["dashboard","hierarquia","contribuicoes","roster","rp-missions","rp-locations","rp-map","vehicles","addresses","rp-goals"]'::jsonb,false,false,false,true,true),
('elite','Elite / Operadores','Equipe Especializada',40,'Participar dos treinamentos e ações, apoiar o Gerente de Ação e orientar integrantes.','["dashboard","hierarquia","contribuicoes","roster","rp-missions","rp-goals","rp-map"]'::jsonb,false,false,false,true,true),
('membro','Membro / Integrante','Integrantes',25,'Cumprir metas diárias quando ativo, participar das atividades e respeitar a hierarquia.','["dashboard","hierarquia","contribuicoes","roster","rp-goals"]'::jsonb,false,false,false,true,true)
ON CONFLICT (code) DO NOTHING;
ALTER TABLE public.mc_accounts ADD COLUMN IF NOT EXISTS is_system_admin boolean NOT NULL DEFAULT false;
ALTER TABLE public.mc_accounts ADD COLUMN IF NOT EXISTS avatar_data text;
ALTER TABLE public.mc_accounts ADD CONSTRAINT mc_accounts_avatar_valid CHECK (char_length(avatar_data) <= 90000);
UPDATE public.mc_accounts SET is_system_admin=true,updated_at=now()
 WHERE codename_normalized='luc' AND role='admin' AND org_role='admin_sistema';
CREATE UNIQUE INDEX IF NOT EXISTS mc_one_system_admin ON public.mc_accounts(is_system_admin) WHERE is_system_admin=true;
ALTER TABLE public.mc_accounts DROP CONSTRAINT mc_accounts_org_role_valid;
ALTER TABLE public.mc_accounts ADD CONSTRAINT mc_accounts_org_role_fk FOREIGN KEY (org_role) REFERENCES public.mc_org_roles(code);
