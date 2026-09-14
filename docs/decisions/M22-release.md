# M22 — release/update v1

Versão segue SemVer e o feed separa Canary/Beta/Stable. Metadados são assinados
com Ed25519 pinado; bytes usam SHA-256, limite 300 MiB e plataforma exata. O
mesmo checksum identifica o artefato promovido entre canais. Update cria backup
M21 e apenas prepara um candidato verificado; instalação/rollback pertencem ao
installer assinado da plataforma. Stable exige promoção humana. Baseline físico:
Windows 11 x64 e a matriz M18, a validar em hardware real.
