# Roadmap após a auditoria

Este plano não foi executado. A ordem é intencional: primeiro tornar a base compilável e segura; depois ampliar funcionalidades.

## Implementado e testado localmente

- **Fase 1B — tenancy municipal:** `citizen_profiles.municipality_id` canônico, onboarding de vínculo único, RLS de perfil endurecida, criação de ocorrência com tenant/owner derivados, RPCs municipais e mapa sanitizado.
- **Fase 1C — prova de segurança:** migrations aplicadas do zero em Supabase local e matriz RLS A/B reproduzível em `supabase/tests/phase_1c_tenancy_rls.sql`.
- **Isolamento de conteúdo:** feed/eventos não têm leitura direta; RPCs autenticadas derivam o tenant do profile e o caminho público requer contexto municipal explícito.

## Já implementado

- Shell TanStack Start, rotas da home, protocolos e jornadas.
- Design system e componentes de home responsivos.
- Contexto de sessão no browser e React Query no root.
- Migration que propõe municípios, perfis, protocolos, ocorrências, mídia, confirmação, feed/eventos, buckets, triggers, RLS e RPCs.
- Criação de ocorrência com protocolo emitido pelo banco e upload privado opcional.
- Consulta de protocolos e ocorrências com intenção de ownership por cidadão.
- GPS, geocoding, clima e Mapbox integrados no cliente.

## Parcial

- **Autenticação:** provider existe, mas não há rota/UI de login; o menu não usa logout real.
- **Perfil:** service e tabela existem, mas a UI usa `localStorage`; há divergência `avatar_url`/`avatar_path`.
- **Ocorrências:** fluxo de formulário, RPC e upload existem; prioridade e órgão deixaram de ser controlados pelo cliente. O ciclo de vida transacional de mídia continua pendente.
- **Protocolos:** lista de protocolos próprios existe; documentos, agendamentos, histórico e notificações são somente estruturas visuais.
- **Mapa:** localização e boundary são reais; ocorrências municipais vêm de RPC sanitizada e tenant-scoped.
- **Prefeitura conectada:** modelagem de feed/eventos existe; a UI ainda não os busca.
- **Multi-município:** vínculo municipal canônico único, criação de ocorrência derivada no banco e isolamento de conteúdo municipal foram implementados. Não há memberships nem fluxo administrativo de troca nesta etapa.

## Não iniciado

- Fluxo completo de cadastro/login, recuperação de sessão e logout da interface.
- Fonte de verdade de perfil, seleção/validação de município e avatar em Storage.
- Back-office e permissões para publicação municipal e atualização de status.
- Feed municipal anonimizado/seguro e regras de confirmação compatíveis com ele.
- Serviços reais das jornadas, documentos, agendamentos, notificações e timeline.
- Testes unitários e end-to-end; a prova local de integração Supabase/RLS já existe.
- Política de privacidade/consentimento para GPS e provedores de geocoding/clima/mapa.
- Observabilidade de erros, auditoria operacional e rate limit/antispam para ocorrências.

## Bloqueado

- A validação remota continua fora de escopo; a cobertura de tenancy/RLS foi comprovada exclusivamente em banco local.

## Próxima etapa exata

1. Separar artefatos históricos e revisar a fonte de verdade dos clients/auth sem reescrever histórico publicado.
2. Cobrir autenticação HTTP real, Storage privado e ciclo de vida de mídia no Supabase local.
3. Conectar feed/eventos aos contratos municipais já validados e construir o futuro contexto público por rota/slug.
4. Definir back-office, triagem e fluxo administrativo auditável para alterações futuras de município e status.
5. Adicionar schemas de entrada, antispam/rate-limit, observabilidade e testes end-to-end.
