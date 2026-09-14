# M10 S04.3 — Keep e falha recuperável

Promoção/demotion copia para arquivo temporário, sincroniza, renomeia e somente
então remove a origem. O índice passa a ser resolvido pelo playback local sem
redownload. Falha injetada de espaço durante a cópia retornou
`STORAGE_DISK_FULL`, preservou o original e não criou destino parcial.

Validação em 2026-09-14: os dois casos S04.3 de
`tests/storage-policy-service.spec.ts` passaram com arquivos reais.
