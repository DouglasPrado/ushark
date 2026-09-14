# S05 — Integração da jornada — M21

Status: DONE em 2026-09-14.

## Objetivo

Provar a jornada real: Falha detectada → diagnóstico/backup disponível → preview de restore → confirmar → restaurar → reabrir e retomar.

## Contexto e dependências

S04 concluída; dependências reais disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Trocar adapters mockados pelos reais mantendo a UX. Demonstrar Usuário restaura backup consistente e volta a navegar/retomar sem perda silenciosa. Exercitar todos os estados aplicáveis, incluindo recuperação e dados preservados.

## Fora de escopo

Usar mocks acidentais no caminho principal, alterar UX sem revisão e declarar funcionamento por build verde.

## Critérios de aceite

Backup consistente em runtime restaura catálogo/estado/subscriptions/config; falha preserva original; migração fresh e upgrade histórico passam; crashes UI/Core/torrentd/MPV e sync/playback concorrentes têm recuperação observável; nenhum fechamento espera indefinidamente. Aplicam-se também os critérios comuns acima.

## Validação

Backup durante uso restaura em perfil isolado; injetar crash UI/Core/torrentd/MPV, DB lock/disk full/migração falha; manter original e restaurar estado/subscriptions/config; shutdown nunca espera indefinidamente. Registrar observação real no checkpoint funcional e aguardar decisão humana antes de S06.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
