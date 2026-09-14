# S03 — Contrato de catálogo e identidade

Status: DEFERRED. Preparar este arquivo não conclui a story.

## Objetivo

Formalizar o domínio mínimo exigido pela UX aprovada.

## Contexto e dependências

Ler [M02](../README.md) e apenas as fontes aplicáveis: UX M01–M22 aprovada; M01 integrado antes do consumo real. A06 §§11–13, 100–104, 115–122; D03/D19.

## Escopo

Definir Content, IDs externos, membership/ordem, Source declarada, metadata, imagens e estado pessoal separados. Especificar queries/comandos do boundary, erros, transações e merge explícito local→canônico com política conservadora para progresso/favoritos/histórico/overrides dos dois lados. Formalizar refresh sem troca de identidade, precedência de apresentação e remoção de vínculo versus arquivo; validar limites de entradas e paths antes de adapters reais.

## Fora de escopo

Schema completo de séries/Registry/torrent, implementação e extensão global de edição sem escopo aprovado.

## Critérios de aceite

Cada operação da UI possui contrato, falhas e invariantes; D03/D19 resolvidas documentalmente. Merge não renomeia PK silenciosamente; conflitos não descartam estado. DTOs distinguem ausência de fonte, indisponibilidade e erro.

## Validação

Revisão do contrato contra fixtures/UX, matriz de preservação e casos de conflito; registrar decisões em docs/decisions quando necessárias.

## Evidências

PENDENTES. Registrar arquivos, comandos/resultados e ambiente após execução em UPDATE e nos checkpoints correspondentes.

## Conclusão

Contratos e políticas suficientes para S04, com decisões rastreáveis.
