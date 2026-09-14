# Evidência — organização do renderer e design system

Data: 2026-09-13. Status: implementação local validada; revisão UX humana permanece PENDING.

## Diagnóstico inicial

- `apps/desktop/src/renderer` concentrava 39 arquivos em uma única pasta e cerca de 17,5 mil linhas de TypeScript/CSS.
- `packages/ui` expunha somente `Button` em um arquivo de 29 linhas; o componente ainda oferecia três variantes (`default`, `secondary`, `ghost`).
- Filmes, Séries e Home mantinham estruturas distintas de card.
- Filmes/Séries duplicavam busca e ordenação; a busca global usava outra barra de filtros.
- CSS de componentes e telas estava espalhado na raiz do renderer.

## Organização aplicada

O renderer foi dividido por responsabilidade, preservando `main`, `preload` e `renderer` como boundaries físicos:

```text
apps/desktop/src/renderer/
├── app/        # shell, navegação, onboarding e estilos globais
├── catalog/    # Home, Filmes, Séries, detalhes, sources e sinais
├── playback/   # player, fallback e próximo episódio
├── workspace/  # bibliotecas, downloads, storage e assinaturas
├── system/     # diagnóstico, recuperação e atualização
├── torrent/    # importação simulada
└── tv/         # sessão e setup de TV
```

Cada família mantém seus componentes e CSS no mesmo diretório. O entrypoint `main.tsx` e `vite-env.d.ts` continuam na raiz por serem arquivos técnicos do renderer.

## Componentes compartilhados

- `packages/ui/src/Button/`: única API de ação com variantes `primary` e `secondary`; todos os usos anteriores de `ghost` foram migrados para `secondary`.
- `packages/ui/src/FilterToolbar/`: `FilterToolbar`, `FilterSearch`, `FilterSelect` e `FilterGroup`, usados por Filmes, Séries e Busca global.
- `packages/ui/src/MediaCard/`: um único `MediaCard` com variantes de orientação `portrait` e `landscape`. Filmes, Séries e a Home usam a mesma estrutura; pôsteres/grades usam `portrait` e trilhos da Home usam `landscape`.

Navegação, tabs, teclado virtual e o próprio card continuam sendo superfícies interativas especializadas; os botões de ação do design system permanecem limitados aos dois tipos definidos acima.

## Validação

- `pnpm typecheck`: passou.
- `pnpm lint`: passou.
- `pnpm build`: passou; permanece o aviso conhecido de chunk acima de 500 kB (589,48 kB minificado / 175,17 kB gzip nesta execução).
- Estrutura, contenção e layouts: **16/16** passaram, cobrindo 480, 700, 761, 1100, 1080p, 1440p e 4K conforme a suíte aplicável.
- Repetição dos seis casos inicialmente afetados pela troca de markup/role: **6/6** passaram.
- Regressão integral final, com três workers e traces desativados: **141/141 em 3,2 min**.
- Uma primeira regressão foi interrompida por `ENOSPC` após 132 casos; somente `test-results`, `.turbo/cache` e o build anterior, todos regeneráveis, foram limpos. O caso de TV reportado durante a interrupção passou isoladamente e a repetição integral ficou verde.

Foram inspecionadas as capturas de Filmes, Séries, Home e Busca em 1920 px. A barra de filtros permaneceu contida, os cards verticais preservaram metadata/overlays e os trilhos horizontais conservaram arte 16:9, foco e progresso.

## Limites preservados

Não houve backend, provider, persistência definitiva, MPV, torrentd, Registry, merge, deploy ou publicação. A validação continua local em browser/Electron macOS; Windows, TV, Moonlight e controle físicos permanecem pendentes.
