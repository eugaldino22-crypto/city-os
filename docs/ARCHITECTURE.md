# Arquitetura encontrada — City OS / Gestor.IA V3

Esta é a arquitetura efetivamente presente no checkout em 2026-09-29; não representa a arquitetura desejada.

## Plataforma e entrada

- TanStack Start + React 19 + Vite/Nitro, com rotas por arquivo.
- `src/routes/__root.tsx` fornece `QueryClientProvider` e `AuthProvider` a todas as rotas.
- Rotas implementadas: `/`, `/protocolos` e `/jornada/$slug`. Não existe `/auth`.
- `src/start.ts` instala middleware de erro e CSRF para server functions.
- `src/lib/supabase-server.ts` cria um client SSR baseado em cookies, mas não há consumidor dele no código atual. As consultas Supabase executam no browser.

## Fluxo do cidadão atual

```text
Browser
  -> AuthProvider
     -> supabase.auth.getSession / onAuthStateChange
     -> user | null
  -> React Query hooks
     -> services (browser client)
     -> Supabase PostgREST / RPC / Storage
```

O cabeçalho e o menu de perfil não consomem o perfil Supabase: nome e foto são estado local e `localStorage`. A opção Sair ainda é somente um `console.log`.

## Ocorrências e protocolos

```text
NewOccurrenceDialog
  -> classificação local (catálogo estático)
  -> useAddOccurrence / React Query
  -> services/occurrences.createOccurrence
  -> RPC public.create_occurrence
       -> profile do auth.uid()
       -> municipality_id do perfil
       -> protocols
       -> occurrences
  -> Storage privado occurrence-media (opcional)
  -> occurrence_media

OccurrenceFeed / ProtocolsOverview
  -> React Query
  -> select de occurrences / protocols
  -> RLS por citizen_id = auth.uid()
```

O protocolo é criado na mesma RPC da ocorrência. O upload acontece **depois** da RPC, portanto pode falhar com ocorrência/protocolo já persistidos. A listagem de ocorrências é privada do cidadão; ainda assim seu resultado é exibido também no mapa nomeado como municipal.

`confirm_occurrence` registra uma confirmação única por cidadão e incrementa um contador. Pela RLS atual, a UI só enxerga as próprias ocorrências, de modo que não há feed comunitário funcional para confirmar.

## Localização e mapa

```text
GPS do navegador
  -> BigDataCloud reverse geocode
  -> Nominatim boundary lookup
  -> Mapbox para renderização
  -> Open-Meteo para clima
```

`CitizenHeader` e `CityLive` usam instâncias separadas de `useCityContext`; não há provider compartilhado. O seletor de localização da ocorrência usa GPS, BigDataCloud e Mapbox independentemente. A persistência só recebe coordenadas e textos de endereço na ocorrência.

## Modelo de dados definido na migration

```text
auth.users
  └── citizen_profiles (1:1; municipality_id opcional)

municipalities
  ├── citizen_profiles.municipality_id
  ├── protocols.municipality_id
  ├── occurrences.municipality_id
  ├── city_feed.municipality_id
  └── city_events.municipality_id

protocols (citizen_id)
  └── occurrences.protocol_id
        ├── occurrence_media
        └── occurrence_confirmations (citizen_id)
```

Também são definidos os buckets privados `occurrence-media` e `citizen-avatars`, triggers de `updated_at`, trigger de criação de perfil em `auth.users`, a sequência de protocolo e as RPCs `create_occurrence` e `confirm_occurrence`.

## Autorização e tenancy reais

- Perfil: leitura/escrita do próprio `id`.
- Protocolos, ocorrências, mídia e confirmações: leitura do próprio cidadão; criação de ocorrência e confirmação passam por RPC.
- Mídia: caminho e objeto Storage são associados ao usuário e à sua ocorrência.
- Municípios: lista de ativos é pública.
- Feed/eventos: publicação é pública independentemente de `municipality_id`.

Assim, ownership de dados pessoais é mais restritivo que o conteúdo público; a fronteira municipal não é aplicada ao feed/evento e a associação perfil–município não é validada.

## Dados reais, mocks e placeholders

| Superfície | Estado real |
| --- | --- |
| Sessão Supabase | Client existe; não há UI de autenticação e o type-check falha. |
| Perfil | Tabelas/service propostos; UI usa `localStorage`; contrato de avatar diverge. |
| Ocorrência | RPC, RLS e Storage propostos; integração cliente existe, mas a branch não passa em TypeScript. |
| Protocolos | Query por ownership implementada; exibe protocolos de ocorrência. Áreas de documentos/agendamento/histórico são cartões estáticos. |
| Mapa municipal | GPS/limite/Mapbox reais; marcadores vêm somente das ocorrências do próprio cidadão. |
| Prefeitura conectada | Tabelas propostas; UI é placeholder sem query. |
| Jornadas e IA | Regras locais e páginas placeholder, sem integração a serviços municipais. |

## Dependências sensíveis

- `@supabase/supabase-js` e `@supabase/ssr` no browser/SSR.
- `mapbox-gl` para mapa, com token público de ambiente.
- BigDataCloud, Nominatim e Open-Meteo chamados diretamente do cliente.
- React Query para cache/queries/mutations; não há configuração global de retry, erro ou persistência customizada.
