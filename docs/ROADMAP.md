# Roadmap após a auditoria

Este plano não foi executado. A ordem é intencional: primeiro tornar a base compilável e segura; depois ampliar funcionalidades.

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
- **Ocorrências:** fluxo de formulário, RPC e upload existem, mas type-check falha, classificação ainda é manipulável no cliente e não há ciclo de vida transacional de mídia.
- **Protocolos:** lista de protocolos próprios existe; documentos, agendamentos, histórico e notificações são somente estruturas visuais.
- **Mapa:** localização e boundary são reais; a camada de ocorrências não é municipal, apenas de ownership.
- **Prefeitura conectada:** modelagem de feed/eventos existe; a UI ainda não os busca.
- **Multi-município:** `municipality_id` está espalhado pelo schema, mas falta regra de associação confiável e isolamento do conteúdo municipal.

## Não iniciado

- Fluxo completo de cadastro/login, recuperação de sessão e logout da interface.
- Fonte de verdade de perfil, seleção/validação de município e avatar em Storage.
- Back-office e permissões para publicação municipal e atualização de status.
- Feed municipal anonimizado/seguro e regras de confirmação compatíveis com ele.
- Serviços reais das jornadas, documentos, agendamentos, notificações e timeline.
- Testes unitários, de integração Supabase/RLS e end-to-end.
- Política de privacidade/consentimento para GPS e provedores de geocoding/clima/mapa.
- Observabilidade de erros, auditoria operacional e rate limit/antispam para ocorrências.

## Bloqueado

- A compilação TypeScript está bloqueada por 11 erros no staged atual.
- A integração de perfil está bloqueada pelo contrato divergente entre SQL, tipo TypeScript e service.
- O fluxo de autenticação está bloqueado porque `/auth` não existe.
- A entrega multi-município está bloqueada pela ausência de tenancy validada e pela leitura pública cross-municipality de feed/eventos.
- A validação do banco remoto está pendente de autorização/ambiente; nenhuma migration foi aplicada nesta auditoria.

## Próxima etapa exata

1. Preservar o índice atual e separar os artefatos `-` e `.bak` em uma revisão própria; decidir qual versão dos clients/auth é canônica.
2. Corrigir somente os bloqueadores de compilação: case dos imports, client Supabase tipado/nulo, exports do service, rota/fluxo de autenticação e tipos opcionais. Exigir `npx tsc --noEmit` verde.
3. Unificar o contrato `citizen_profiles` (especialmente avatar) e gerar/verificar `src/types/database.ts` a partir do schema que será aplicado.
4. Definir a política de tenancy: como o cidadão se vincula a um município, quem pode mudar o vínculo e quais dados públicos podem cruzar municípios. Atualizar RPCs/RLS conforme essa decisão.
5. Aplicar a migration somente em ambiente controlado, inspecionar schema/policies efetivamente criados e executar testes com dois cidadãos de municípios distintos.
6. Conectar UI de perfil, logout, protocolos, ocorrências, feed/eventos e mapa aos contratos validados; remover mocks/localStorage de dados de domínio.
7. Adicionar validação Zod no cliente, validação autoritativa/RPC no banco, testes de RLS/Storage e tratamento de erro/loading/empty para cada query/mutation.
8. Só então avaliar alinhamento de versões TanStack/Nitro e code-splitting do mapa em uma mudança isolada.
