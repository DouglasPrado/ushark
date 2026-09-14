# Checkpoint funcional — M17

## Status

NOT_STARTED. Decisão: PENDING. Roteiro preparado; nenhuma aprovação ou validação executada.

## Pré-condições

S03–S05 integradas após UX M01–M22 e dependências reais; só então READY_FOR_REVIEW.

## Jornada para testar

Biblioteca assinada → duplicar → novo nome → editar cópia → atualizar origem → comparar independência.

1. Percorrer o caminho principal e verificar o resultado: Fork possui novo ID, mantém apresentação e reutiliza conteúdos sem seguir updates da origem.
2. Exercitar estados: copiando; cancelado; falhou; cópia pronta; origem indisponível; asset compartilhado.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Novo libraryId, mesmos Contents/Sources; atualização da origem não muda cópia; editar cópia não muda origem; cancelamento/falha não deixa parcial; GC mantém assets ainda usados.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## Integrações reais e verificações

LibraryFork: duplicar(originLibraryId, version, novo nome, operationId), retornar novo libraryId; copiar apresentação/memberships por referência e provenance opcional; não criar subscription na cópia.

Verificar ausência de mock no caminho principal, persistência pertinente após restart, permissões, erro/sucesso refletidos na UI e dependências M12, M16. Testes verdes não substituem demonstração da jornada real.

## Evidências e decisão

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

S03–S08 DEFERRED pela política atual. Validação frontend não comprova integração.
