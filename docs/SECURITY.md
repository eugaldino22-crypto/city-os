# Segurança — validação local de tenancy e RLS

Data da execução: 2026-09-29
Escopo: Fases 1B e 1C, exclusivamente na stack Supabase local.

## Ambiente e reprodutibilidade

- Supabase CLI: `2.114.0`.
- Docker: `29.7.2`.
- Banco executado: container local `supabase_db_city-os`; nenhuma URL, API ou projeto Supabase remoto foi usado.
- Reset local: `supabase db reset --local --no-seed`.
- Migrations aplicadas em banco limpo, nesta ordem:
  1. `20260902204241_cityos_real_data_foundation.sql`
  2. `20260929160000_cityos_tenancy_rls_hardening.sql`
- Teste reproduzível: `supabase/tests/phase_1c_tenancy_rls.sql`.

Execute o teste somente com a stack local iniciada:

```powershell
Get-Content -Raw supabase/tests/phase_1c_tenancy_rls.sql |
  docker exec -i supabase_db_city-os psql -X -v ON_ERROR_STOP=1 -U postgres -d postgres
```

O arquivo usa UUIDs e e-mails `example.test` fictícios, simula `authenticated` e `anon` com claims locais, e encerra com `ROLLBACK`; não deixa fixtures persistidas.

## Implementado

- Um único município canônico por cidadão em `public.citizen_profiles.municipality_id`.
- `link_current_citizen_municipality(uuid)` permite somente o primeiro vínculo com município ativo. Trigger e RLS impedem alteração direta e upsert posterior.
- `create_occurrence` deriva cidadão e município de `auth.uid()` → `citizen_profiles`; sua assinatura não aceita usuário, município, prioridade, órgão, departamento, responsável ou status.
- Prioridade tem default backend `medium`; `agency` fica sem atribuição inicial.
- `city_feed` e `city_events` não possuem leitura direta para `anon` ou `authenticated`; são servidos pelas RPCs tenant-scoped.
- `list_municipal_occurrence_map()` é a única projeção municipal de ocorrências e não lê detalhes privados pelo cliente.

## Testado localmente

| Área | Evidência | Resultado |
| --- | --- | --- |
| Onboarding | Primeiro vínculo A→Município A e B→Município B; troca posterior, município inativo e UUID inexistente | PASS |
| Perfis | Leitura própria, atualização permitida, leitura/atualização cross-user, alteração direta e upsert de município | PASS |
| Ocorrências | `citizen_id`/`municipality_id` derivados, `priority=medium`, `agency is null`, tentativa de parâmetros sensíveis ausentes | PASS |
| Isolamento privado | A não lê ocorrência/protocolo B; B não lê A; update administrativo direto negado | PASS |
| Feed e eventos | A recebe só A, B recebe só B; tenant explícito B como A é negado | PASS |
| Mapa | A retorna apenas A e B apenas B; latitude/longitude arredondadas a três casas e `reported_at` arredondado à hora | PASS |
| Sanitização do mapa | Colunas exatas: `occurrence_id`, `type_id`, `latitude`, `longitude`, `priority`, `status`, `confirmations_count`, `reported_at` | PASS |
| Anon | Não executa onboarding, criação ou mapa; só consulta feed/eventos públicos com município explícito | PASS |

## Matriz de RPCs e grants

| RPC | anon | authenticated | Escopo |
| --- | --- | --- | --- |
| `link_current_citizen_municipality` | Negado | Permitido uma única vez | próprio `auth.uid()` |
| `create_occurrence` | Negado | Permitido | proprietário e município derivados no banco |
| `list_municipal_occurrence_map` | Negado | Permitido | município do profile autenticado; projeção sanitizada |
| `list_municipal_city_feed` | Permitido com município explícito | Permitido, mas deriva profile e rejeita tenant divergente | conteúdo público municipal |
| `list_municipal_city_events` | Permitido com município explícito | Permitido, mas deriva profile e rejeita tenant divergente | conteúdo público municipal |

## Correção encontrada durante a prova

O primeiro teste local encontrou ambiguidade no `RETURNING id, priority, agency` de `create_occurrence`: o nome `priority` conflitaria com o parâmetro de saída homônimo da função PL/pgSQL. A migration forward-only foi corrigida para usar o alias explícito `occurrence.id`, `occurrence.priority` e `occurrence.agency`. Depois, o banco foi resetado localmente e a matriz inteira passou.

A inicialização local também gera `supabase/.temp/start-secrets/**`, já ignorado pelo Git. O ignore equivalente foi incluído no ESLint para que `npm run lint` não analise código runtime que contém configuração local gerada; nenhum secret foi editado, exibido ou versionado.

## Não testado / pendente

- O teste simula claims locais no Postgres para exercitar o mecanismo RLS. Fluxos HTTP reais de login/token e a interface pública por rota/slug ainda não fazem parte desta fase.
- Storage, Realtime e Analytics apresentaram health-check lento na primeira subida local; a validação desta fase usou o Postgres, Auth, REST e Kong locais saudáveis. Upload/download de mídia não foi testado nesta matriz.
- Não há nesta fase fluxo administrativo para alterar município após onboarding.
