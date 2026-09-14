# S07 — Desempenho e hardening

Status: DEFERRED. Preparar este arquivo não executa a story.

## Objetivo

Comprovar escala, responsividade e limites operacionais.

## Contexto e dependências

Ler [M04](../README.md). S06 concluída e protocolo S00/S03; NFRs primários e RX-011.

## Escopo

Medir corpus 100/1000/10000 Contents com 1/5 sources e 1000/10000/50000 episódios: cold/warm, UI pronta→dados visíveis, abertura p95, queries, cards montados e memória. Comparar budgets absolutos e baseline; inspecionar lotes/cursor sem N+1, FTS incremental e parsing/hashing/probing fora da UI. Exercitar nomes/paths hostis, rajadas watcher, permissão revogada, banco ocupado, imagens enormes/ausentes e provider offline. Validar foco/legibilidade com Windows/TV/gamepad e acessibilidade/reduced motion.

## Fora de escopo

Otimização sem medição, benchmark de swarm e tratar macOS/controle sintético como prova de hardware alvo.

## Critérios de aceite

Cold <2s, visibilidade local <300ms e p95 abertura <300ms nas condições normativas; warm <500ms tratado como meta de otimização. Resultados registram corpus/amostras/OS/hardware e ruído. Alterar um item não dispara reindexação global; riscos impeditivos permanecem abertos.

## Validação

Benchmarks reproduzíveis, traces/queries, injeção de falhas e roteiro físico separado; nenhum número é inferido de build verde.

## Evidências

PENDENTES. Registrar arquivos, comandos/resultados, ambiente e limitações ao executar esta story.

## Done When

Evidências e riscos resolvidos para auditoria S08; pendências impeditivas bloqueiam closure.
