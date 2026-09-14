# Checkpoint funcional — M13

## Status

READY_FOR_REVIEW. Decisão: PENDING. S03–S05 concluídas em 2026-09-14.

## Pré-condições

S03–S05 integradas após UX M01–M22 e dependências reais; só então READY_FOR_REVIEW.

## Jornada para testar

Biblioteca → exportar → revisar pacote → importar em outro perfil → preview → confirmar → abrir offline.

1. Percorrer o caminho principal e verificar o resultado: .tslib exportado abre em outro perfil local com preview, layout e identidade preservados.
2. Exercitar estados: validando; inválido; incompatível; asset ausente; assinatura não suportada; cancelado; importando; conflito; sucesso.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Roundtrip offline em dois catálogos sem DB original; IDs/ordem/layout iguais; rejeitar traversal, symlink, ZIP bomb, HTML/CSS/scripts e payload incompatível sem modificar catálogo.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## Integrações reais e verificações

LibraryPackage: serializar snapshot canônico, validar/stage pacote, preview e commit atômico; schema/version/hash, limites e referências; sem mídia/estado pessoal; assinatura presente exige verificação suportada.

Verificar ausência de mock no caminho principal, persistência pertinente após restart, permissões, erro/sucesso refletidos na UI e dependências M12, M04. Testes verdes não substituem demonstração da jornada real.

## Evidências e decisão

[Integração](evidence/INTEGRATION_VALIDATION.md) comprovada em serviço real,
IPC e renderer no macOS. Assinatura/trust segue para M14. Decisão humana,
Windows/TV e hardware permanecem pendentes; S06–S08 não estão autorizadas.

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

S03–S05 concluídas. S06–S08 não autorizadas; validação local não substitui a
decisão humana nem as validações externas pendentes.
