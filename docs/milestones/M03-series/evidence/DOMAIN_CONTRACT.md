# Evidência S03 — contrato de série, episódio e selector

Data: 2026-09-14.

## Resultado

O boundary real M03 v1 foi definido em `packages/types/src/series.ts`, mantendo
o contrato mock legado até S05. Ele cobre:

- identidades separadas de série, episódio, source, vínculo e arquivo;
- temporada derivada, especiais em temporada zero e identidade estável;
- inferência explícita para `SxxExx`, `NxNN` e `Season N Episode N`;
- estados identificado, ambíguo, não identificado, colisão, multi-episódio,
  manual e ignorado;
- selectors `episode`, `filename` e `manual` por relação, com
  `resolvedFileId` e legenda da mesma source;
- review persistível, correção, confirmação transacional, idempotência,
  optimistic revision e erros recuperáveis;
- consultas paginadas de catálogo, episódios e review, com cursor opaco;
- limites exatos para números, strings, páginas, arquivos e payload IPC;
- metadata hierárquica, provider offline/cancelável e refresh sem troca de
  identidade.

As decisões duráveis estão em
[`M03-D23-D25-series-episode-contract.md`](../../../decisions/M03-D23-D25-series-episode-contract.md).

## Revisão de invariantes

| Caso                                   | Resultado contratual                                    |
| -------------------------------------- | ------------------------------------------------------- |
| Episódio avulso                        | Uma série e um episódio; selector próprio.              |
| Season pack                            | Uma source; N episódios e N relações independentes.     |
| Multitemporada/especiais               | Ordenação por temporada/episódio; especiais em 0.       |
| Dois arquivos para S01E01              | `conflict`; confirmação bloqueada até correção.         |
| `S01E01E02`                            | `multiple-episodes`; nenhuma divisão automática.        |
| Arquivo não reconhecido                | `unidentified`; usuário atribui ou ignora.              |
| Mesmo infoHash em episódios diferentes | Runtime/source reutilizado; episódios não são fundidos. |
| Legenda selecionada                    | `sourceFileId` da mesma source; sem path no renderer.   |
| Provider offline/metadata ausente      | Série local continua utilizável; mapping preservado.    |
| Retry da confirmação                   | Mesma chave retorna o mesmo efeito, sem duplicação.     |
| Dezenas de milhares de episódios       | Query paginada, máximo de 128 itens por página.         |

## Validação executada

```text
pnpm exec prettier --write packages/types/src/series.ts
pnpm exec eslint packages/types/src/series.ts
pnpm typecheck
```

Resultado: todos passaram. S03 não implementa banco, inferência nem IPC; essas
responsabilidades seguem para S04.1–S04.3 e S05.
