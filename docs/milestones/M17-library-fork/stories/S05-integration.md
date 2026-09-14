# S05 — Integração da jornada — M17

Status: DONE em 2026-09-14.

## Objetivo

Provar a jornada real: Biblioteca assinada → duplicar → novo nome → editar cópia → atualizar origem → comparar independência.

## Contexto e dependências

S04 concluída; dependências reais disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Trocar adapters mockados pelos reais mantendo a UX. Demonstrar Fork possui novo ID, mantém apresentação e reutiliza conteúdos sem seguir updates da origem. Exercitar todos os estados aplicáveis, incluindo recuperação e dados preservados.

## Fora de escopo

Usar mocks acidentais no caminho principal, alterar UX sem revisão e declarar funcionamento por build verde.

## Critérios de aceite

Fork transacional com novo libraryId; origem atualizada não altera cópia; Content/Source não duplicados; edição pessoal não muda remote; cancelar não cria cópia parcial. Aplicam-se também os critérios comuns acima.

## Validação

Novo libraryId, mesmos Contents/Sources; atualização da origem não muda cópia; editar cópia não muda origem; cancelamento/falha não deixa parcial; GC mantém assets ainda usados. Registrar observação real no checkpoint funcional e aguardar decisão humana antes de S06.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
