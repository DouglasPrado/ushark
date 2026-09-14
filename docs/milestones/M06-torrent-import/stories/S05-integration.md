# S05 — Integração da jornada — M06

Status: DEFERRED; preparada documentalmente, não executada.

## Objetivo

Provar a jornada real: Adicionar → magnet ou torrent → resolver metadata → revisar arquivos → escolher selector → confirmar ou salvar pendente → retry.

## Contexto e dependências

S04 concluída; dependências reais disponíveis. Ler [README](../README.md), [cobertura](../PREPARATION_COVERAGE.md) e apenas recortes de produto/arquitetura referidos pelos requisitos desta story.

## Escopo

Trocar adapters mockados pelos reais mantendo a UX. Demonstrar Usuário importa, revisa arquivos e mantém tentativa pendente para retry. Exercitar todos os estados aplicáveis, incluindo recuperação e dados preservados.

## Fora de escopo

Usar mocks acidentais no caminho principal, alterar UX sem revisão e declarar funcionamento por build verde.

## Critérios de aceite

Importar ambos os formatos, cancelar e salvar pendente; entradas maliciosas rejeitadas; fonte reutilizada sem runtime redundante; UI continua disponível após falha do daemon; IPC local validado e autenticado conforme transporte. Aplicam-se também os critérios comuns acima.

## Validação

Usar torrent e magnet autorizados com metadata e sem peers; cancelar/repetir/reabrir pendente; mesmo hash com selectors distintos reutiliza sessão; derrubar daemon mantém UI; rejeitar bencode hostil e paths fora do sandbox. Registrar observação real no checkpoint funcional e aguardar decisão humana antes de S06.

## Evidências

Pendentes de execução. Registrar arquivos, comandos/resultados, ambiente, observações e limitações no UPDATE e checkpoint pertinente. Preparação documental não é evidência funcional.

## Done When

Critérios de aceite e validação satisfeitos, com evidências suficientes e dependências/gates desta story atendidos; STATE/UPDATE sincronizados. Preparar este arquivo não conclui a story.
