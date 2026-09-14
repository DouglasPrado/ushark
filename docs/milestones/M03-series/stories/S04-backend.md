# S04 — Persistência e resolução de episódios

Status: DONE em 2026-09-14 — S04.1, S04.2 e S04.3 concluídas.

## Objetivo

Fornecer adapters reais mínimos para hierarquia, mapeamento e metadata sem alterar a UX aprovada.

## Contexto e dependências

Ler [M03](../README.md) e apenas as fontes aplicáveis: S03 concluída, M02/M06 integrados e fase frontend M01–M22 aprovada.

## Escopo

Executar S04.1 → S04.2 → S04.3, uma por vez.

## Fora de escopo

Streaming, scheduler, playback, autoplay, cache de mídia e tabelas sem consumidor aprovado.

## Critérios de aceite

Sub-stories concluídas com evidências; domínio testável sem renderer; falhas não corrompem catálogo nem selectors.

## Validação

Checks de cada sub-story, lint/typecheck/build aplicáveis e testes de fronteira.

## Evidências

- [S04.1 — hierarquia persistente e índices](../evidence/BACKEND_S04_1.md):
  **3/3** focados e **26/26** na regressão dos stores afetados.
- [S04.2 — inferência e selectors](../evidence/BACKEND_S04_2.md): padrões,
  correções, conflitos, source compartilhada, legenda, restart e retry.
- [S04.3 — metadata hierárquica](../evidence/BACKEND_S04_3.md): provider TMDB,
  cache/offline, cancelamento e preservação de identidade. Suíte conjunta S04:
  **16/16**.

## Done When

Cumprido. Os adapters de hierarquia, mapping/selectors e metadata estão
validados e prontos para S05.

## S04.1 — Hierarquia persistente e índices

**Objetivo/contexto:** persistir somente entidades e operações aprovadas em S03 sobre o catálogo real de M02.
**Escopo:** séries, episódios, parentesco, temporadas derivadas ou materializadas conforme decisão, memberships e identidade estável; migrações e índices para série/temporada/episódio e consultas paginadas.
**Fora de escopo:** inspeção de source, metadata provider e schema antecipado de playback.
**Aceite:** restart preserva hierarquia e identidade; unique constraints impedem duplicata lógica sem fundir providers incompatíveis; coleção extensa não exige carregar todos os episódios.
**Validação:** fresh/upgrade histórico, rollback de migração, transações concorrentes e corpus sintético de dezenas de milhares de episódios com baseline documentado.
**Done when:** cumprido. Persistência, upgrade, rollback, restart, paginação,
índice e corpus de 50.000 episódios foram comprovados antes de S04.2.

## S04.2 — Inferência e selectors por episódio

**Objetivo/contexto:** consumir a inspeção real de arquivos fornecida por M06 usando o contrato S03.
**Escopo:** reconhecer padrões aprovados, produzir sugestões, persistir correções e vínculos `content_id + source_id`; resolver `episode`, `filename` e `manual` para `resolved_file_id`; relacionar legenda da source quando selecionada.
**Fora de escopo:** download/prioridade de pieces, probe completo, prefetch e decisão automática de episódios duplos.
**Aceite:** episode pack compartilha source sem compartilhar selector; ambiguidade/não identificado permanece revisável; correção sobrevive restart; sample e arquivo irrelevante não viram episódio por engano.
**Validação:** corpus de nomes, casing, paths, especiais, multitemporada, colisões, renomeação, arquivos ausentes e retries; propriedades que garantam ausência de merge entre episódios distintos.
**Done when:** cumprido. Resolução e persistência foram comprovadas antes de
S04.3.

## S04.3 — Metadata hierárquica e recuperação

**Objetivo/contexto:** enriquecer séries/episódios através do provider real de M02 sem tornar rede obrigatória.
**Escopo:** IDs externos, títulos, sinopses, imagens e números de temporada/episódio; cache local, atualização em background e cadastro/revisão com metadata parcial ou ausente.
**Fora de escopo:** curadoria compartilhada, busca/Home global e alteração silenciosa de identidade por refresh.
**Aceite:** catálogo abre offline; falha/timeout não perde mapeamentos; refresh preserva identidade, selectors e correções; série local sem provider continua utilizável.
**Validação:** responses controladas, cancelamento/resposta antiga, provider indisponível e smoke real quando configurado, distinguindo stub de rede real.
**Done when:** cumprido. Metadata e recuperação foram comprovadas; o smoke real
de rede continua explicitamente pendente por ausência de token.
