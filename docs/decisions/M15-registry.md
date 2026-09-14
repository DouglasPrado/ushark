# M15 — Registry v1

O cliente usa HTTP JSON autenticado por bearer token configurado fora do
renderer. Publicação executa stage idempotente, depois commit com
`expectedVersion`; timeout 15 s, conflito explícito e nenhuma ativação local
após falha parcial. O ambiente de produção e credenciais não são definidos nem
publicados por este milestone.
