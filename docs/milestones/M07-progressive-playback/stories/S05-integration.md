# S05 — Integração da jornada — M07

Status: DONE em 2026-09-14; checkpoint funcional aberto sem aprovação inferida.

## Objetivo

Provar a jornada real: Detalhes → Play parcial → buffering → primeiro frame → seek fora do cache → retomar → sair.

## Contexto e dependências

S04 concluída; dependências reais disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Trocar adapters mockados pelos reais mantendo a UX. Demonstrar Filme e episódio tocam parcialmente; seek descarta trabalho antigo e reconstrói buffer. Exercitar todos os estados aplicáveis, incluindo recuperação e dados preservados.

## Fora de escopo

Usar mocks acidentais no caminho principal, alterar UX sem revisão e declarar funcionamento por build verde.

## Critérios de aceite

Play antes de completar e seek fora do cache comprovados; seeks rápidos respeitam última geração; season pack prioriza episódio atual; nenhum arquivo ativo é limpo; UI não bloqueia; startup 1–5s e seek 1–3s medidos em source saudável controlada. Aplicam-se também os critérios comuns acima.

## Validação

Filme e episódio de pack incompletos tocam; seek fora do cache e três seeks rápidos reproduzem a última posição; medir primeiro frame 1–5s/seek 1–3s em swarm controlado; inspecionar prioridade e limites RAM/disco. Registrar observação real no checkpoint funcional e aguardar decisão humana antes de S06.

## Evidências

[Validação integrada](../evidence/INTEGRATION_VALIDATION.md): Electron usa IPC
real e `DesktopProgressivePlayer`; swarm local iniciou primeiro frame em
2.764 ms com 31/174 pieces, seek fora do cache em 509 ms e geração 4 venceu
três seeks rápidos. Suíte focada: **27/27**.

## Done When

Cumprido no ambiente local controlado. Windows/TV/Moonlight e controle físico
permanecem como validação humana/ambiental do checkpoint; S06–S08 não foram
iniciados.
