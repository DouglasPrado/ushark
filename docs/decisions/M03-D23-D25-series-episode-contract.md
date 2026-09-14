# M03 — D23–D25: identidade, inferência e escala de episódios

Status: ACCEPTED para implementação S04/S05 em 2026-09-14.

## D23 — identidade e hierarquia

- `Content.id` é imutável para série e episódio. Um episódio é filho de uma
  série e sua identidade lógica é protegida pela tupla
  `(seriesId, seasonNumber, episodeNumber)` ou por ID externo já reconciliado.
- Identidades locais usam UUID e unique constraint para a tupla. Identificar
  depois um registro local exige merge explícito e conservador; alterar a PK ou
  fundir providers incompatíveis silenciosamente é proibido.
- Temporada é uma projeção ordenada e paginada dos episódios. M03 não cria uma
  entidade `season`, pois a experiência aprovada ainda não possui estado,
  metadata ou relações pertencentes à temporada.
- Especiais usam `seasonNumber = 0`. Temporadas aceitam 0–999 e episódios
  1–9.999. Episódios distintos nunca são fundidos por semelhança de nome,
  arquivo ou infoHash.

## D24 — inferência, correção e selectors

- A inferência reconhece, sem diferenciar caixa, somente padrões com fronteiras
  claras: `SxxExx`, `NxNN` e `Season N Episode N`.
- O resultado contém padrão e todas as sugestões. Nenhuma sugestão, mais de uma
  sugestão diferente, colisão de dois arquivos na mesma tupla ou nome com mais
  de um episódio permanece revisável.
- Nomes como `S01E01E02` são `multiple-episodes`: M03 não divide nem associa
  automaticamente o arquivo a mais de um episódio. O usuário pode ignorá-lo ou
  vinculá-lo explicitamente a um episódio; uma regra para mídia multi-episódio
  exige decisão futura.
- Samples, extras e arquivos não selecionáveis nunca viram episódios por
  inferência. Cada confirmação resolve um `fileId` ainda presente na source.
- `episode`, `filename` e `manual` pertencem à relação episode/source. Uma
  source de temporada pode servir muitos episódios, cada um com selector e
  `resolvedFileId` independentes.
- A legenda selecionada é outro `sourceFileId` da mesma source, classificado
  como legenda. Ela acompanha a relação do episódio; não é path enviado pelo
  renderer nem antecipa prioridade de download de M07.
- Correção é persistida no draft antes da confirmação. Depois da confirmação,
  retry com a mesma `idempotencyKey` devolve o mesmo efeito e não duplica
  episódio, source ou relação.

## D25 — paginação, limites e transação

Consultas de séries, episódios e arquivos de revisão são paginadas por cursor
opaco estável; o renderer não constrói SQL, offset nem cursor. A ordem de
episódios é `(seasonNumber, episodeNumber, id)`. O default é 64 e o máximo 128
itens por página. O total continua disponível sem materializar dezenas de
milhares de episódios.

O contrato v1 limita título a 512 bytes UTF-8, sinopse a 20.000 bytes UTF-8, ID
externo a 128 bytes, cursor a 512 bytes, review a 10.000 arquivos e payload IPC
a 1 MiB. A inspeção de M06 continua sendo a autoridade dos limites e da
classificação dos arquivos.

Confirmar importação é uma única transação: cria/reutiliza série, cria/reutiliza
episódios, vincula a membership da série, confirma/reutiliza a source M06,
persiste selectors/legendas e encerra o draft. Qualquer colisão, source alterada
ou falha reverte o conjunto completo. Reads offline permanecem disponíveis;
provider e refresh nunca alteram identidade, selectors nem correções.

## Consequências

O `contents` introduzido por M02 precisa migrar do constraint exclusivo
`type = movie` para `movie | series | episode`, preservando linhas existentes.
S04 deve criar apenas tabelas consumidas por M03 e índices de hierarquia/review;
busca global, playback, scheduler, próxima mídia e entidade de temporada ficam
fora deste milestone.
