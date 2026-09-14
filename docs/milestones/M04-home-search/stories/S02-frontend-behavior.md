# S02 — Busca, filtros e foco

Status: DONE (frontend), 2026-09-13.

## Objetivo

Completar descoberta e navegação sem perda de contexto.

## Contexto e dependências

Ler [M04](../README.md). S00/S01 concluídas; EXPERIENCE.md.

## Escopo

Buscar no dataset completo do adapter, inclusive itens não montados, por título/original/série/episódio/biblioteca/coleção. Combinar/limpar filtros, cancelar consulta e ignorar resposta antiga. Paginar e virtualizar mantendo identidade e foco; recuperar erro de página sem perder resultados. Na Home, percorrer os trilhos horizontalmente por teclado/controle e deslocar o trilho junto com o foco. Restaurar consulta/filtro/scroll/item ao voltar; escolher fallback previsível se item sair. Simular atualizações incrementais, hydration, indisponibilidade de sync/peers e encaminhamento de Continuar.

## Fora de escopo

FTS/watcher reais, persistência, playback e alteração de biblioteca remota.

## Critérios de aceite

Content aparece uma vez por resultado, com todas as memberships e sources permitidas; mesmo título com IDs distintos não é fundido. Hero pausa quando focado e não move foco. Hydration não desmonta item focado. Teclado/gamepad cobrem entrada de texto, filtros e B/Escape; falha/retry preserva contexto.

No detalhe, Filme e Série expõem metadata específica sem fabricar campos ausentes; badges permanecem legíveis e as ações ficam agrupadas na mesma linha quando houver espaço. Na página canônica de Filme, título, badges e ações pertencem ao mesmo bloco à esquerda do Hero, com a sinopse à direita; as duas colunas compartilham o mesmo centro vertical. Em largura estreita, elas empilham sem perder a ordem. A página de Filme não repete abaixo do Hero a faixa de título original, avaliação, disponibilidade e IMDb; Recomendados é o bloco seguinte e os cenários de revisão ficam depois do trilho. A ordem começa com Voltar somente por ícone, Assistir/Continuar e Trailer, seguida por Baixar quando disponível; a ação de reprodução recebe o foco inicial. Filme abre na página dedicada canônica de M02/M04, sem overlay ou semântica de diálogo; Série continua em modal, conserva as ações antes da sinopse e mantém seus fatos específicos. Recomendações excluem o título atual e priorizam deterministicamente mesmo tipo, gêneros em comum e avaliação. Elas reutilizam o mesmo `DiscoveryRail`/`DiscoveryCard` de `Filmes para descobrir` e `Continuar assistindo`, inclusive arte 16:9, metadata, Health, progresso opcional, overflow e navegação horizontal. Abrir uma recomendação mantém a mesma superfície, retorna ao topo e volta a focar a reprodução, preservando o card de origem para a saída final. Escape fecha primeiro o trailer; Voltar sai do detalhe e restaura o foco no card de origem.

Ajuste de revisão: o boundary transporta `backdrop` opcional; Hero e trilhos preferem a imagem horizontal e a busca mantém o pôster vertical. O teste de navegação verifica o asset IMDb esperado no Hero e no primeiro card. Suíte focada M04: 12/12; typecheck, lint e build Vite aprovados. A UX de M04 continua READY_FOR_REVIEW/PENDING.

## Validação

Testes focados em resposta antiga, deduplicação por ID, filtros, item não renderizado, virtualização/foco e recovery; roteiro Electron e resoluções alvo, distinguindo controle sintético de físico.

## Evidências

Os testes M04 passaram na revalidação final: página canônica de Filme, modal rico de Série, trailer local, ações acima da sinopse, navegação principal/trilhos horizontais, busca/filtros, identidade, paginação/corrida, foco/hydration, teclado TV, offline, adapters M02/M03, layout 1080p/1440p/4K e Electron. [Evidências](../evidence/VALIDATION.md). A regressão completa da fase passou **138/138**.

## Done When

S00–S02 atendidas e evidências prontas para checkpoint UX humano.
