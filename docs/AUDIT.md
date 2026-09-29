# Auditoria — `feat/cityos-real-data`

Data: 2026-09-29

> As seções abaixo preservam a auditoria inicial, feita antes das Fases 1A e 1B. A atualização baseada em execução local real vem primeiro e substitui os achados que ela cobre.

## Atualização comprovada — Fases 1B e 1C

- A migration base e a migration forward-only de hardening foram aplicadas em banco Supabase local limpo, nessa ordem.
- A prova local A/B em `supabase/tests/phase_1c_tenancy_rls.sql` passou integralmente e fez rollback das fixtures.
- A prova confirmou RLS de ownership para perfis, protocolos e ocorrências; vínculo municipal único; derivação de cidadão/tenant; isolamento de feed/eventos; e projeção municipal sanitizada do mapa.
- A prova encontrou e corrigiu uma ambiguidade de `RETURNING` na RPC `create_occurrence`. O banco foi resetado e todos os testes passaram após a correção.
- `npm run typecheck`, `npm run lint`, `npm run build` e `git diff --check` foram reexecutados após a correção; os resultados detalhados estão em `docs/SECURITY.md`.
- Não houve aplicação de migration, consulta ou mutação no Supabase remoto; não houve commit ou push.
Escopo: leitura do código, diff staged, migration e verificações locais. Nenhuma migration remota, alteração de ambiente, commit, push ou correção foi executada.

## Estado verificado

- Branch: `feat/cityos-real-data` (acompanha `origin/feat/cityos-real-data`).
- Há 23 entradas staged preexistentes, preservadas durante esta auditoria.
- `npm run lint`: passou.
- `npx tsc --noEmit`: falhou com 11 erros.
- `npm run build`: passou, mas não realiza type-check; portanto não contradiz a falha do TypeScript.

## Classificação do conteúdo staged

| Grupo staged | Avaliação |
| --- | --- |
| `supabase/migrations/20260902204241_cityos_real_data_foundation.sql`, `src/types/database.ts` | Pertence ao objetivo: define a fundação de dados. Não está pronto para aplicar até resolver os achados de contrato e tenancy. |
| `src/services/citizen.ts`, `src/services/occurrences.ts`, `src/features/auth/useCitizen.ts`, `src/features/protocols/useProtocols.ts` | Pertence ao objetivo de dados reais, mas `useCitizen` e o service de cidadão estão incoerentes e quebram o type-check. |
| `src/features/occurrences/{NewOccurrenceDialog,OccurrenceFeed,store,types,utils}.ts*`, remoção de `demo.ts`, `src/features/city/CityLive.tsx`, `src/features/protocols/ProtocolsOverview.tsx` | Pertence à troca de mocks por dados reais. A remoção do demo é coerente; o mapa/feed ainda não atende à semântica municipal anunciada. |
| `src/features/auth/AuthProvider.tsx`, `src/lib/supabase.ts`, `src/lib/supabase-server.ts` | Pertence à integração Supabase, mas a versão staged atual introduz regressões de case, tipo e nulabilidade. Precisa revisão antes de integrar. |
| `.gitignore` | Alteração legítima: ignora `supabase/.temp/`. |
| `src/routes/__root.tsx` | Apenas remove comentário; é incidental, sem efeito funcional para a feature. |
| `-`, `src/features/auth/AuthProvider.tsx.bak`, `src/lib/supabase.ts.bak`, `src/lib/supabase-server.ts.bak` | Não pertencem ao produto: são artefatos não referenciados. Os `.bak` parecem cópias de tentativa anterior; o arquivo `-` é vazio. Preservados nesta auditoria. |

## Resumo de segurança

