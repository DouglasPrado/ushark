# Checkpoint funcional — M08

## Status

NOT_STARTED. Decisão: PENDING. Roteiro preparado; nenhuma aprovação ou validação executada.

## Pré-condições

S03–S05 integradas após UX M01–M22 e dependências reais; só então READY_FOR_REVIEW.

## Jornada para testar

Detalhes → fontes medindo → comparar → preferência ou override → Play → retirar override.

1. Percorrer o caminho principal e verificar o resultado: Details mostra medição progressiva e a escolha automática respeita preferências e limites reais.
2. Exercitar estados: unknown; measuring; ready; degraded; unavailable; error; confiança baixa; fonte local; 4K inviável; múltiplas origens.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Fixtures determinísticas de ranking incluindo menor tamanho, qualidade máxima inviável e fonte local; ranking <10ms sem probes; confirmar escolha com player e cancelar preflight ao sair sem flicker.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## Integrações reais e verificações

SourceSelection: observar/cancelar preflight, rankear métricas, definir/remover override; Health/confidence/ratio/startup e reasonCodes separados; unidades e budget explícitos.

Verificar ausência de mock no caminho principal, persistência pertinente após restart, permissões, erro/sucesso refletidos na UI e dependências M07. Testes verdes não substituem demonstração da jornada real.

## Evidências e decisão

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

Frontend simulado validado; este checkpoint e S03–S08 continuam adiados.
