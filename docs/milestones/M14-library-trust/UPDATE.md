# M14 — Frontend pronto para revisão

S00–S02: autoria integrada à revisão M13, assinatura demonstrativa de exportação, pin em memória, primeira confiança e mudança de identidade explícitas. Inválida/hash divergente bloqueiam importação; cancelamento/storage/erro recuperáveis. Autenticidade separada de direitos e de autorização para publicação.

Typecheck e lint PASS; Playwright 7 PASS: 3 comportamentais M14, 1 roundtrip de assinatura demonstrativa e 3 regressões M13. Captura key-change.png inspecionada, modal compartilhado com cobertura 1080p/1440p/4K M13. Nenhuma chave privada ou criptografia real produzida; secure storage e hardware pendentes.

UX READY_FOR_REVIEW/PENDING. Revisão humana adiada por instrução explícita para o fim de M01–M22. S03–S08 DEFERRED; nenhum aceite fabricado. Próximo: M15 S00.

## Auditoria transversal da fase frontend

## S03–S05 — integração real

Ed25519, payload canônico, TOFU/pins persistentes, detecção explícita de troca
e chave privada cifrada pelo secure storage foram integrados. 3/3 casos,
typecheck, build e lint focado passaram. Checkpoint funcional
READY_FOR_REVIEW/PENDING; S06–S08 e hardware pendentes.

Jornadas conectadas e correções finais registradas em [auditoria](../../execution/FRONTEND_COVERAGE_AUDIT.md) e [validação final](../../execution/evidence/FINAL_VALIDATION.md). Esta atualização não muda aceites humanos existentes. S03–S08 continuam adiadas.
