# S01 — UI mockada — M20

Status: implementada e validada no frontend.

## Objetivo

Tornar inspecionável: Painel técnico mostra runtime e exporta diagnóstico sanitizado; usuário limpa históricos/logs seletivamente.

## Contexto e dependências

S00 concluída; execução frontend autorizada. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Construir as superfícies /settings/diagnostics; preview de export; confirmação de limpeza por categoria com boundary substituível: Diagnostics: snapshots torrent/player/Health/DB/cache, exportar pacote redigido, limpar categoria com retenção; unknown separado de zero; correlationIds sem secrets; coleta limitada. Fixtures selecionáveis para sem sessão; métrica desconhecida; zero real; coletando; exportando; falha; limpeza parcial; concluído; fluxo principal completo em memória.

## Fora de escopo

Rede, filesystem, persistência, processos/serviços reais e release.

## Critérios de aceite

Jornada principal navegável; todos estados do README reproduzíveis; metadata desconhecida não inventada; mocks explicitamente separados de adapters reais.

## Validação

Inspeção visual e checks frontend existentes pertinentes; comparar estados em 1080p/1440p/4K, registrar ambiente e limitações.

## Evidências

Evidências registradas no UPDATE e evidence/VALIDATION.md; somente frontend mockado.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
