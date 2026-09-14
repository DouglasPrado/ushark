# S05 — Integração da jornada — M08

Status: DONE; integração real comprovada e checkpoint funcional preparado.

## Objetivo

Provar a jornada real: Detalhes → fontes medindo → comparar → preferência ou override → Play → retirar override.

## Contexto e dependências

S04 concluída; dependências reais disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Trocar adapters mockados pelos reais mantendo a UX. Demonstrar Details mostra medição progressiva e a escolha automática respeita preferências e limites reais. Exercitar todos os estados aplicáveis, incluindo recuperação e dados preservados.

## Fora de escopo

Usar mocks acidentais no caminho principal, alterar UX sem revisão e declarar funcionamento por build verde.

## Critérios de aceite

Play permitido durante medição; arquivo local funciona sem health de rede; ranking determinístico com reason codes; usuário pode retirar override; 4K inviável não vence por resolução; sem flicker; ranking local <10ms no conjunto controlado. Aplicam-se também os critérios comuns acima.

## Validação

Fixtures determinísticas de ranking incluindo menor tamanho, qualidade máxima inviável e fonte local; ranking <10ms sem probes; confirmar escolha com player e cancelar preflight ao sair sem flicker. Registrar observação real no checkpoint funcional e aguardar decisão humana antes de S06.

## Evidências

[Validação de integração](../evidence/INTEGRATION_VALIDATION.md),
`tests/source-selection.electron.spec.ts`, `tests/desktop-selection.spec.ts` e
`tests/source-selection-ipc.spec.ts`.

## Done When

Cumprido tecnicamente. A decisão humana permanece no checkpoint funcional;
S06–S08 não foram iniciadas.
