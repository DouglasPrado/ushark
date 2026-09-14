# Contrato de domínio — M02/S03

Data: 2026-09-14. Resultado: contrato v1 definido e alinhado à UX aprovada.

## Boundary público

`packages/types/src/movies.ts` define schema e protocolo independentes (`MOVIE_CATALOG_SCHEMA_VERSION` e `MOVIE_CATALOG_PROTOCOL_VERSION`), limites de payload, DTOs, snapshots com revisão, erros públicos e a capability `MovieCatalogService`/`MovieCatalogDesktopApi`.

Queries/comandos cobertos:

- ler snapshot por `libraryId`;
- pesquisar metadata com `requestId` e estado explícito do provider;
- salvar/corrigir/mergear filme;
- alternar favorito e atualizar metadata;
- adicionar/remover source e membership;
- excluir somente arquivo gerenciado com confirmação explícita.

Toda mutação recebe `idempotencyKey`; `expectedRevision` permite detectar escrita sobre snapshot obsoleto. O adapter de UI pode manter um cache para o `find` síncrono já aprovado, mas toda persistência passa pela capability assíncrona.

## Identidade e ownership

- `Movie.id`/`MovieMetadata.id` representam Content; source não define Content.
- Membership é vínculo com Library; remoção do vínculo não apaga Content nem arquivo.
- Estado pessoal é independente de metadata, source e apresentação.
- Provider refresh não troca identidade nem remove overrides.
- Ausência de source, indisponibilidade e erro são estados diferentes.

A política de merge e a precedência de apresentação resolvem D03/D19 em [M02-D03-D19](../../../decisions/M02-D03-D19-catalog-identity-and-presentation.md).

## Trust e recovery

Payloads do provider, IPC, metadata, IDs e nomes são não confiáveis e serão revalidados no Core. O contrato não expõe SQL, filesystem ou path arbitrário. Erros distinguem validação, conflito/revisão, storage, provider, autorização e operação de arquivo, com `retryable` explícito.

S04 deve implementar migração forward/transacional, provider atrás do boundary e cache/arquivo em diretórios gerenciados. S05 deve substituir o mock no caminho Electron sem alterar a UX.

## Evidência

- Tipos e mock compilam sob o contrato v1.
- O mock agora projeta `MovieSource.availability` sem perder `fileAvailable` exigido pela UI aprovada.
- Testes de catálogo existentes cobrem merge conservador, falha sem mutação, concorrência, membership e source.
