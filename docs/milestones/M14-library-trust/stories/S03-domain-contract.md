# S03 — Contrato de domínio — M14

Status: DONE em 2026-09-14; contrato e ciclo da chave registrados.

## Objetivo

Derivar o contrato mínimo de M14 da experiência aprovada.

## Contexto e dependências

UX M01–M22 aprovada; execução autorizada; dependências de integração M13 disponíveis conforme ondas do plano. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

LibraryTrust: verificar payload canônico/hash/assinatura, consultar/aceitar pin explícito, assinar com chave em secure storage; resultado não confunde autenticidade com direitos. Definir operações, DTOs, ownership, eventos/snapshots, unidades, limites, erros, transações e invariantes; fechar decisões: S03: perda/rotação/backup de chave e algoritmo vigente; Ed25519 planejado conforme fontes, sem gerar chaves agora.

## Fora de escopo

Código/adapters e schema total do projeto; promover exemplos a defaults sem decisão.

## Critérios de aceite

Cada ação da UX tem contrato de sucesso/falha/cancelamento; identidade e dados pessoais preservados; limites verificáveis; decisão pendente que afete integração resolvida antes de S04.

## Validação

Revisão de contratos com fixtures UX e contra cenários reais planejados: Modificar bytes invalida assinatura; chave diferente nunca entra silenciosamente; não assinado é identificado; roundtrip preserva assinatura; verificar ausência de chave privada em DB/logs.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
