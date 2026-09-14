# M06 — D05/D08/D22: contrato de inspeção torrent v1

Status: ACCEPTED para implementação S04/S05 em 2026-09-14.

## Contexto

M06 precisa aceitar magnet e `.torrent` não confiáveis, resolver metadata em um
processo isolado e permitir que conteúdos diferentes apontem para arquivos
distintos do mesmo torrent. O contrato também precisa sobreviver a reload da UI,
timeout, cancelamento e indisponibilidade do daemon sem vazar caminhos locais ou
magnet completo para o renderer/logs.

## D05 — identidade e deduplicação

- `contentId`, `sourceId`, `contentSourceId`, `torrentId` e `operationId` são
  identidades diferentes.
- `torrentId` representa a sessão/runtime e é deduplicado pelo `infoHash` SHA-1
  v1 normalizado em hexadecimal minúsculo.
- `sourceId` referencia o torrent persistido; um mesmo source pode ser associado
  a mais de um conteúdo.
- `ContentSourceSelector` pertence à relação `contentSourceId`, não ao runtime.
  Assim, dois episódios podem reutilizar a mesma sessão e selecionar arquivos
  diferentes sem serem fundidos.
- Uma confirmação repetida com a mesma `idempotencyKey` devolve o mesmo efeito.
  Conflitos de identidade falham antes da mutação.

## D08 — limites v1

Todos os limites são aplicados antes de alocação relevante e novamente em cada
fronteira. Valores em bytes usam UTF-8 ou bytes do arquivo, conforme o campo.

| Fronteira                 |            Limite |
| ------------------------- | ----------------: |
| Magnet                    | 4.096 bytes UTF-8 |
| Arquivo `.torrent`        |            10 MiB |
| Profundidade bencode      |                64 |
| Nós bencode               |           200.000 |
| Arquivos declarados       |            10.000 |
| Componentes por path      |                64 |
| Componente de path        |   255 bytes UTF-8 |
| Path relativo normalizado | 4.096 bytes UTF-8 |
| Tamanho total declarado   |            16 TiB |
| Pieces                    |         4.000.000 |
| Mensagem RPC JSON         |             1 MiB |
| Eventos por lote          |               128 |
| Nome exibível             |   512 bytes UTF-8 |

Magnet aceita somente scheme `magnet:`, um único `xt=urn:btih:` válido em hex
de 40 caracteres ou Base32 de 32 caracteres, e parâmetros `dn`, `tr`, `xl` e
`xs`. Parâmetros desconhecidos ou duplicidade conflitante de `xt` falham.
Trackers são limitados pelo tamanho total e o magnet completo nunca é logado.

O parser bencode é estrito: inteiros canônicos, dicionários com chaves ordenadas
e sem duplicatas, strings com tamanho declarado válido e EOF exato. `pieces`
precisa ter comprimento múltiplo de 20. Tamanhos negativos, overflow, estruturas
single-file/multi-file simultâneas e total declarado acima do limite falham.

## D22 — containment e staging

- O renderer não envia nem recebe path local. O picker nativo do Core retorna um
  `selectionId` opaco e descartável.
- O Core abre a seleção, copia para arquivo temporário dedicado no diretório
  gerenciado, fecha/sincroniza, renomeia atomicamente e só então valida a cópia.
- Cada path interno do torrent é validado por componentes. Rejeitar componente
  vazio, `.`, `..`, NUL, separadores embutidos, absoluto POSIX, drive Windows,
  UNC, URL/file URI e limites excedidos.
- Para arquivos host existentes, containment usa `lstat`/`realpath` em cada
  ancestral e `path.relative(root, candidate)`: o resultado não pode ser vazio
  quando um filho é exigido, começar com `..` nem ser absoluto. Symlink é
  rejeitado. Comparar apenas `startsWith(root)` é proibido, inclusive para casos
  como `/root-safe-evil`.
- Falha ou cancelamento remove somente temporários pertencentes à operação.
  O original escolhido pelo usuário nunca é alterado ou apagado.

## Operações e lifecycle

`start` retorna rapidamente um snapshot com `operationId`. Progresso chega por
eventos versionados e pode ser reconstruído por `get`; críticos carregam snapshot
completo limitado. A primeira página contém até 128 arquivos e páginas seguintes
são obtidas por `getFiles`, mantendo cada mensagem abaixo de 1 MiB. Métricas podem
usar latest-value. `cancel`, `savePending`, `retry` e `confirm` são explícitos.
Soft timeout informa demora; hard timeout deixa a tentativa salvável/repetível.
Falha do daemon preserva UI e estado persistido.

Core e daemon negociam protocolo/capabilities. O transporte é local e allowlisted;
Named Pipe deve restringir ao usuário atual. Se TCP loopback for inevitável, usa
secret efêmero por startup. Vídeo, blob `.torrent`, paths locais e magnet completo
não atravessam o IPC JSON.

## Consequências

Os budgets são conservadores e podem exigir nova versão de schema/protocolo para
ampliação incompatível. BitTorrent v2/híbrido não faz parte de M06 v1. Metadata
sem peers pode permanecer pendente; ausência de runtime real não pode ser
reportada como inspeção concluída.
