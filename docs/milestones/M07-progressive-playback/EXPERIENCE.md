# M07 — Experiência frontend

S00: player M05 recebe modo progressivo por conteúdo/source parcial M06 ou seletor de prévia. Reutilizar controles, detalhes e foco. Boundary StreamPreview em memória: request da posição com AbortSignal e snapshots de metadata/buffer/readiness; UI ignora geração anterior.

Metadata incompleta → aguardar/retry/voltar; buffer inicial → progresso temporal ilustrativo → pronto parcial/primeiro frame simulado. Seek fora da janela → descartar prioridade antiga → rebuffering na última posição; três seeks rápidos só confirmam o último. Pausa preserva intenção após seek. Rede perdida/disco cheio → erro recuperável e buffer zerado, sem alegar continuar rede offline; retry explícito com cenário normal. Cancelar invalida callbacks e preserva posição confirmada. Stream Only mostra cache temporário limitado e proteção do conteúdo ativo. Saída segue retenção simulada; políticas completas M10.

Métricas ilustrativas em segundos/MB/Mbps, bitrate variável e leitura técnica simulada 1080p prevalecendo sobre declaração 4K; metadata desconhecida não inventada. HOT/WARM/background, HEAD/TAIL, aproximação tempo/byte, limite RAM e disco mostrados como diagnóstico de fixture, nunca medição real. Metas startup 1–5s/seek 1–3s não comprovadas por timer. D09/D13/D18 e Range/MPV/probe/scheduler/disco reais adiados S03–S08.

Cobertura: FR-037–046/051/052/226 e NFR/RX do PREPARATION_COVERAGE mediante estados observáveis; garantias físicas/runtime permanecem pendentes. S02 prova seek sucessivo, cancelar durante buffer, recuperação, continuidade M06→M07 e teclado. UX PENDING adiada para final por autorização explícita.
