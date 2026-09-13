# S03 — Contrato mínimo de configuração

Status: PLANNED. Preparação documental; não executada.

## Objetivo

Derivar o contrato persistente da experiência aprovada.

## Contexto e requisitos

FR-001, FR-187–193, FR-214–218; NFR-137–138; RX-057.

Ler [M01](../README.md), [plano aprovado](../../PLAN.md#m01), [matriz](../../REQUIREMENTS_COVERAGE.md), [A11 frontend-first](../../../architecture/11-frontend-first-project-setup.md), [A09 UX](../../../architecture/09-ux-navigation-spec.md) e [A08 segurança](../../../architecture/08-security-model.md), apenas nas seções aplicáveis. Contratos/integração também consultam A06 §§69–79 e 88–104 quando persistência for necessária.

## Dependências

UX de M01 e UX principal M01–M18 aprovadas, conforme onda B.

## Escopo

DTOs de configuração/biblioteca vazia; leitura/salvamento/reset seletivo, validação de diretórios, defaults e erros recuperáveis. Definir atomicidade, compatibilidade, diretórios gerenciados e boundary preload estritamente necessário.

## Fora de escopo

RPC torrentd, schema total de catálogo, provider, player ou solução de sync.

## Critérios de aceite

Cada operação referencia ação aprovada da UI; política de reset e falha parcial é explícita; biblioteca tem libraryId/nome/pasta; nenhuma tabela de domínio futuro é criada; contrato substitui mock sem alteração arbitrária da UX.

## Validação

Cotejar contrato com evidência UX; revisar serialização, paths e erros; registrar decisão de armazenamento mínima sem instalar componentes neste contrato.

## Evidências

Ainda não existem evidências de execução. Registrar arquivos alterados, comandos/resultados, ambiente e demonstração pertinente quando a story for executada.

## Conclusão

Aceite e validação satisfeitos, com evidências e revisão/gates aplicáveis. Preparar este arquivo não conclui a story. Implementação permanece dependente de autorização de execução e dos checkpoints indicados.
