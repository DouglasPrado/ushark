# Evidência S05 — integração local real

Data: 2026-09-14.

## Caminho de produção

- `DesktopDiscoveryCatalog` substitui o catálogo mockado no Electron, converte
  snapshots versionados e mantém paginação por cursor/revisão.
- O preload expõe somente `readHome`, `search`, `readScope`, cancelamento,
  recovery explícito e assinatura de invalidações; objetos são congelados.
- O IPC v1 valida protocolo, allowlist de campos, janela proprietária e frame
  principal. Banco, tokens e caminhos absolutos não chegam ao renderer.
- O processo principal abre o índice local sob demanda, entrega o cache antes
  do scan, inicia watcher em background e publica eventos somente após commit.
- Saves/favoritos/sources de filmes e imports/arte/refresh de séries agendam
  nova projeção. Se uma mutação ocorre durante sync, uma passagem pendente é
  preservada em vez de ser descartada.
- O modo real não exibe controles de cenário nem dados simulados de Torrent
  Health. Playback/progresso e produtores de coleções/subscriptions continuam
  nos milestones proprietários.

## Prova Electron offline e restart

Em perfil temporário dedicado, o teste Electron completou onboarding, abriu a
Home real, criou `Cinema Persistente` pelo catálogo M02 offline e voltou à
Home. A invalidação tornou o filme visível, a busca FTS encontrou o item, o
detalhe reutilizou a superfície canônica e não mostrou Health mockado. Após
fechar e reabrir o processo com o mesmo perfil, Home e busca carregaram o item
persistido sem internet. Captura: `electron-real-search.png`.

O watcher foi exercitado com arquivos reais em S04.3: add/change/rename/delete,
coalescência, fingerprint em worker, identidade após restart, symlink/escape e
arquivo pendente. O subscription do adapter foi testado separadamente e limpa
cursores/notifica a UI ao receber o evento; a jornada Electron confirma a mesma
invalidação pela mutação real do catálogo.

## Resultados

```text
USHARK_TEST_PYTHON="$(uv python find 3.12)" \
USHARK_TEST_LIBTORRENT_PYTHONPATH=/tmp/ushark-libtorrent-verify.GziKkI/site \
pnpm exec playwright test <stores, IPC e Electron afetados> \
  --workers=1 --trace=off
# 71 passed

pnpm exec playwright test tests/discovery.behavior.spec.ts \
  tests/discovery.layout.spec.ts tests/card-containment.spec.ts \
  tests/selection.behavior.spec.ts tests/frontend-audit.behavior.spec.ts \
  tests/movies.behavior.spec.ts --workers=1 --trace=off
# 34 passed

pnpm lint
pnpm typecheck
pnpm build
# passed; build com warning conhecido de chunk > 500 kB
```

Testes M04 específicos: índice/FTS **6**, watcher **3**, IPC **2**, adapter
renderer **2** e Electron **1**, total **14/14**.

## Limites do checkpoint

Memberships, coleções, sources e progresso foram lidos por queries reais e
fixtures persistidas controladas. Isso não comprova produção por M05/M12/M16.
Também ficam para as fases proprietárias: playback, sync remoto, probes de
peers, runtime torrent empacotado e validação física Windows/TV/gamepad/
Moonlight. S06–S08 não foram executadas.