- **Autenticação**: o `AuthProvider` lê a sessão do cliente Supabase e reage a mudanças de sessão. Não há rota ou interface de login/cadastro. O botão de sair da UI não chama `signOut`.
- **Autorização**: a migration restringe leitura de perfis, protocolos, ocorrências e mídia ao `auth.uid()` proprietário; as RPCs derivam o cidadão autenticado no banco. Isso é uma boa base, mas ainda há falhas de integridade e fluxos não consumidos pela aplicação.
- **Multi-tenancy**: o schema contém `municipality_id` em perfis, protocolos, ocorrências, feed e eventos. Porém não há regra de associação validada e o feed/eventos publicados são legíveis sem filtro por município. Logo, o isolamento municipal ainda não está implementado de forma adequada.
- **Segredos/service role**: não há referência no código a service role ou chave secreta; somente URL e publishable key `VITE_*`. Isto não confirma a configuração remota, que não foi acessada.

## Achados

### CRITICAL — A branch não passa no type-check

- **Evidência:** `npx tsc --noEmit` reporta imports `@Supabase/...` com capitalização divergente, acesso a `supabase` potencialmente nulo, duas funções inexistentes em `services/citizen`, rota inexistente `/auth`, acessos incompatíveis a index signatures e `mimeType: undefined` incompatível com `exactOptionalPropertyTypes`.
- **Arquivos:** `src/features/auth/AuthProvider.tsx:10,38`, `src/features/auth/useCitizen.ts:5-6`, `src/features/occurrences/OccurrenceFeed.tsx:60`, `src/lib/supabase.ts`, `src/lib/supabase-server.ts`, `src/services/citizen.ts`, `src/services/occurrences.ts`.
- **Impacto:** não há garantia estática de integridade e a rota de login é inválida. Em filesystem case-sensitive, `@Supabase/*` também impede a resolução do módulo.
- **Recomendação:** restaurar uma única API tipada para o client Supabase, alinhar nomes exportados/importados, implementar ou remover o destino `/auth`, e deixar o type-check verde antes de testar integrações.
- **Bloqueia produção:** sim.

### CRITICAL — Contrato de perfil divergente entre SQL, tipos e service

- **Evidência:** a migration cria `citizen_profiles.avatar_path` (`supabase/migrations/20260902204241_cityos_real_data_foundation.sql:18-31`) e `src/types/database.ts:19-21` o espelha; `src/services/citizen.ts:7,94` usa `avatar_url`.
- **Impacto:** em um banco novo da migration, a atualização de perfil enviada pelo service referencia uma coluna inexistente. A remoção do tipo `Database` do client browser reduz a chance de detectar isso antes de executar.
- **Recomendação:** definir um contrato único gerado a partir do schema aplicado, corrigir o nome da coluna em todos os consumidores e cobrir leitura/atualização com teste de integração.
- **Bloqueia produção:** sim para perfil real e para a promessa de persistência do cidadão.

### HIGH — Feed e eventos publicados vazam entre municípios

- **Evidência:** `city_feed` e `city_events` possuem `municipality_id`, mas suas policies de leitura só testam publicação/data (`supabase/migrations/20260902204241_cityos_real_data_foundation.sql:445-459`). O grant inclui `anon` (`:374`).
- **Impacto:** qualquer cliente pode consultar publicações de todos os municípios, contrariando o contexto municipal prometido pelo produto. Não expõe protocolos de cidadãos, mas rompe o isolamento de conteúdo tenant-scoped.
- **Recomendação:** definir explicitamente se conteúdo é global. Caso seja municipal, expor uma consulta/RPC que receba apenas o município de contexto validado no servidor e aplique o filtro de `municipality_id`; não confiar no filtro enviado pelo browser.
- **Bloqueia produção:** sim para lançamento multi-município com conteúdo segregado.

### HIGH — Qualquer cidadão pode se associar a qualquer município ativo

- **Evidência:** a policy de update do próprio perfil só impõe `id = auth.uid()` (`supabase/migrations/20260902204241_cityos_real_data_foundation.sql:391-395`). A RPC usa `citizen_profiles.municipality_id` como destino e só verifica se o município está ativo (`:260-274`).
- **Impacto:** um usuário autenticado pode alterar diretamente seu `municipality_id` para qualquer município ativo e abrir ocorrências/protocolos nele. Não há critério de residência, convite, vínculo ou auditoria de troca.
- **Recomendação:** modelar vínculo/membership municipal ou uma seleção de município com regra explícita, validação no banco e trilha de auditoria; fazer a RPC derivar o município dessa fonte.
- **Bloqueia produção:** sim para operações municipais que dependam de pertencimento confiável.

