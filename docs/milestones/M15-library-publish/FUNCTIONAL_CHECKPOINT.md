# Checkpoint funcional — M15

## Status

NOT_STARTED. Decisão: PENDING. Roteiro preparado; nenhuma aprovação ou validação executada.

## Pré-condições

S03–S05 integradas após UX M01–M22 e dependências reais; só então READY_FOR_REVIEW.

## Jornada para testar

Draft → diff e preview → publicar explicitamente → upload → versão imutável → copiar link/código → nova versão ou retirada.

1. Percorrer o caminho principal e verificar o resultado: Autor publica versão imutável, recebe link/código e revisa mudanças da próxima publicação.
2. Exercitar estados: não autenticado; sem permissão; upload em andamento; quota; conflito de versão; falha parcial; publicado; retirado.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Ambiente de teste: editor autorizado publica, não editor rejeitado; falha de upload não aponta a blob incompleto; concorrência retorna conflito; vN imutável; retirada não apaga instalações locais.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## Integrações reais e verificações

RegistryPublisher: autenticar, stage blobs, publicar(snapshot/hash/expectedVersion), resolver link/código, retirar; auth de editor separada de assinatura; commit só após blobs íntegros.

Verificar ausência de mock no caminho principal, persistência pertinente após restart, permissões, erro/sucesso refletidos na UI e dependências M14. Testes verdes não substituem demonstração da jornada real.

## Evidências e decisão

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

S03–S08 DEFERRED pela política atual. Validação frontend não comprova integração.
