# S05 — Integração da jornada — M18

Status: DONE localmente em 2026-09-14; ambiente físico pendente.

## Objetivo

Provar a jornada real: Moonlight → app --tv → navegar → Play → controlar tracks → desconectar → reconectar → sair.

## Contexto e dependências

S04 concluída; dependências reais disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Trocar adapters mockados pelos reais mantendo a UX. Demonstrar TV abre app, controla player, desconecta/reconecta e sai corretamente. Exercitar todos os estados aplicáveis, incluindo recuperação e dados preservados.

## Fora de escopo

Usar mocks acidentais no caminho principal, alterar UX sem revisão e declarar funcionamento por build verde.

## Critérios de aceite

Fluxo real em Windows/TV sem terminal/desktop/mouse; áudio/vídeo e hardware encode quando disponível; foco retorna após MPV; reconectar preserva estado; sair encerra helpers dentro de timeout. Aplicam-se também os critérios comuns acima.

## Validação

Windows/TV em LAN real: sem mouse/desktop/terminal exposto; áudio/vídeo/hardware encode quando disponível; desconectar/reconectar preserva posição; sair encerra helpers; registrar versões Sunshine/Moonlight e controle físico. Registrar observação real no checkpoint funcional e aguardar decisão humana antes de S06.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
