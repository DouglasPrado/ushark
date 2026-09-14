# Evidência S05 — integração real M06

Data: 2026-09-14.

## Caminho integrado

- Electron Main constrói input store, SQLite v5, cliente torrentd e application
  service; browser continua com `MockTorrentPreview`.
- preload expõe somente 11 comandos versionados e subscription de eventos;
  sender/frame, envelope, method allowlist e campos desconhecidos são validados.
- Filmes exibe importação real no desktop. Arquivo escolhido vira handle opaco,
  metadata é resolvida no daemon, selector é confirmado contra Content existente
  e a source aparece no catálogo M02.
- timeout pode virar pendência, que sobrevive ao restart e aceita retry. Magnet,
  path host e bytes `.torrent` não voltam ao renderer.

Séries mantém o consumer mockado até a integração M03; o boundary M06 é comum e
o runtime real não depende do modelo mock de séries.

## Jornada Electron executada

`tests/torrent-import.electron.spec.ts` passou **1/1 em 2,9 s** com CPython 3.12
e libtorrent 2.1.1 reais. Percurso: onboarding → Filmes → picker nativo → staging
→ `.torrent` → metadata/arquivo → confirmar → fonte visível → magnet sem peers →
hard timeout → salvar pendente → fechar/reabrir app → conteúdo e pendência
reidratados → retry.

Os testes Electron M01/M02 relacionados passaram **4/4** após a nova superfície.
TV continua sem ações de importação, conforme o shell consumidor aprovado.

## Magnet público autorizado

Corpus: `ubuntu-26.04.1-desktop-amd64.iso.torrent`, publicado em
`https://releases.ubuntu.com/26.04.1/`; arquivo de 494.938 bytes obtido por HTTPS,
SHA-256 local
`a4b59d67dfeffa07211b433cee5a0b1e545329b899be2c6cc83725cb13aafad6`.

O parser extraiu seu infoHash. Uma nova sessão recebeu somente o magnet com o
tracker público do Ubuntu. Resultado em **6,6 s**:

```json
{
  "type": "inspection.files-ready",
  "state": "files-ready",
  "infoHashMatched": true,
  "displayName": "ubuntu-26.04.1-desktop-amd64.iso",
  "fileCount": 1
}
```

O daemon estava em `upload_mode` e zerou prioridades assim que a metadata chegou;
o ISO não foi baixado.

## Falha, segurança e regressão

- daemon/libtorrent real: **5 passed**, incluindo secret incorreto, cancelamento,
  runtime reuse e `SIGKILL` isolado com erro recuperável no Core;
- parser/staging: **5 passed**;
- persistência: **4 passed**;
- IPC: **2 passed**;
- suite afetada final serial: **47 passed, 0 failed**;
- lint dos arquivos alterados, typecheck e build passaram; build mantém o aviso
  conhecido de chunk acima de 500 kB (606,03 kB / 179,75 kB gzip).

Uma execução anterior da suite afetada teve 46/47 porque a limpeza do campo após
confirmação real afetou uma fixture mockada. A limpeza foi restringida ao adapter
real; o teste focado passou 3/3 e a repetição integral produziu os 47/47 acima.

## Verificação pós-checkpoint do ambiente local

Em 2026-09-14, a configuração local de desenvolvimento foi reparada para usar
CPython 3.12.14, libtorrent 2.1.1 em cache durável e MPV 0.41.0. A checagem dos
três caminhos retornou existente antes do restart do Electron. O adapter real
passou a consultar `operation.get` a cada 250 ms como fallback aos eventos, sem
alterar o protocolo nem o caminho principal orientado a eventos.

Evidência após a correção: typecheck, build e lint focado passaram; o teste
`tests/torrent-import.electron.spec.ts` passou **1/1 em 3,6 s**. Na jornada
manual, o magnet informado pelo usuário iniciou o processo Python real e chegou
ao timeout esperado de metadata em 30 s, sem falso erro de runtime e sem espera
infinita.

## Limitações explícitas

- libtorrent está disponível no cache local de desenvolvimento; o instalador do
  app ainda não inclui CPython/wheel.
- Windows x64, TV, controle físico e Moonlight não foram executados.
- checkpoint humano permanece PENDING; esta evidência não autoriza S06–S08.
