# M22 S04–S05 — integração local

O updater real consulta feed configurável, verifica Ed25519 pinado, plataforma,
tamanho e SHA-256, cria backup M21 e grava candidato/pending marker atomicamente.
2/2 casos passaram: candidato válido é preparado; assinatura/tamanho/hash
inválidos não criam pending update. A suíte M13–M22 passou 21/21; typecheck,
build, lint focado e geração local de SBOM SPDX/checksums/provenance passaram.

Artefatos locais: `dist/release-evidence/`. O provenance registra `signed:false`.
Não existe installer Windows x64, code signing, CI, smoke de upgrade histórico,
promoção ou publicação. Portanto o checkpoint está pronto para revisão técnica,
mas os gates de distribuição continuam pendentes e M22 não está DONE.
