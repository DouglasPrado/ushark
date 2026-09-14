# S05 — Integração da jornada — M20

Status: DONE em 2026-09-14.

## Objetivo

Provar a jornada real: Configurações → diagnóstico opcional → inspecionar métricas → preview sanitizado → exportar → limpar categoria.

## Contexto e dependências

S04 concluída; dependências reais disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Trocar adapters mockados pelos reais mantendo a UX. Demonstrar Painel técnico mostra runtime e exporta diagnóstico sanitizado; usuário limpa históricos/logs seletivamente. Exercitar todos os estados aplicáveis, incluindo recuperação e dados preservados.

## Fora de escopo

Usar mocks acidentais no caminho principal, alterar UX sem revisão e declarar funcionamento por build verde.

## Critérios de aceite

Dados reais distinguem desconhecido de zero; export não inclui secrets/magnets privados/paths pessoais; logs e histórico não crescem sem limite; limpeza não apaga biblioteca; UI técnica é opcional. Aplicam-se também os critérios comuns acima.

## Validação

Dados de runtimes reais comparados ao painel; inspecionar archive com tokens/magnets/paths sintéticos para comprovar redação; limpar logs não apaga biblioteca/progresso; medir overhead e rotação. Registrar observação real no checkpoint funcional e aguardar decisão humana antes de S06.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
