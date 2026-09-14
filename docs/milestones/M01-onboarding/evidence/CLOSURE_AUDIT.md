# Auditoria de closure — M01/S08

Data: 2026-09-14. Resultado: **S08 executada; M01 LOCAL_VALIDATED, aguardando gates humanos/externos**.

## Escopo entregue

S03–S07 foram implementadas e validadas: contrato de configuração v1, SQLite/migration/biblioteca vazia, IPC/preload restritos, adapter Electron, mock web preservado, onboarding/configurações persistentes, seletor nativo, reset seletivo, recovery, testes/budgets e hardening. Nenhum domínio de M02–M22 foi integrado antecipadamente.

## Auditoria dos requisitos

| Grupo                   | Evidência atual                                                                                        | Decisão                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| FR-001                  | `local_libraries` persiste `libraryId`, nome e pasta mesmo sem conteúdo; restart coberto               | LOCAL_VALIDATED                                               |
| FR-075–080              | navegação/foco/B/A/D-pad/analógico e restauração cobertos por testes sintéticos                        | LOCAL_VALIDATED; hardware/global pendente                     |
| FR-187–193              | qualidade, resolução, auto-switch, autoplay, áudio, legenda e desconexão persistem no snapshot         | LOCAL_VALIDATED                                               |
| FR-214–218              | primeiro acesso, pastas/defaults, cache e política inicial persistem; seletor nativo atravessa preload | LOCAL_VALIDATED                                               |
| FR-220/NFR-065          | loading/offline/degraded/error/retry continuam explícitos; falha não perde rascunho/snapshot           | LOCAL_VALIDATED                                               |
| NFR-004–009             | render inicial offline, troca local p95 33,90 ms e frame p95 16,70 ms na amostra Chromium              | LOCAL_VALIDATED; hardware real pendente                       |
| NFR-116/146/149/158/159 | métricas observáveis; 50 transições com crescimento de heap reportado 0; regressão executada           | LOCAL_VALIDATED; sessão longa/hardware pendente               |
| NFR-123–127             | focus trap/restoration e layouts 1080p/1440p/4K cobertos                                               | automação aprovada; overscan/distância físicos pendentes      |
| NFR-137–138/142         | `ui`, `types`, `mocks`, `core`, main/preload/renderer separados; Fake→Real pelo mesmo contrato         | LOCAL_VALIDATED                                               |
| RX-001–004              | shell endurecido, API mínima, reset seletivo, navegação e escala preservados                           | LOCAL_VALIDATED; TV/controle físicos pendentes                |
| RX-049/057              | gates locais executados; UX aprovada; estados/gates externos separados                                 | LOCAL_VALIDATED; CI/review/merge e funcional humano pendentes |

## Gates executados

- UX M01–M22: APPROVED pelo usuário em 2026-09-14; checkpoints sincronizados.
- S03–S05: contrato, persistência e integração implementados.
- Checkpoint funcional M01: READY_FOR_REVIEW/PENDING. O usuário autorizou atravessar tecnicamente para S06–S08, sem conceder aceite funcional.
- S06/S07: 27/27 testes focados passaram após hardening.
- Gates estáticos completos do checkout: `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build` e `git diff --check` passaram.
- Regressão integral serial: 150/150 passaram em 9,3 min com `--workers=1 --trace=off`. A primeira execução com quatro workers teve seis falhas de espera/contenção fora de M01; todos esses casos passaram em série e nenhuma falha permaneceu na execução integral.

## Gates que impedem DONE

1. Aprovação funcional humana do fluxo real de M01 ainda não foi dada.
2. Windows x64, TV, controle físico, hotplug e Sunshine/Moonlight não foram validados fisicamente.
3. CI/review/merge das alterações atuais não foram confirmados; merge não está autorizado.

Portanto, S08 foi executada como auditoria, mas M01 permanece `LOCAL_VALIDATED / READY_FOR_FUNCTIONAL_REVIEW`, anterior a `DONE`. Isso preserva a distinção entre implementação, validação local, aceite humano, hardware e entrega externa.
