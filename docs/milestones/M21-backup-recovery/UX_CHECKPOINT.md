# Checkpoint UX — M21

## Status

APPROVED. Aprovação consolidada do usuário em 2026-09-14: “O frontend foi aprovado ja”.

## Pré-condições

S00–S02 implementadas com evidências; só então READY_FOR_REVIEW.

## Jornada para testar

Falha detectada → diagnóstico/backup disponível → preview de restore → confirmar → restaurar → reabrir e retomar.

1. Percorrer o caminho principal e verificar o resultado: Usuário restaura backup consistente e volta a navegar/retomar sem perda silenciosa.
2. Exercitar estados: backup criando; consistente; inválido; incompatível; DB ocupado; sem espaço; restaurando; falha parcial; recuperado.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Usar fixtures determinísticas, teclado/gamepad e superfícies 1080p/1440p/4K; conferir copy, hierarquia, legibilidade e recuperação.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## O que está mockado

Recovery: criar snapshot consistente DB/WAL/manifests/resume/config e chaves conforme storage, validar backup, stage/restore atômico, supervisor com tentativas/timeouts; original preservado até commit.

Todos os efeitos de runtime/rede/disco são simulados em memória. Não afirmar persistência/reprodução/publicação real. A aprovação libera apenas o avanço frontend conforme GOAL, não encerra o milestone.

## Evidências e decisão

Evidências em [UPDATE](UPDATE.md) e [VALIDATION](evidence/VALIDATION.md). Decisão humana pendente; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

## Revisão final consolidada

APPROVED na revisão consolidada de 2026-09-14; [roteiro e evidência do aceite](../../execution/FRONTEND_REVIEW.md). O aceite cobre UX mockada, não integração funcional ou hardware físico.
