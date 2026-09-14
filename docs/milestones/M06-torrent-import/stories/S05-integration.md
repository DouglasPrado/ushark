# S05 — Integração da jornada — M06

Status: DONE em 2026-09-14; checkpoint funcional preparado sem aprovação humana.

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

[Validação de integração](../evidence/INTEGRATION_VALIDATION.md). Jornada Electron
real, magnet público autorizado, persistência/restart, IPC e regressão afetada
foram executados. Windows/TV físico e empacotamento permanecem gates posteriores.

## Done When

Concluído no escopo S05: Movies consome o adapter real no Electron e browser
mantém mock explícito; `.torrent` e magnet reais, cancelamento/timeout/pendência,
dedup, falha isolada e restart possuem evidência. O checkpoint funcional está
READY_FOR_REVIEW/PENDING e S06–S08 não foram iniciadas.
