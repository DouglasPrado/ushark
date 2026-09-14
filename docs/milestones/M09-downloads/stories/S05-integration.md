# S05 — Integração da jornada — M09

Status: DONE; integração real comprovada e checkpoint funcional preparado.

## Objetivo

Provar a jornada real: Detalhes → baixar e escolher destino → fila → pausar → reabrir → retomar → cancelar preservando catálogo.

## Contexto e dependências

S04 concluída; dependências reais disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Trocar adapters mockados pelos reais mantendo a UX. Demonstrar Download sobrevive ao restart e pode ser acompanhado e controlado. Exercitar todos os estados aplicáveis, incluindo recuperação e dados preservados.

## Fora de escopo

Usar mocks acidentais no caminho principal, alterar UX sem revisão e declarar funcionamento por build verde.

## Critérios de aceite

Baixar/pause/restart/resume funciona sem recheck global desnecessário; cancelamento preserva catálogo; apagar dados é confirmação distinta; download em background cede para playback; falta de espaço pausa escrita com feedback. Aplicam-se também os critérios comuns acima.

## Validação

Pausar/restart/retomar sem recheck global desnecessário; cancelar mantém Content; apagar dados exige outra confirmação; download concorrente cede ao playback; disco cheio pausa escrita. Registrar observação real no checkpoint funcional e aguardar decisão humana antes de S06.

## Evidências

[Validação](../evidence/INTEGRATION_VALIDATION.md),
`tests/download.electron.spec.ts`, `tests/download-service.spec.ts`,
`tests/download-ipc.spec.ts` e `tests/desktop-downloads.spec.ts`.

## Done When

Cumprido tecnicamente. Decisão humana permanece no checkpoint; S06–S08 não
foram iniciadas.
