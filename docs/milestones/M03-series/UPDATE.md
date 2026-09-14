# Atualização — M03 com UX aprovada

S00–S02 concluídas em 2026-09-13 no checkout real, sob `EXECUTE_MILESTONE M03`. [Contrato](EXPERIENCE.md), biblioteca de séries, temporadas/especiais, episódios, quatro packs, correção por arquivo, legenda, conflitos, rascunho, retry, confirmação idempotente e fontes salvas reabertas estão disponíveis em memória. Corpus 20.000 com paginação de 20 itens.

Validação: lint/typecheck/build e formatação passaram; suíte completa **39 testes passou**, incluindo 10 M03. Capturas 1080p/1440p/4K e Electron macOS offline em [evidências](evidence/VALIDATION.md). Gamepad sintético validado; Windows/TV/gamepad físico pendentes.

[UX checkpoint](UX_CHECKPOINT.md): APPROVED pelo usuário em 2026-09-13: “aprovado”, após ajuste do ícone de Séries não selecionado (typecheck/lint passaram). Próxima ação: aguardar `EXECUTE_MILESTONE M04`; M04 está preparado. Backend, persistência, inferência real e S03–S08 adiados até UX M01–M22. Funcional NOT_STARTED; M03 não está DONE. Nenhum commit, merge ou publicação.

## Preparação documental — 2026-09-13

PREPARED: S00–S08 e ambos os roteiros de checkpoint conferidos; [cobertura por requisito](PREPARATION_COVERAGE.md) adicionada. Nenhuma story executada nesta preparação. Evidências e aceites anteriores preservados; backend/S03–S08 permanecem adiados até UX M01–M22.

## Auditoria transversal da fase frontend

