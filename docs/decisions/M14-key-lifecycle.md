# M14 — ciclo de identidade Ed25519

Algoritmo v1: Ed25519. O payload assinado contém libraryId, autor, schema,
versão e hash do manifest canônico. A chave privada é gerada uma vez e guardada
somente cifrada pelo secure storage do sistema; não entra no SQLite ou logs.
Pins TOFU guardam apenas chave pública e fingerprint. Mudança de chave exige
confirmação explícita. Perda da chave cria nova identidade; rotação/backup
portável ficam fora do v1 e exigem fluxo futuro explícito.
