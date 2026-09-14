# M06 — Pronto para revisão funcional

## S03 — contrato de inspeção torrent

Contrato real v1 fechado em 2026-09-14. Foram definidos limites mensuráveis,
entrada `.torrent` por handle opaco, lifecycle assíncrono com snapshot/eventos,
cancelamento, pendência/retry, erros tipados e identidades distintas. D05 fixa um
runtime por infoHash com selector na relação conteúdo-source; D08 fixa budgets;
D22 exige staging gerenciado e containment por componentes/`realpath`/`relative`.
[Evidência](evidence/DOMAIN_CONTRACT.md). S04.1 é o próximo incremento; nenhuma
integração funcional foi inferida.

## S04.1 — parser e staging seguro

Implementado o boundary `@ushark/core/torrent-input`: magnet BTIH, bencode estrito,
hash do dicionário `info`, budgets, arquivo normalizado/classificado e staging
atômico por handle opaco. Containment cobre traversal, symlink e prefixo textual
sem tocar no original; cancelamento limpa apenas o temporário próprio. Teste
focado: **5 passed**. [Evidência](evidence/BACKEND_S04_1.md). S04.2 é o próximo
incremento; libtorrent real ainda não foi comprovado.

## S04.2 — torrentd/libtorrent isolado

Implementados daemon Python e cliente Core sobre stdio herdado, sem porta RPC,
com secret efêmero, protocolo/allowlist, timeout, limite de 1 MiB, eventos,
cancelamento e reuso de sessão por infoHash. CPython 3.12 e libtorrent 2.1.1 foram
fixados com hashes macOS arm64/Windows x64. Em wheel oficial instalado somente em
área temporária, **4 testes passaram** com libtorrent real, incluindo rejeição de
secret incorreto. [Evidência](evidence/BACKEND_S04_2.md). Empacotamento/Windows e
magnet público com metadata continuam gates explícitos; S04.3 é o próximo passo.

## S04.3 — persistência de pendências/source/selector

SQLite v5 agora mantém uma sessão lógica por infoHash, uma source reutilizável e
selectors separados por relação conteúdo-source. Pendência guarda input privado
para retry, mas listagens/snapshots permanecem redigidos. Save/retry/confirm são
idempotentes e confirmação é transacional. Testes M06: **4 passed**; regressão dos
stores M01/M02 afetados: **23 passed**. [Evidência](evidence/BACKEND_S04_3.md).
S04 está DONE; S05 integra a jornada sem mocks no Electron.

## S05 — jornada real até o checkpoint funcional

Movies/Electron agora usa o boundary real completo; browser e Séries pré-M03
mantêm mocks explícitos. O teste Electron percorreu `.torrent`, vínculo ao filme,
timeout, pendência, restart e retry em **1/1**. Um magnet derivado do torrent
oficial Ubuntu 26.04.1 recebeu metadata pública em **6,6 s**, sem baixar o ISO.
Crash do daemon ficou isolado. A suite afetada final passou **47/47**, além de
lint, typecheck e build. [Evidência](evidence/INTEGRATION_VALIDATION.md).

M06 está `READY_FOR_REVIEW/PENDING` no checkpoint funcional. Empacotamento do
runtime, Windows/TV/controle/Moonlight e decisão humana continuam pendentes;
S06–S08 não foram iniciadas.

### Correção pós-checkpoint — runtime local e espera resiliente

Em 2026-09-14, o ambiente local foi corrigido após a UI informar incorretamente
que o runtime não estava instalado: `USHARK_TORRENTD_PYTHON` continha um sufixo
inválido e o `PYTHONPATH` ainda apontava para um diretório temporário. O
libtorrent 2.1.1 agora está em cache local durável e os três caminhos do runtime
foram verificados antes do restart do Electron.

O adapter do renderer também ganhou polling de recuperação a cada 250 ms. Os
eventos continuam sendo o caminho principal, mas perda de um evento terminal não
deixa mais a interface presa em “Resolvendo metadata”. No teste manual, o magnet
informado iniciou o daemon real e terminou após 30 s com
`TORRENT_METADATA_TIMEOUT`, em vez do falso erro de instalação ou espera
infinita. Build, typecheck, lint focado e o teste Electron real passaram; o
checkpoint e sua decisão humana permanecem inalterados.

S00–S02 implementadas: importação sintética em Filmes/Séries, metadata, revisão/seleção, cancelamento, pendências/retry, dedup em memória e fixtures de falha. [Validação](evidence/VALIDATION.md). UX READY_FOR_REVIEW/PENDING; revisão humana adiada até fim M01–M22. S03–S08 e hardware físico pendentes. Próximo M07 S00.

## Auditoria transversal da fase frontend

Jornadas conectadas e correções finais registradas em [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [validação final](../../execution/evidence/FINAL_VALIDATION.md). Esta atualização não muda aceites humanos existentes. S03–S08 continuam adiadas.
