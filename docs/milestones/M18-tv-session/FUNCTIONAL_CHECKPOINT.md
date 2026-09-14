# Checkpoint funcional — M18

## Status

READY_FOR_REVIEW. Decisão: PENDING. S03–S05 locais concluídas em 2026-09-14;
aceite físico Windows/TV obrigatório permanece pendente.

## Pré-condições

S03–S05 integradas após UX M01–M22 e dependências reais; só então READY_FOR_REVIEW.

## Jornada para testar

Moonlight → app --tv → navegar → Play → controlar tracks → desconectar → reconectar → sair.

1. Percorrer o caminho principal e verificar o resultado: TV abre app, controla player, desconecta/reconecta e sai corretamente.
2. Exercitar estados: iniciando; foco no app; player ativo; controle desconectado; sessão perdida; pausado/continuando; reconectando; encerrando.
3. Voltar/cancelar/repetir e conferir foco, contexto e ausência de mutação não confirmada.
4. Windows/TV em LAN real: sem mouse/desktop/terminal exposto; áudio/vídeo/hardware encode quando disponível; desconectar/reconectar preserva posição; sair encerra helpers; registrar versões Sunshine/Moonlight e controle físico.
5. Registrar ambiente, versões, corpus, evidências e limitações; separar controle sintético e hardware real.

## Integrações reais e verificações

TvSession: sinal de conexão verificável, política pause/continue, handoff de foco entre UI/MPV, input hotplug e shutdown limitado; versões suportadas e origem do sinal explícitas.

Verificar ausência de mock no caminho principal, persistência pertinente após restart, permissões, erro/sucesso refletidos na UI e dependências M05, M07. Testes verdes não substituem demonstração da jornada real.

## Evidências e decisão

[Integração local](evidence/INTEGRATION_VALIDATION.md). Não interpretar macOS
ou input sintético como validação Sunshine/Moonlight/controle físico.

PENDENTES. Registrar decisão humana com contexto e evidência; não inferir aprovação pelo silêncio. Alterações de UX exigidas na integração voltam à revisão correspondente. Este roteiro não autoriza execução nem fecha S08.

## Mudanças solicitadas

Nenhuma registrada; isso não equivale a aprovação.

S03–S05 concluídas localmente. S06–S08 não autorizadas; macOS e input sintético
não substituem a decisão humana nem o gate físico Windows/TV.
