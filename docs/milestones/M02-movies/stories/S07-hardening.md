# S07 — Consolidar segurança, offline e imagens

Status: DEFERRED. Preparar este arquivo não conclui a story.

## Objetivo

Comprovar os NFRs do catálogo real.

## Contexto e dependências

Ler [M02](../README.md) e apenas as fontes aplicáveis: S06 concluída; A08 segurança e NFRs de M02.

## Escopo

Validar fronteiras IPC/provider/imagens/paths, isolamento do renderer e estado local. Medir poster cacheado dimensionado (meta <50 ms), variantes adequadas e carregamento progressivo sem bloquear foco. Exercitar falha provider, disco cheio, concorrência/WAL e migração recuperável. Inspecionar navegação e legibilidade Windows/TV/gamepad.

## Fora de escopo

Infra global/release, otimização sem medição e tratar teste macOS como prova Windows.

## Critérios de aceite

NFRs de M02 têm evidência ou bloqueio explícito; metadata/imagens offline funcionam, enriquecimento não bloqueia e nenhuma entrada atravessa fronteira sem validação. Baseline/corpus e limites de medição registrados.

## Validação

Ensaios direcionados de segurança, performance e recuperação; controles físicos e plataforma alvo registrados separadamente.

## Evidências

PENDENTES. Registrar arquivos, comandos/resultados e ambiente após execução em UPDATE e nos checkpoints correspondentes.

## Conclusão

Riscos materiais resolvidos e evidências suficientes para closure; pendência obrigatória impede DONE.
