# M05 — decisões de playback local

Data: 2026-09-14. Estado: aceitas para S04/S05; validar no checkpoint funcional.

## D10 — progresso e conclusão

- MPV pode emitir posição até quatro vezes por segundo; o Core persiste no
  máximo a cada 5 segundos e também em pause, seek concluído, stop, EOF e
  shutdown normal.
- O budget local para crash é perder no máximo 6 segundos desde a última
  posição confirmada pelo player. Escritas usam transação SQLite/WAL e revisão
  monotônica; evento de sessão antiga não altera progresso novo.
- `watched` torna-se verdadeiro em EOF confirmado ou ao encerrar com posição
  confirmada maior ou igual a 90% de uma duração válida. Só seek solicitado,
  sem posição confirmada, não marca conclusão.
- Conteúdo assistido sai de Continuar Assistindo; progresso/histórico não é
  apagado. Recomeçar inicia em zero sem apagar sessões anteriores.
- Countdown e ordem de próximo episódio pertencem ao M11 e não são decididos
  aqui.

## D11 — composição e ownership de janelas

MPV permanece processo separado, mas não pode ser percebido como player ou
janela externa. Na v1, sua janela sem borda/OSD/console ocupa exatamente a área
de conteúdo do Electron e fica atrás da superfície transparente do player; o
overlay React e todo input permanecem no Ushark. Posição e tamanho acompanham
move, resize e fullscreen da janela principal, enquanto foco, taskbar/Dock e
z-order são coordenados pelo main process. O Core possui processo, IPC, geração
e cleanup; a UI envia somente comandos do contrato.

Fullscreen, captura Sunshine, múltiplos monitores, z-order, foco e ausência de
exposição do desktop ainda precisam ser validados no Windows/TV antes de aceite
físico. Se a composição real falhar, a estratégia volta à revisão UX; não se
troca silenciosamente para player web ou transcoding.

## D18 — matriz de prova

macOS arm64 é ambiente de desenvolvimento para contrato, processo, IPC,
persistência e direct play controlado. Windows x64 com MPV empacotado é a
plataforma de aceite do runtime. TV/Moonlight/controle físico são evidência
separada e não podem ser substituídos por input sintético. Métricas sempre
registram OS, versão do MPV, codec/container, resolução e decode observado.

## D21 — legenda externa

A allowlist de legenda local é `.srt`, `.ass`, `.ssa` e `.vtt`, separada da
allowlist de pacotes M13. M05 não aceita URL remota. A seleção ocorre por diálogo
nativo; o renderer nunca envia path arbitrário. O Core exige arquivo regular,
limite de 20 MiB, extensão permitida, canonicalização, bloqueio de symlink e
cópia para diretório temporário privado da sessão antes de instruir MPV. A
legenda não altera manifest nem biblioteca compartilhada e é removida no stop.
