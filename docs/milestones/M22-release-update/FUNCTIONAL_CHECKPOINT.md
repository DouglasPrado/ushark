# Checkpoint funcional — M22

## Status

NOT_STARTED. Decisão: PENDING. Roteiro preparado; nenhuma aprovação ou validação executada.

## Pré-condições

S03–S05 integradas após UX M01–M22 e dependências reais; só então READY_FOR_REVIEW.

## Jornada para testar

Instalar → abrir → About/canal → verificar update → validar candidato → atualizar → reabrir dados → desinstalar conforme política.

1. Percorrer o caminho principal e verificar o resultado: Candidato Windows x64 inspecionável, assinado e rastreável; promoção mantém o mesmo artefato.
2. Exercitar estados: atualizado; update disponível; baixando; assinatura inválida; incompatível; aplicando; falha; recuperação.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Windows x64: instalação fresh e upgrade histórico empacotados; preservar biblioteca/cache index/progresso/downloads; rejeitar assinatura/hash inválido; comparar hash entre canais; auditar todos requisitos transversais.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## Integrações reais e verificações

AppUpdate: metadados de versão/canal separados de bytes do candidato assinado, checksum/provenance/SBOM; validar/instalar com migração recuperável; promoção conserva hash e exige gate manual Stable.

Verificar ausência de mock no caminho principal, persistência pertinente após restart, permissões, erro/sucesso refletidos na UI e dependências M21. Testes verdes não substituem demonstração da jornada real.

## Evidências e decisão

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

S03–S08 DEFERRED pela política atual. Validação frontend não comprova integração.
