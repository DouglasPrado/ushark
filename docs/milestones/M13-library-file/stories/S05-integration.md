# S05 — Integração da jornada — M13

Status: DONE em 2026-09-14; integração Electron documentada em `../evidence/INTEGRATION_VALIDATION.md`.

## Objetivo

Provar a jornada real: Biblioteca → exportar → revisar pacote → importar em outro perfil → preview → confirmar → abrir offline.

## Contexto e dependências

S04 concluída; dependências reais disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Trocar adapters mockados pelos reais mantendo a UX. Demonstrar .tslib exportado abre em outro perfil local com preview, layout e identidade preservados. Exercitar todos os estados aplicáveis, incluindo recuperação e dados preservados.

## Fora de escopo

Usar mocks acidentais no caminho principal, alterar UX sem revisão e declarar funcionamento por build verde.

## Critérios de aceite

Roundtrip offline entre dois catálogos sem DB original; IDs/referências/ordem preservados; pacote malicioso não muda catálogo; traversal/symlink/ZIP bomb/HTML/CSS/scripts rejeitados; extensões desconhecidas não executam; versões incompatíveis têm erro explícito. Aplicam-se também os critérios comuns acima.

## Validação

Roundtrip offline em dois catálogos sem DB original; IDs/ordem/layout iguais; rejeitar traversal, symlink, ZIP bomb, HTML/CSS/scripts e payload incompatível sem modificar catálogo. Registrar observação real no checkpoint funcional e aguardar decisão humana antes de S06.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
