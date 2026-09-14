# S05 — Integração da jornada — M12

Status: DONE em 2026-09-14; editor integrado ao runtime Electron real.

## Objetivo

Provar a jornada real: Bibliotecas → criar draft → identidade → conteúdos/fontes → coleções/seções → reordenar → preview → salvar.

## Contexto e dependências

S04 concluída; dependências reais disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Trocar adapters mockados pelos reais mantendo a UX. Demonstrar Draft persistido com identidade, coleções/seções e preview fiel. Exercitar todos os estados aplicáveis, incluindo recuperação e dados preservados.

## Fora de escopo

Usar mocks acidentais no caminho principal, alterar UX sem revisão e declarar funcionamento por build verde.

## Critérios de aceite

Reordenar/renomear preserva IDs; salvar e reabrir mantém draft; preview reproduz layout; estado pessoal não compõe dados exportáveis; curadoria não força runtime nem muda Content global. Aplicam-se também os critérios comuns acima.

## Validação

Reabrir mantém IDs/ordem/draft; preview equivale ao layout; reordenar não altera Content global; inspecionar payload sem estado pessoal; salvar não publica nem inicia torrent. Registrar observação real no checkpoint funcional e aguardar decisão humana antes de S06.

## Evidências

[Validação](../evidence/INTEGRATION_VALIDATION.md), incluindo persistência após
restart e ausência de controles sintéticos no caminho desktop.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
