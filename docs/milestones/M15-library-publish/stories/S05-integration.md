# S05 — Integração da jornada — M15

Status: DONE em 2026-09-14; integração controlada, produção pendente.

## Objetivo

Provar a jornada real: Draft → diff e preview → publicar explicitamente → upload → versão imutável → copiar link/código → nova versão ou retirada.

## Contexto e dependências

S04 concluída; dependências reais disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Trocar adapters mockados pelos reais mantendo a UX. Demonstrar Autor publica versão imutável, recebe link/código e revisa mudanças da próxima publicação. Exercitar todos os estados aplicáveis, incluindo recuperação e dados preservados.

## Fora de escopo

Usar mocks acidentais no caminho principal, alterar UX sem revisão e declarar funcionamento por build verde.

## Critérios de aceite

Somente editor autorizado publica; vN não muda; falha de upload não deixa versão apontando para blob incompleto; conflito simultâneo é explícito; link resolve snapshot; conteúdo audiovisual/estado pessoal não é enviado. Aplicam-se também os critérios comuns acima.

## Validação

Ambiente de teste: editor autorizado publica, não editor rejeitado; falha de upload não aponta a blob incompleto; concorrência retorna conflito; vN imutável; retirada não apaga instalações locais. Registrar observação real no checkpoint funcional e aguardar decisão humana antes de S06.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
