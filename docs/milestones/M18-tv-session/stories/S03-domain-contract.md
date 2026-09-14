# S03 — Contrato de domínio — M18

Status: DONE em 2026-09-14.

## Objetivo

Derivar o contrato mínimo de M18 da experiência aprovada.

## Contexto e dependências

UX M01–M22 aprovada; execução autorizada; dependências de integração M05, M07 disponíveis conforme ondas do plano. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

TvSession: sinal de conexão verificável, política pause/continue, handoff de foco entre UI/MPV, input hotplug e shutdown limitado; versões suportadas e origem do sinal explícitas. Definir operações, DTOs, ownership, eventos/snapshots, unidades, limites, erros, transações e invariantes; fechar decisões: D11/D12/D18: sinal de sessão e matriz física em S03; falta de hardware não é validação por mock.

## Fora de escopo

Código/adapters e schema total do projeto; promover exemplos a defaults sem decisão.

## Critérios de aceite

Cada ação da UX tem contrato de sucesso/falha/cancelamento; identidade e dados pessoais preservados; limites verificáveis; decisão pendente que afete integração resolvida antes de S04.

## Validação

Revisão de contratos com fixtures UX e contra cenários reais planejados: Windows/TV em LAN real: sem mouse/desktop/terminal exposto; áudio/vídeo/hardware encode quando disponível; desconectar/reconectar preserva posição; sair encerra helpers; registrar versões Sunshine/Moonlight e controle físico.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
