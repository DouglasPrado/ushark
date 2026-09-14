# Checkpoint funcional — M12

## Status

READY_FOR_REVIEW. Decisão: PENDING. S03–S05 concluídas em 2026-09-14.

## Pré-condições

S03–S05 integradas após UX M01–M22 e dependências reais; só então READY_FOR_REVIEW.

## Jornada para testar

Bibliotecas → criar draft → identidade → conteúdos/fontes → coleções/seções → reordenar → preview → salvar.

1. Percorrer o caminho principal e verificar o resultado: Draft persistido com identidade, coleções/seções e preview fiel.
2. Exercitar estados: draft vazio; inválido; editando; salvando; salvo; alterações não salvas; imagem ausente; preview vazio.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Reabrir mantém IDs/ordem/draft; preview equivale ao layout; reordenar não altera Content global; inspecionar payload sem estado pessoal; salvar não publica nem inicia torrent.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## Integrações reais e verificações

LibraryDraft: ler/salvar draft com revisão, editar identidade, memberships, Collection e Section separados; apresentação escopada ao libraryId; preview usa mesmo modelo de leitura do assinante.

Verificar ausência de mock no caminho principal, persistência pertinente após restart, permissões, erro/sucesso refletidos na UI e dependências M02, M03. Testes verdes não substituem demonstração da jornada real.

## Evidências e decisão

[Integração](evidence/INTEGRATION_VALIDATION.md) comprovada no macOS/Electron.
Decisão humana e hardware Windows/TV permanecem pendentes; S06–S08 não estão
autorizadas.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

Frontend aprovado; S03–S05 integradas. S06–S08 permanecem não autorizadas.
