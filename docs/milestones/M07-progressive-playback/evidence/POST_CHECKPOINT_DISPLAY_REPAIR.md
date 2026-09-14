# Reparo pós-checkpoint — importação até exibição

Data: 2026-09-14.

## Falhas reproduzidas

- o merge do Content importado para a identidade canônica movia
  `content_sources`, mas deixava `content_source_selectors` no Content antigo;
  o `ON DELETE CASCADE` removia a seleção do arquivo;
- o índice de descoberta confundia source torrent disponível para stream com
  arquivo local completo e encaminhava a ação ao player M05;
- `stream.ready` podia chegar antes da resposta inicial de `prepare`, ser
  sobrescrito pelo snapshot `buffering` e terminar em timeout;
- o cancelamento do primeiro efeito em React Strict Mode podia acontecer
  enquanto a source ainda era resolvida e deixar uma sessão MPV concorrente.

## Correções

- o merge M02 migra seletores torrent de forma transacional e preserva o
  seletor já existente no destino em caso de duplicata;
- `DiscoverySourceSnapshot.localFileAvailable` separa disponibilidade de rede
  da existência de arquivo local gerenciado;
- o adapter progressivo conserva o evento mais recente por sessão e aceita o
  `ready` antecipado;
- o Core reaplica o cancelamento depois das etapas assíncronas de resolução e
  descrição, antes de criar player ou sessão.

## Validação

- 20/20 testes focalizados de catálogo, descoberta, merge, adapter progressivo
  e jornadas de stream passaram;
- 6/6 testes do serviço progressivo e adapter passaram, incluindo MPV real e
  cancelamento durante resolução;
- `pnpm typecheck` passou;
- no banco real do usuário, o seletor `file:3` foi recuperado após backup e a
  página passou de player local incorreto para preparação progressiva;
- no teste Electron/macOS em modo TV, houve um único processo MPV ativo, com o
  arquivo parcial gerenciado carregado, `pause=false` e posição avançando.

O checkpoint continua `READY_FOR_REVIEW/PENDING`. Esta evidência não substitui
aceite humano nem a validação física Windows/TV/Moonlight.
