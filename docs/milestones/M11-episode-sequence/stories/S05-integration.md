# S05 — Integração da jornada — M11

Status: DONE em 2026-09-14; jornada integrada ao Electron.

## Objetivo

Provar a jornada real: Fim de episódio → countdown → tocar agora ou cancelar → próximo episódio → último episódio sem continuação.

## Contexto e dependências

S04 concluída; dependências reais disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Trocar adapters mockados pelos reais mantendo a UX. Demonstrar Countdown cancelável e próximo episódio correto, com preflight limitado. Exercitar todos os estados aplicáveis, incluindo recuperação e dados preservados.

## Fora de escopo

Usar mocks acidentais no caminho principal, alterar UX sem revisão e declarar funcionamento por build verde.

## Critérios de aceite

Autoplay desligado não inicia próximo; cancelamento funciona; pack reutiliza sessão; próximo episódio não rouba banda do atual; episódio ausente possui saída recuperável. Aplicam-se também os critérios comuns acima.

## Validação

Desligar autoplay impede início; cancelar até o limite definido não toca próximo; pack reutiliza sessão; banda do atual não é roubada; especial/episódio ausente não seleciona conteúdo errado. Registrar observação real no checkpoint funcional e aguardar decisão humana antes de S06.

## Evidências

[Validação](../evidence/INTEGRATION_VALIDATION.md): IPC, adapter e ensaio
Electron real; 6/6 casos focados passaram.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
