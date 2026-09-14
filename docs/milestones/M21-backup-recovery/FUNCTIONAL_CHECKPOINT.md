# Checkpoint funcional — M21

## Status

NOT_STARTED. Decisão: PENDING. Roteiro preparado; nenhuma aprovação ou validação executada.

## Pré-condições

S03–S05 integradas após UX M01–M22 e dependências reais; só então READY_FOR_REVIEW.

## Jornada para testar

Falha detectada → diagnóstico/backup disponível → preview de restore → confirmar → restaurar → reabrir e retomar.

1. Percorrer o caminho principal e verificar o resultado: Usuário restaura backup consistente e volta a navegar/retomar sem perda silenciosa.
2. Exercitar estados: backup criando; consistente; inválido; incompatível; DB ocupado; sem espaço; restaurando; falha parcial; recuperado.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Backup durante uso restaura em perfil isolado; injetar crash UI/Core/torrentd/MPV, DB lock/disk full/migração falha; manter original e restaurar estado/subscriptions/config; shutdown nunca espera indefinidamente.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## Integrações reais e verificações

Recovery: criar snapshot consistente DB/WAL/manifests/resume/config e chaves conforme storage, validar backup, stage/restore atômico, supervisor com tentativas/timeouts; original preservado até commit.

Verificar ausência de mock no caminho principal, persistência pertinente após restart, permissões, erro/sucesso refletidos na UI e dependências M20, M17. Testes verdes não substituem demonstração da jornada real.

## Evidências e decisão

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

S03–S08 DEFERRED pela política atual. Validação frontend não comprova integração.
