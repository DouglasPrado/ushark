# S03 — Contrato de domínio — M20

Status: DONE em 2026-09-14.

## Objetivo

Derivar o contrato mínimo de M20 da experiência aprovada.

## Contexto e dependências

UX M01–M22 aprovada; execução autorizada; dependências de integração M10, M11, M16, M18, M19 disponíveis conforme ondas do plano. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Diagnostics: snapshots torrent/player/Health/DB/cache, exportar pacote redigido, limpar categoria com retenção; unknown separado de zero; correlationIds sem secrets; coleta limitada. Definir operações, DTOs, ownership, eventos/snapshots, unidades, limites, erros, transações e invariantes; fechar decisões: S03: campos sensíveis, limites/retention e métricas disponíveis; telemetria remota não autorizada.

## Fora de escopo

Código/adapters e schema total do projeto; promover exemplos a defaults sem decisão.

## Critérios de aceite

Cada ação da UX tem contrato de sucesso/falha/cancelamento; identidade e dados pessoais preservados; limites verificáveis; decisão pendente que afete integração resolvida antes de S04.

## Validação

Revisão de contratos com fixtures UX e contra cenários reais planejados: Dados de runtimes reais comparados ao painel; inspecionar archive com tokens/magnets/paths sintéticos para comprovar redação; limpar logs não apaga biblioteca/progresso; medir overhead e rotação.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
