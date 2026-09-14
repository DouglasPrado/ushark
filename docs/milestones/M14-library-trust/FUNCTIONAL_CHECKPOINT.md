# Checkpoint funcional — M14

## Status

READY_FOR_REVIEW. Decisão: PENDING. S03–S05 concluídas em 2026-09-14.

## Pré-condições

S03–S05 integradas após UX M01–M22 e dependências reais; só então READY_FOR_REVIEW.

## Jornada para testar

Preview → ver autoria → aceitar identidade ou cancelar → assinar pacote próprio → reimportar → detectar alteração de chave.

1. Percorrer o caminho principal e verificar o resultado: Cliente verifica assinatura e lembra a identidade aceita; autor pode assinar pacote.
2. Exercitar estados: não assinado; assinatura válida; inválida; hash divergente; primeira confiança; chave alterada; storage indisponível.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Modificar bytes invalida assinatura; chave diferente nunca entra silenciosamente; não assinado é identificado; roundtrip preserva assinatura; verificar ausência de chave privada em DB/logs.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## Integrações reais e verificações

LibraryTrust: verificar payload canônico/hash/assinatura, consultar/aceitar pin explícito, assinar com chave em secure storage; resultado não confunde autenticidade com direitos.

Verificar ausência de mock no caminho principal, persistência pertinente após restart, permissões, erro/sucesso refletidos na UI e dependências M13. Testes verdes não substituem demonstração da jornada real.

## Evidências e decisão

[Integração](evidence/INTEGRATION_VALIDATION.md) comprovada no macOS. Decisão
humana, Windows/TV, hardware e S06–S08 permanecem pendentes.

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

S03–S05 concluídas. S06–S08 não autorizadas; validação local não substitui a
decisão humana nem as validações externas pendentes.
