# S05 — Integração da jornada — M19

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Provar a jornada real: Fonte degrada → informar alternativa → confirmar ou auto-switch permitido → preparar → trocar → retomar posição.

## Contexto e dependências

S04 concluída; dependências reais disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Trocar adapters mockados pelos reais mantendo a UX. Demonstrar Fallback compatível retoma posição e histórico ajuda decisões futuras sem depender de servidor. Exercitar todos os estados aplicáveis, incluindo recuperação e dados preservados.

## Fora de escopo

Usar mocks acidentais no caminho principal, alterar UX sem revisão e declarar funcionamento por build verde.

## Critérios de aceite

Source lenta/sem peers produz retry/alternativa; auto-switch off impede troca; incompatibilidade de edição impede handoff automático; posição preservada; override original não apagado; histórico antigo perde peso; não há loop de troca. Aplicam-se também os critérios comuns acima.

## Validação

Retirar peers de source controlada; auto-switch off não troca; outra edição não troca automaticamente; seek concorrente usa posição correta; cooldown impede loop; expiração reduz peso do histórico. Registrar observação real no checkpoint funcional e aguardar decisão humana antes de S06.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
