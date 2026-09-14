# Checkpoint funcional — M20

## Status

READY_FOR_REVIEW. Decisão: PENDING. S03–S05 concluídas em 2026-09-14.

## Pré-condições

S03–S05 integradas após UX M01–M22 e dependências reais; só então READY_FOR_REVIEW.

## Jornada para testar

Configurações → diagnóstico opcional → inspecionar métricas → preview sanitizado → exportar → limpar categoria.

1. Percorrer o caminho principal e verificar o resultado: Painel técnico mostra runtime e exporta diagnóstico sanitizado; usuário limpa históricos/logs seletivamente.
2. Exercitar estados: sem sessão; métrica desconhecida; zero real; coletando; exportando; falha; limpeza parcial; concluído.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Dados de runtimes reais comparados ao painel; inspecionar archive com tokens/magnets/paths sintéticos para comprovar redação; limpar logs não apaga biblioteca/progresso; medir overhead e rotação.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## Integrações reais e verificações

Diagnostics: snapshots torrent/player/Health/DB/cache, exportar pacote redigido, limpar categoria com retenção; unknown separado de zero; correlationIds sem secrets; coleta limitada.

Verificar ausência de mock no caminho principal, persistência pertinente após restart, permissões, erro/sucesso refletidos na UI e dependências M10, M11, M16, M18, M19. Testes verdes não substituem demonstração da jornada real.

## Evidências e decisão

[Integração](evidence/INTEGRATION_VALIDATION.md). Overhead prolongado,
Windows/TV, decisão humana e S06–S08 permanecem pendentes.

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

S03–S05 concluídas. S06–S08 não autorizadas; validação local não substitui a
decisão humana nem as validações externas pendentes.