### HIGH — Jornada de autenticação está incompleta e a UI ainda usa perfil local

- **Evidência:** não existe rota `/auth`; `OccurrenceFeed` navega para ela (`src/features/occurrences/OccurrenceFeed.tsx:60`). `CitizenHeader` persiste nome/foto em `localStorage` (`:49-104`), e o menu registra apenas `console.log("Logout solicitado")` (`src/components/citizen/CitizenProfileMenu.tsx:257`).
- **Impacto:** usuário não autenticado não consegue iniciar a sessão pelo fluxo apresentado; perfil e logout não representam o estado Supabase. A sessão real não é uma fonte de verdade da interface de perfil.
- **Recomendação:** implementar as telas e callbacks de autenticação, conectar perfil ao service validado e remover a persistência local como fonte de verdade.
- **Bloqueia produção:** sim para o portal autenticado.

### HIGH — Mapa “da cidade” e confirmações não correspondem ao modelo de acesso

- **Evidência:** a policy de ocorrências permite apenas `citizen_id = auth.uid()` (`supabase/migrations/20260902204241_cityos_real_data_foundation.sql:402-405`). `CityLive` entrega essa mesma query ao mapa, embora anuncie ocorrências municipais; o botão de confirmação está na lista “Minhas ocorrências”.
- **Impacto:** o mapa não é uma visão municipal e a confirmação só alcança os próprios registros do cidadão. Isso produz uma semântica de produto enganosa e não sustenta confirmação comunitária.
- **Recomendação:** decidir entre feed privado e feed municipal anonimizado. Para o segundo, criar uma view/RPC com campos mínimos, filtro municipal e política própria; manter detalhes e mídia privados.
- **Bloqueia produção:** sim para o recurso divulgado como mapa/feed municipal.

### HIGH — A classificação operacional pode ser manipulada pelo cliente

- **Evidência:** `create_occurrence` aceita `p_priority` e `p_agency` do cliente (`supabase/migrations/20260902204241_cityos_real_data_foundation.sql:213-222,253,295`); `src/services/occurrences.ts:242-251` os envia após uma classificação no browser.
- **Impacto:** um cliente autenticado pode chamar a RPC diretamente com prioridade `critical`, órgão e tipo arbitrários dentro dos poucos checks existentes. Isso afeta triagem e indicadores operacionais.
- **Recomendação:** manter catálogo/classificação no banco ou em back-office confiável, validar `type_id`, derivar agência/prioridade no servidor e validar faixa de coordenadas e tamanhos/campos textuais.
- **Bloqueia produção:** sim caso a prioridade alimente atendimento real.

### MEDIUM — Dados municipais reais ainda não chegam à interface

- **Evidência:** `city_feed` e `city_events` existem no schema/tipos, mas não há service/hook que os consuma. `ConnectedCityHall` sempre mostra “Nenhuma publicação disponível”. Jornadas, ações rápidas e assistente direcionam majoritariamente para páginas de placeholder.
- **Impacto:** a base de banco não se traduz no produto que a home apresenta; há componentes de estrutura, mas não fluxos de serviço implementados.
- **Recomendação:** depois de resolver as falhas críticas, conectar cada superfície a um contrato real com loading/empty/error por município.
- **Bloqueia produção:** não para uma base técnica; sim para as funcionalidades anunciadas na home.

### MEDIUM — Geolocalização e dados pessoais são tratados de forma fragmentada

