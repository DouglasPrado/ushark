# S07 — Hardening — M18

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Resolver riscos materiais de M18 com evidência.

## Contexto e dependências

S06 concluída. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Exercitar riscos: Detecção de sessão não especificada, permissões/foco Windows, overlay capturado incorretamente, dispositivos e versões diferentes. Validar limites de entrada/recursos, privacidade, recuperação, responsividade/foco e NFRs da cobertura nas superfícies introduzidas; segurança necessária já acompanha S04.

## Fora de escopo

Otimização sem medição, ampliar escopo e usar ambiente mockado como comprovação de plataforma alvo.

## Critérios de aceite

NFRs aplicáveis medidos com ambiente/corpus/amostras/limites; nenhuma regressão crítica ou pendência obrigatória escondida; erros têm recuperação; secrets não aparecem em logs.

## Validação

Ensaios dirigidos de falha, segurança e performance, incluindo Windows/TV em LAN real: sem mouse/desktop/terminal exposto; áudio/vídeo/hardware encode quando disponível; desconectar/reconectar preserva posição; sair encerra helpers; registrar versões Sunshine/Moonlight e controle físico. Usar budgets das fontes; definir baseline antes de medir, sem relaxar limites para passar.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
