# S06 — Testes da jornada — M19

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Consolidar regressões que protegem fallback compatível retoma posição e histórico ajuda decisões futuras sem depender de servidor.

## Contexto e dependências

S05 e checkpoint funcional aprovados. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Cobrir invariantes de domínio/contrato, falhas de adapters e E2E pertinentes. Casos obrigatórios: Retirar peers de source controlada; auto-switch off não troca; outra edição não troca automaticamente; seek concorrente usa posição correta; cooldown impede loop; expiração reduz peso do histórico. Reutilizar checks das stories anteriores e rastrear requisitos individuais.

## Fora de escopo

Testes que espelham implementação sem detectar risco, duplicação de suíte e serviços públicos não controlados.

## Critérios de aceite

Suíte detecta quebra das invariantes específicas; fixtures isoladas/reprodutíveis; falhas relevantes e dados confirmados cobertos; resultados e ambiente registrados.

## Validação

Rodar apenas suites/gates pertinentes existentes; repetir após mudança/falha, distinguindo testes unitários, integração real e inspeção física.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