- **Evidência:** `CitizenHeader` e `CityLive` instanciam separadamente `useCityContext`, gerando ciclos independentes de GPS/geocoding. Nome e foto são salvos no browser; foto pode chegar a 10 MB antes de ser escrita em `localStorage`.
- **Impacto:** prompts/requisições redundantes, contexto divergente e possível erro de quota. Coordenadas são enviadas a BigDataCloud, Open-Meteo, Nominatim e Mapbox quando usados, sem uma camada central de consentimento/privacidade.
- **Recomendação:** elevar contexto de cidade para provider único, exibir consentimento e política de terceiros, e usar o bucket privado de avatar com validação em vez de data URL em storage local.
- **Bloqueia produção:** não, mas deve ser resolvido antes de tratar localização como dado confiável.

### MEDIUM — Upload e confirmação carecem de tratamento completo de ciclo de vida

- **Evidência:** `URL.createObjectURL` é criado sem `URL.revokeObjectURL` (`src/features/occurrences/NewOccurrenceDialog.tsx:102`); uma ocorrência pode ser criada mesmo que a mídia falhe; o botão de confirmação não exibe erro e a mutation ignora o contador retornado pela RPC.
- **Impacto:** vazamento de memória em previews, registros parcialmente concluídos e feedback incompleto ao cidadão.
- **Recomendação:** revogar URLs, definir transação/estado compensatório para mídia e tratar sucesso/erro/contador no React Query.
- **Bloqueia produção:** não, salvo se anexo for obrigatório em fluxos críticos.

### MEDIUM — Validação de entrada não é centralizada

- **Evidência:** `zod` é dependência, mas não é usado nos fluxos. Há alguns limites no HTML e na RPC, porém sem catálogo de tipos no banco, sem faixa latitude/longitude e com limites inconsistentes de descrição (600 na UI, 5000 na RPC).
- **Impacto:** chamadas diretas à API podem produzir dados malformados ou fora do domínio esperado.
- **Recomendação:** definir schemas Zod compartilhados no cliente e validação autoritativa equivalente no banco/RPC.
- **Bloqueia produção:** não isoladamente, mas é necessário antes de abrir a API a clientes diversos.

### LOW — Artefatos staged e qualidade de entrega

- **Evidência:** há um arquivo staged vazio chamado `-` (0 byte, criado em 02/09/2026) e três `.bak` staged, sem referências no código. O build também alerta para chunks acima de 500 kB (Mapbox chega a cerca de 2,4 MB no SSR) e para a migração do plugin `vite-tsconfig-paths`.
- **Impacto:** ruído no repositório, ambiguidade sobre a versão canônica e custo de carregamento.
- **Recomendação:** após preservar/revisar o conteúdo dos backups, removê-los de forma deliberada em uma etapa própria; remover o arquivo `-`; aplicar code-splitting ao mapa. Não fazê-lo dentro desta auditoria.
- **Bloqueia produção:** não.

### LOW — Versões de infraestrutura desalinhadas

- **Evidência:** `@tanstack/react-router` está em `1.170.18`, `@tanstack/react-start` em `1.168.32` e `@tanstack/router-plugin` em `1.168.23`; `nitro` é `3.0.260603-beta`; `vite` é `8.1.5`.
- **Impacto:** o build atual passa, mas o descompasso em um conjunto de pacotes acoplados aumenta risco de comportamento não testado.
- **Recomendação:** em uma mudança isolada, consultar a matriz de compatibilidade e alinhar as versões TanStack; não atualizar dependências como parte da correção funcional.
- **Bloqueia produção:** não pelo resultado atual do build.

## Pontos positivos encontrados

- RPC de criação deriva cidadão, protocolo e município do banco, evitando que o browser escolha `citizen_id`, `protocol_code` ou `status`.
- Protocolos, ocorrências e mídias têm RLS de ownership; buckets declarados são privados e usam pastas por usuário/ocorrência.
- Há limites de tipo/tamanho para o bucket de mídia e URL assinada temporária para exibição.
- CSRF middleware está configurado para server functions, embora não haja server function que use o client SSR.

## Limites da auditoria

Não foi possível confirmar o schema/policies já aplicados, variáveis de ambiente, configuração de Auth, roles de deploy ou dados do projeto Supabase remoto. As conclusões sobre banco são a partir da migration staged e do código local.
