# Contrato persistente de configuração — M01/S03

Status: LOCAL_VALIDATED. Versões iniciais: protocolo IPC `1`, schema de configuração `1`.

## Decisão

M01 usa persistência SQLite local, acessível somente pelo processo privilegiado do Electron. O renderer continua dependente de `ConfigurationService`; no navegador, o mesmo contrato usa `MockConfigurationService`. Não foram introduzidos catálogo, torrent, player, provider, sync ou tabelas de milestones futuros.

O estado persistente é um `ConfigurationSnapshot` com:

- `schemaVersion: 1`;
- `completed`, gravado atomicamente junto da configuração na conclusão do onboarding;
- `configuration`, contendo `libraryId`, nome, paths, limite/política de cache e preferências;
- `recovery` opcional, usado quando um snapshot existente não pode ser validado.

A biblioteca vazia possui somente identidade estável, nome e diretório raiz. Dados de filmes, séries, sources, memberships e estado de reprodução permanecem fora de M01.

## Operações

`read`, `save`, `resetPlayback` e `chooseDirectory` são as únicas capacidades expostas. `save` aceita `completeOnboarding: true`; `resetPlayback` restaura apenas preferências de reprodução e preserva biblioteca, paths, cache e conclusão. `chooseDirectory` aceita somente `library` ou `cache` e retorna um path escolhido pelo diálogo nativo ou `null` quando cancelado.

Todos os resultados IPC usam uma união `ok/value` ou `ok/error`. Códigos públicos: `CONFIG_INVALID`, `CONFIG_NOT_WRITABLE`, `CONFIG_PROTOCOL_UNSUPPORTED`, `CONFIG_STORAGE_FAILED` e `CONFIG_UNAUTHORIZED`. A UI recebe mensagem recuperável, sem stack, SQL ou path interno do banco.

## Atomicidade e compatibilidade

O banco usa migration versionada, WAL, `busy_timeout`, foreign keys e uma transação `BEGIN IMMEDIATE` para atualizar a biblioteca vazia e o snapshot. Em falha, ocorre rollback e o snapshot anterior permanece legível. Schema/protocolo desconhecido falha fechado. Um snapshot inválido no startup não é aplicado: defaults seguros são apresentados com aviso de recuperação, e uma gravação confirmada substitui o valor inválido.

## Diretórios e trust boundary

Defaults desktop ficam em diretórios gerenciados sob `userData`. Antes do commit, library/cache devem ser paths absolutos, distintos, sem NUL, com tamanho limitado, diretórios reais ou criáveis e acessíveis ao usuário atual. O renderer não recebe `fs`, SQL, canais IPC genéricos ou Node irrestrito. O main aceita chamadas somente do `webContents` da janela criada e valida versão, método e payload.

## Fontes e gates

- A11 §§35–49, 69–76 e 83–90: entrada progressiva da persistência, Fake→Real e preservação da UX.
- A06 §§52–53, 69–79 e 88–104: settings/migrations, transações, recovery e versionamento.
- A08 §§21, 31–38 e 42: preload mínimo, validação fail-closed e desktop endurecido.
- A09 §§1–13: feedback, recovery, foco e navegação TV/gamepad-first preservados.

Validação S03: tipos estritos, mock compatível e revisão do contrato contra a UX aprovada. A implementação e as provas de disco/IPC pertencem a S04/S05.