Jornadas conectadas e correções finais registradas em [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [validação final](../../execution/evidence/FINAL_VALIDATION.md). Esta atualização não muda aceites humanos existentes. S03–S08 continuam adiadas.

## Ajuste posterior — catálogo padrão IMDb

Por solicitação do usuário, Séries agora abre com oito títulos reais, nota/votos/ID, período, gêneros, pôsteres e backdrops do snapshot IMDb. A tela recebeu a mesma navegação superior de Filmes/Home; cada detalhe expõe duas temporadas e seis episódios de demonstração local. A Home usa os backdrops no trilho Séries. [Evidência e limites](evidence/IMDB_SERIES_SEED.md) · [print do catálogo](evidence/imdb-series-1920.png) · [print do detalhe](evidence/imdb-series-detail-1920.png).

Typecheck, lint, build e regressão completa **125/125** passaram; Electron carregou as artes offline via `file:`. Backend/provider/persistência e S03–S08 continuam adiados. O aceite UX histórico de M03 foi preservado, mas esta mudança posterior aguarda confirmação visual própria.

## Correção durante a revisão — Torrent Health

Após esclarecimento do usuário, o selo de resolução foi substituído pelo indicador correto: barras crescentes como sinal de celular e o rótulo de Torrent Health (`Excelente`, `Muito bom`, `Bom` ou `Instável`). `4K`/`1080p` permanecem separados na metadata. O indicador consome o Health determinístico do boundary mockado de M08, não a metadata IMDb nem uma medição real.

No ajuste seguinte, cada episódio recebeu seu próprio badge, calculado pelas sources únicas associadas ao episódio. Na capa/card e no detalhe da série, o badge explicita `Média` e usa a média aritmética dos torrents únicos da série por `sourceId`; uma source de temporada associada a três episódios conta apenas uma vez. [Print dos episódios](evidence/imdb-series-episodes-1920.png). Catálogo, detalhe, episódios e Home foram recapturados; a confirmação visual desta alteração continua pendente.

## Ajuste posterior — imagem ou GIF por episódio

Por solicitação do usuário, as linhas de episódios passaram a reservar thumbnail 16:9. Enquanto não existe arte própria, usam o backdrop local da série como prévia; séries sem arte mantêm um fallback estável, sem salto de layout. O detalhe do episódio permite escolher JPEG, PNG, WebP ou GIF de até 12 MB, mostra erro de formato/tamanho e atualiza imediatamente detalhe e card.

O `Episode` recebeu arte opcional e o `SeriesCatalog` uma operação substituível para atualizá-la. O adapter atual conserva o data URL somente em memória e a interface informa que reiniciar descarta o arquivo; ingestão segura, magic bytes, cópia para storage e persistência real continuam adiadas para S03–S08. [Print atualizado dos episódios](evidence/imdb-series-episodes-1920.png) · [seletor de arte](evidence/episode-artwork-upload-1920.png). Os seis testes focados de Séries e a regressão completa **128/128** passaram após build; layouts 1080p/1440p/4K e Electron macOS permaneceram verdes.

## Ajuste posterior — busca e ordenação do catálogo

A lista de Séries recebeu busca local por título localizado, título original e gêneros, ignorando acentos/caixa e aceitando termos separados. O seletor oferece `Em destaque`, `Mais votados` e `A–Z`; a primeira opção conserva a curadoria atual, enquanto votos usam o snapshot IMDb. [Captura 1080p](evidence/catalog-search-sort-1920.png). O teste conjunto com Filmes e a regressão completa passaram **132/132 em 2,3 min**. O aceite histórico de M03 é preservado; esta alteração posterior aguarda confirmação própria.

No ajuste transversal seguinte, a marca `Ushark` do cabeçalho deixou de ser botão e saiu da sequência de foco/controle; `Início` é a ação explícita para voltar à Home. A regressão completa passou 133/133. O aceite histórico de M03 permanece preservado.

## Ajuste posterior — catálogo por categorias

Em 2026-09-14, Séries adotou trilhos panorâmicos como a Home. A tela padrão reúne `Em destaque` e categorias de gêneros relacionados. Busca, `Mais votados` e `A–Z` preservam a grade única. O retorno da hierarquia restaura o card exato. [Evidência e validação](../../execution/evidence/CATALOG_CATEGORY_RAILS.md).

## Ajuste posterior — busca recolhida

A busca permanente saiu da sequência inicial de foco. Uma lupa à direita expande o campo somente quando ativada; fechar ou usar Voltar/Escape limpa a consulta e restaura o foco na lupa. [Evidência e validação](../../execution/evidence/COLLAPSED_CATALOG_SEARCH.md).

# Integração funcional M03

## S03 — contrato de série, episódio e selector

Contrato real v1 fechado em 2026-09-14. Série e episódio têm identidades
independentes; temporada é projeção paginada; especiais usam temporada zero; e
uma source pode servir muitos episódios sem compartilhar selector. Inferência
fica limitada aos padrões aprovados e retorna estados revisáveis para
ambiguidade, colisão e arquivo multi-episódio. Correção, legenda da mesma source,
idempotência, transação, provider offline e limites mensuráveis foram
formalizados. Prettier, ESLint e typecheck passaram.
[Evidência](evidence/DOMAIN_CONTRACT.md). Próximo incremento: S04.1, hierarquia
persistente e índices.

## S04.1 — hierarquia persistente e índices

SQLite v6 agora aceita conteúdos `series`/`episode`, preserva o catálogo M02 e
mantém parentesco, unique tuple, especiais, revision, idempotência e cursor
opaco. O teste de upgrade/restart/rollback passou; um corpus de **50.000**
episódios foi inserido em cerca de **444 ms** e paginado pelo índice previsto no
host macOS arm64. Suíte focada: **3/3**; regressão dos stores afetados: **26/26**.
[Evidência](evidence/BACKEND_S04_1.md). Próximo incremento: S04.2, inferência e
selectors por episódio.

## S04.2 — inferência e selectors por episódio

Os três padrões aprovados, especiais e fronteiras de token foram implementados.
Ambiguidade, colisão, arquivo não reconhecido e mídia multi-episódio permanecem
revisáveis. Correções, skip, legenda, selectors por episódio, source
compartilhada, restart, source alterada e retry idempotente foram comprovados.
[Evidência](evidence/BACKEND_S04_2.md).

## S04.3 — metadata hierárquica e recuperação

O TMDB real de M02 agora cobre busca de série, detalhes e episódios por
temporada, usando cache SQLite e fallback degradado. O service localiza imagens,
preserva IDs locais e mantém a hierarquia intacta em falha/cancelamento. Suíte
S04 conjunta: **16/16**. O smoke de rede real está pendente por ausência de
`USHARK_TMDB_TOKEN`. [Evidência](evidence/BACKEND_S04_3.md). Próxima story: S05,
integração Electron e jornada completa.

## S05 — integração real e checkpoint funcional

Em 2026-09-14, a tela aprovada foi conectada ao catálogo real por
`DesktopSeriesCatalog`, preload/IPC restrito, Core e SQLite. O fluxo Electron
importou `.torrent` multifile, preservou temporada, especial, legenda e
selectors independentes numa source compartilhada, persistiu arte após validar
magic bytes e reabriu tudo offline após restart. Uma falha após criação parcial
retornou estado recuperável e o retry concluiu idempotentemente.

Lint, typecheck, build e `git diff --check` passaram. A suíte afetada de
M02/M03/M06, incluindo Electron com CPython 3.12.14 e libtorrent 2.1.1.0,
passou **86/86**. [Evidência](evidence/INTEGRATION_VALIDATION.md).
[Checkpoint funcional](FUNCTIONAL_CHECKPOINT.md): `READY_FOR_REVIEW/PENDING`;
S06–S08 não foram iniciadas.
