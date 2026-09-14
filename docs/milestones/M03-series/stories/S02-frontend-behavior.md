# S02 — Correção e organização de episódios

Status: DONE (frontend), 2026-09-13.

## Objetivo

Completar interações, validações e recuperação de falhas antes do checkpoint UX.

## Contexto e dependências

Ler [M03](../README.md), S00/S01 concluídas e o contrato de experiência aprovado para implementação frontend.

## Escopo

Implementar edição manual por arquivo, filtro de pendências, troca de temporada/episódio, especiais, desfazer/resetar sugestão e confirmação idempotente. Bloquear colisão de dois arquivos no mesmo episódio até escolha explícita; permitir deixar arquivo sem mapear e retomar o rascunho simulado. Preservar seleção, expansão e foco ao voltar, trocar temporada, falhar/repetir ou receber resposta assíncrona antiga. Para listas extensas, paginar ou virtualizar conforme o contrato sem renderização integral.

## Fora de escopo

Persistência real, inferência real, leitura de arquivos, download, prioridade do scheduler, reprodução e autoplay.

## Critérios de aceite

Duplo confirmar não duplica série, episódio ou vínculo. Correção de um arquivo não altera os demais; dois episódios distintos nunca são fundidos. Cancelar mantém catálogo inalterado; retry preserva o rascunho. Teclado/gamepad percorrem hierarquia e revisão com foco visível, retorno previsível e B/Escape fechando apenas a superfície atual.

## Validação

Testes de comportamento para idempotência, colisão, resposta antiga, rascunho e foco; roteiro UX completo em 1080p/1440p/4K e Electron, distinguindo controle sintético de hardware físico.

## Evidências

[VALIDATION.md](../evidence/VALIDATION.md): 39 testes passaram (10 M03), lint/typecheck/build/formatting passaram, capturas 1080p/1440p/4K e Electron macOS offline. Corrigidos grupos de revisão para manter foco ao editar temporada; fontes salvas reabrem com correções e rascunho com arquivos adiados permanece retomável. Windows/TV/gamepad físico pendentes. Acesso: `pnpm dev` → concluir onboarding → Séries. Checkpoint UX READY_FOR_REVIEW, decisão PENDING.

Ajuste posterior solicitado em 2026-09-13: [seed IMDb de séries](../evidence/IMDB_SERIES_SEED.md) com oito títulos reais, 16 artes locais e 48 episódios mockados. Naquela rodada, a regressão passou 125/125. O aceite histórico de M03 permanece registrado; esta alteração visual posterior aguarda confirmação própria e não avança S03–S08.

Novo ajuste de revisão: episódios exibem thumbnail 16:9 e aceitam JPEG, PNG, WebP ou GIF de até 12 MB no detalhe. A prévia usa o backdrop da série até existir arte própria, reserva espaço durante hydration e permanece em memória atrás do `SeriesCatalog`. O teste de comportamento cobre fallback, rejeição de arquivo não-imagem, GIF e atualização do card; regressão **128/128**. Persistência, validação privilegiada por magic bytes e storage definitivo permanecem fora de S02.

Ajuste posterior: a lista busca termos sem acento/caixa em título localizado, original e gêneros e ordena por votos ou A–Z, preservando a ordem de destaque como default. O teste conjunto M02/M03 e a regressão completa passaram 132/132; [captura](../evidence/catalog-search-sort-1920.png). O aceite histórico permanece preservado, sem aprovação automática deste ajuste.

## Done When

S00–S02 atendem ao contrato frontend e o checkpoint UX está pronto, sem aprovação implícita.

## Ajuste de revisão — comportamento dos trilhos

Cada categoria expõe navegação horizontal e rótulo acessível. Cards repetidos conservam a identidade da série e a origem de foco; voltar restaura exatamente o card acionado. Itens fora da taxonomia aparecem em `Outros`, e a busca retorna à grade sem duplicação. Testes cobrem categorização, orientação, busca e restauração de foco.

## Ajuste de revisão — busca recolhida

A busca do catálogo começa como lupa no grupo à direita e só cria o campo após ativação explícita. O campo recebe foco ao abrir. Fechar ou usar Voltar/Escape limpa a consulta, recolhe o campo e devolve foco à lupa antes de sair da tela. [Evidência](../../../execution/evidence/COLLAPSED_CATALOG_SEARCH.md).
