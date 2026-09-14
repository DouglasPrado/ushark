# S07 — Hardening e escala

Status: DEFERRED. Preparar este arquivo não executa a story.

## Objetivo

Comprovar os NFRs e limites operacionais do catálogo real de séries.

## Contexto e dependências

Ler [M03](../README.md) e apenas as fontes aplicáveis: S06 concluída, NFR-080 e fronteiras de segurança/IPC já aprovadas.

## Escopo

Medir queries, paginação, memória e renderização com dezenas de milhares de episódios; verificar índices e ausência de scan global no fluxo. Exercitar paths/nomes hostis, payloads grandes, arquivos desaparecidos, provider offline, banco ocupado e migração recuperável. Inspecionar legibilidade, foco e navegação Windows/TV/gamepad.

## Fora de escopo

Otimização sem medição, benchmark do torrent scheduler, infra global/release e tratar macOS/controle sintético como prova de hardware alvo.

## Critérios de aceite

NFR-080 possui corpus, ambiente, métricas e limites registrados; nenhum input atravessa fronteira sem validação; erros preservam catálogo e mappings. Pendência obrigatória permanece explícita e impede closure.

## Validação

Ensaios direcionados de escala, segurança e recuperação; perfis e plataformas registrados separadamente.

## Evidências

PENDENTES. Registrar comandos, resultados, traces/medições e limitações ao executar S07.

## Done When

Riscos materiais resolvidos e evidências suficientes para S08.
