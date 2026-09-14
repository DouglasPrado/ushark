# Evidência S04.3 — watcher e hydration em background

Data: 2026-09-14.

## Implementação

Foi adicionado `@ushark/core/discovery-watcher`, limitado ao `root_path` da
biblioteca já autorizada. A migration global v9 persiste somente caminhos
relativos, fingerprints e o vínculo opcional com Content em
`discovery_watch_files`; nenhum path absoluto atravessa o evento público.

O watcher:

- usa `fs.watch` recursivo quando suportado e fallback assíncrono por diretório;
- retorna imediatamente e dispara scan inicial em background, permitindo Home
  a partir do cache antes da hydration;
- coalesce rajadas em 150 ms e processa lotes de até 1.000 paths;
- rejeita path traversal, path absoluto, symlink e realpath fora da raiz;
- executa `fstat` e fingerprint de amostras inicial/central/final em
  `worker_threads`, com timeout e detecção de arquivo ainda instável;
- mantém no máximo quatro hydrations pesadas concorrentes;
- reconhece rename pela fingerprint persistida, preservando `contentId`;
- converte add/change/rename/delete em `index.apply` idempotente e delimitado;
- mantém o snapshot anterior quando o arquivo está incompleto, ilegível ou
  rejeitado, emitindo `pending/rejected/error` recuperável.

O resolver de Content é injetado e recebe somente a leitura hidratada segura.
Isso preserva o ownership futuro de parsing/importação de M13: M04 observa,
coalesce, faz o probe de filesystem e atualiza a projeção, sem inventar um
importador definitivo.

## Validação real de filesystem

Suíte focada S04.3: **3/3**; repetição de estabilidade: **6/6**.

- criação real apareceu como `file-added`;
- cinco escritas e dez notificações repetidas produziram um único Content;
- mudança atualizou somente o ID afetado;
- rename preservou identidade e registrou path anterior;
- restart preservou o mapping e reconheceu novo rename;
- delete removeu apenas o documento indexado;
- escape `../`, symlink para fora e arquivo sem permissão foram rejeitados ou
  ficaram pendentes sem apagar o cache;
- arquivo de 4 MiB existente antes do startup apareceu progressivamente; start
  retornou abaixo de 100 ms e Home/busca local responderam antes do scan.

Suíte conjunta S04.1–S04.3: **9/9**. Regressão dos stores/IPC M01–M06,
incluindo CPython 3.12/libtorrent 2.1.1.0 real: **61/61**. Lint, typecheck e
build passaram; permanece somente o warning conhecido de chunk acima de 500
kB.

```text
pnpm exec playwright test tests/discovery-watcher.spec.ts \
  --workers=1 --trace=off --repeat-each=3
# 6 passed

pnpm exec playwright test tests/discovery-index-store.spec.ts \
  tests/discovery-watcher.spec.ts --workers=1 --trace=off
# 9 passed

USHARK_TEST_PYTHON="$(uv python find 3.12)" \
USHARK_TEST_LIBTORRENT_PYTHONPATH=/tmp/ushark-libtorrent-verify.GziKkI/site \
pnpm exec playwright test <stores e IPC M01-M06>
# 61 passed
```

A troca dos mocks do renderer pelo adapter real, o subscription de eventos e a
prova Electron offline→watcher→UI pertencem ao S05. Variantes de imagem já
cacheadas continuam sendo consumidas; geração definitiva de derivados e seus
budgets permanecem para hardening/owners de cache, sem bloquear esta fronteira.
