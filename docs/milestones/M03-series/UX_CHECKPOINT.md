# Checkpoint UX — M03

Aprovação consolidada registrada em 2026-09-14: “O frontend foi aprovado ja”. Ela reafirma o aceite anterior e cobre os ajustes frontend posteriores descritos neste arquivo; integração, runtime e hardware físico permanecem fora desse aceite.

Status: APPROVED. Decisão: APPROVED. Aceite do usuário em 2026-09-13: “aprovado”, após correção do ícone de Séries no menu não selecionado. S00–S02 concluídas em 2026-09-13.

## Pré-condições

S00–S02 concluídas com fixtures declarativas e evidências registradas. Catálogo, metadata, inspeção de arquivos, inferência, selectors e persistência continuam simulados.

## Jornada para revisar

1. Abrir Séries vazia, iniciar adição e revisar um episódio avulso identificado automaticamente.
2. Revisar season pack completo; expandir/recolher temporada e conferir arquivo/episódio sem perder foco.
3. Revisar pack com várias temporadas e especiais; confirmar que temporada 0 é clara e que metadata ausente não bloqueia a revisão.
4. Abrir pack ambíguo; filtrar pendências, mapear arquivo não identificado e corrigir episódio incorreto.
5. Tentar associar dois arquivos ao mesmo episódio; verificar bloqueio e escolha explícita sem fundir episódios.
6. Revisar arquivo `S01E01E02`; confirmar que ele permanece manual/ambíguo nesta versão.
7. Cancelar, reabrir o rascunho, injetar falha ao salvar e repetir; conferir dados, expansões e seleção preservados.
8. Confirmar duas vezes; abrir detalhes série→temporada→episódio e conferir uma source compartilhada com selectors independentes.
9. Navegar com teclado/gamepad e inspecionar loading/vazio/erro/offline, coleção extensa, 1080p/1440p/4K e Electron.

## O que validar

Hierarquia, termos, densidade da revisão, clareza de pendências, correção manual, estados de erro, retorno de foco e legibilidade à distância. A interface deve distinguir arquivo, episódio e source sem exigir conhecimento técnico de torrent.

## Evidências e decisão

[Validação completa e capturas](evidence/VALIDATION.md): 39 testes passaram (10 M03), lint/typecheck/build e formatação passaram. Chromium 1080p/1440p/4K, Electron macOS offline, teclado e gamepad sintético validados. Windows/TV/gamepad físico PENDENTES. Aprovação UX humana registrada acima.

Acesso: `pnpm dev` → concluir onboarding → **Séries** → **Adicionar série**. Packs disponíveis no diálogo; falha/retry no checkbox. Lista loading/erro/offline e corpus 20.000 em **Inspecionar prévia**. Reabrir fonte salva: série → temporada → episódio → **Revisar associações desta fonte**.

Aprovação UX não encerra M03 nem autoriza S03 enquanto a onda frontend M01–M22 estiver vigente.

## Requested Changes

Resolvida: ícone de Séries ausente no menu não selecionado. Adicionado `Tv` em `Movies.tsx`, consistente com o menu de Séries; typecheck e lint passaram após a correção. Nenhuma mudança solicitada permanece aberta.

## Ajuste posterior ao aceite

Em 2026-09-13, a lista recebeu busca por título/original/gênero e ordenação por `Mais votados` ou `A–Z`, mantendo `Em destaque` como ordem inicial. [Captura](evidence/catalog-search-sort-1920.png). A regressão completa passou 132/132. O aceite histórico acima permanece registrado, mas não é reutilizado como aprovação automática desta ampliação.

Em 2026-09-14, a solicitação de categorizar Filmes e Séries como a Home foi aplicada. Séries agora apresenta `Em destaque` e trilhos panorâmicos por categorias de gênero; busca e ordenações continuam em grade única. Abrir por qualquer trilho e voltar restaura o card exato. [Evidência conjunta M02/M03](../../execution/evidence/CATALOG_CATEGORY_RAILS.md). O aceite anterior permanece preservado; este refinamento foi implementado sem inferir nova aprovação.

Novo refinamento em 2026-09-14: a busca do catálogo fica recolhida como lupa à direita e o campo só aparece mediante ativação. Abrir, fechar e Voltar/Escape preservam uma sequência de foco previsível. [Evidência](../../execution/evidence/COLLAPSED_CATALOG_SEARCH.md). O aceite anterior permanece preservado, sem aprovação automática desta alteração.
