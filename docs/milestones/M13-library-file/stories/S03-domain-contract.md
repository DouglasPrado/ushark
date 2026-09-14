# S03 — Contrato de domínio — M13

Status: DONE em 2026-09-14; contrato e decisões registrados em `../evidence/DOMAIN_CONTRACT.md`.

## Objetivo

Derivar o contrato mínimo de M13 da experiência aprovada.

## Contexto e dependências

UX M01–M22 aprovada; execução autorizada; dependências de integração M12, M04 disponíveis conforme ondas do plano. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

LibraryPackage: serializar snapshot canônico, validar/stage pacote, preview e commit atômico; schema/version/hash, limites e referências; sem mídia/estado pessoal; assinatura presente exige verificação suportada. Definir operações, DTOs, ownership, eventos/snapshots, unidades, limites, erros, transações e invariantes; fechar decisões: D04/D08/D14/D21/D22: forma v1, limites e allowlists em S03; até M14 rejeitar assinatura não verificável.

## Fora de escopo

Código/adapters e schema total do projeto; promover exemplos a defaults sem decisão.

## Critérios de aceite

Cada ação da UX tem contrato de sucesso/falha/cancelamento; identidade e dados pessoais preservados; limites verificáveis; decisão pendente que afete integração resolvida antes de S04.

## Validação

Revisão de contratos com fixtures UX e contra cenários reais planejados: Roundtrip offline em dois catálogos sem DB original; IDs/ordem/layout iguais; rejeitar traversal, symlink, ZIP bomb, HTML/CSS/scripts e payload incompatível sem modificar catálogo.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
