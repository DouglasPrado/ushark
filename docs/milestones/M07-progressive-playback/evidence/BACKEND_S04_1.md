# Evidência S04.1 — probe parcial e mapping tempo/byte/piece

Data: 2026-09-14.

Foi criado `@ushark/core/stream-mapping`, isolado do renderer, com:

- geometria segura de arquivo dentro do torrent;
- mapping byte→piece que considera `fileOffset`, intervalos semiabertos e
  pieces compartilhados nas duas bordas;
- mapping tempo→byte estimado e preferência por índice temporal quando
  disponível, inclusive interpolação VBR;
- plano limitado de HEAD (16 MiB) e TAIL opcional (8 MiB), com fusão em
  arquivos pequenos, sem exigir arquivo completo;
- readiness por pieces com deduplicação, primeira lacuna e teto de 4.096
  pieces por probe;
- adapter real de `ffprobe` com executable/path absolutos, contenção no storage,
  rejeição de symlink, `shell: false`, timeout de 5 s e saída limitada a 256 KiB.

O resultado técnico normaliza duração, tamanho, bitrate, container, codecs e
resolução. A confiança segue `estimated` até existir índice temporal extraído;
nenhum path, piece ou detalhe bruto do processo cruza para o renderer.

## Validação

Em macOS arm64, FFmpeg/ffprobe 9.0.1 gerou e inspecionou uma mídia MP4 sintética
320×180 com MPEG-4/AAC. O adapter recusou o probe antes de todos os pieces HEAD
requeridos e retornou metadata real após readiness. Os demais casos cobriram
offset não alinhado, bordas compartilhadas, fim da duração, índice VBR,
HEAD/TAIL separados e sobrepostos, lacuna de piece e inputs inseguros.

```text
pnpm exec playwright test tests/stream-mapping.spec.ts
# 8 passed

pnpm lint
pnpm typecheck
# passed
```

S04.1 não aplica prioridades ou deadlines no libtorrent, não entrega arquivo
parcial ao MPV e não comprova playback antes do download completo. Essas provas
pertencem respectivamente a S04.2, S04.3 e S05. Windows/TV/Moonlight e controle
físico continuam pendentes.
